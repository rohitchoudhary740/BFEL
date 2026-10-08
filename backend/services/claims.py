import os
import uuid
import logging
from decimal import Decimal
from typing import Union, Optional, List, Dict, Any
from django.db import transaction
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils import timezone
from django.conf import settings

from apps.claims.models import Claim, ClaimEvidence
from apps.orders.models import Order
from apps.dealers.models import Dealer
from apps.users.models import Role
from services.audit import AuditService
from services.wallet import DistributorWalletService
from services.whatsapp import WhatsAppService

logger = logging.getLogger(__name__)

# Constants for file evidence validation
MAX_EVIDENCE_SIZE_BYTES = getattr(settings, 'CLAIM_EVIDENCE_MAX_SIZE_BYTES', 5 * 1024 * 1024)  # 5 MB
ALLOWED_EVIDENCE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
ALLOWED_EVIDENCE_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp'}


class ClaimService:
    """
    Authoritative domain service for filing, inspecting, reviewing,
    and resolving post-delivery shortage and quality/damage claims.
    """

    @classmethod
    def normalize_claim_type(cls, raw_type: str) -> str:
        """
        Normalizes various claim type string inputs to canonical choices.
        """
        if not raw_type:
            raise ValidationError("Claim type is required.")
        norm = raw_type.strip().upper().replace(' ', '_').replace('/', '_')
        if norm in {'SHORTAGE', 'SHORT'}:
            return Claim.ClaimType.SHORTAGE
        if norm in {'QUALITY_DAMAGE', 'QUALITY_DEFECT', 'QUALITY_ISSUE', 'DAMAGE', 'DAMAGED_BAGS', 'QUALITY'}:
            return Claim.ClaimType.QUALITY_DAMAGE
        if norm == 'shortage':
            return Claim.ClaimType.SHORTAGE
        if norm == 'damaged_bags' or norm == 'quality_issue':
            return Claim.ClaimType.QUALITY_DAMAGE

        # Direct check against choices
        for val, _ in Claim.ClaimType.choices:
            if norm == val.upper():
                return val

        raise ValidationError(
            f"Invalid claim type '{raw_type}'. Allowed types are 'SHORTAGE' and 'QUALITY/DAMAGE'."
        )

    @classmethod
    def validate_evidence_file(cls, file_obj) -> Dict[str, Any]:
        """
        Validates evidence photo file properties:
        - Must not be empty.
        - Must not exceed the maximum allowed size (5 MB).
        - Must have a supported image MIME type and file extension (JPEG, PNG, WebP).
        """
        if not file_obj:
            raise ValidationError("No evidence file provided.")

        name = getattr(file_obj, 'name', '') or ''
        _, ext = os.path.splitext(name.lower())
        content_type = getattr(file_obj, 'content_type', '') or ''
        size = getattr(file_obj, 'size', 0)

        if size == 0:
            raise ValidationError(f"Evidence file '{name}' is empty (0 bytes).")

        if size > MAX_EVIDENCE_SIZE_BYTES:
            size_mb = size / (1024 * 1024)
            raise ValidationError(
                f"File '{name}' size ({size_mb:.2f} MB) exceeds maximum allowed limit of 5.00 MB."
            )

        has_valid_ext = ext in ALLOWED_EVIDENCE_EXTENSIONS
        has_valid_mime = content_type in ALLOWED_EVIDENCE_MIME_TYPES

        # Strict validation: Extension must be allowed, and content_type if present must be allowed
        if not has_valid_ext or (content_type and not has_valid_mime):
            raise ValidationError(
                f"Invalid file type for '{name}'. Only JPEG, PNG, and WebP images are permitted."
            )

        return {
            'file_name': name,
            'content_type': content_type or ('image/png' if ext == '.png' else 'image/jpeg'),
            'size_bytes': size,
        }

    @classmethod
    def add_evidence(
        cls,
        claim: Claim,
        file_obj,
        caption: str = '',
        uploaded_by=None
    ) -> ClaimEvidence:
        """
        Validates and attaches a photo evidence file to a claim.
        Binary is stored via Django file storage (never raw in PostgreSQL).
        """
        meta = cls.validate_evidence_file(file_obj)

        evidence = ClaimEvidence(
            claim=claim,
            file=file_obj,
            file_reference=meta['file_name'],
            content_type=meta['content_type'],
            size_bytes=meta['size_bytes'],
            caption=caption or meta['file_name'],
        )
        evidence.save()
        return evidence

    @classmethod
    def file_claim(
        cls,
        order: Union[Order, int, str],
        dealer: Union[Dealer, int, str],
        claim_type: str,
        affected_bags: int,
        description: str,
        created_by=None,
        evidence_files: Optional[List[Any]] = None,
    ) -> Claim:
        """
        Files a new shortage or quality/damage claim against a dispatched/delivered order.
        Strict validations:
        - Order must belong to the dealer.
        - Dealer can only file for their own dealership.
        - Order must be in DISPATCHED, DELIVERED, or GATE_CLEARED status.
        - Affected bags must be > 0 and <= order.total_bags.
        - Duplicate prevention: cannot file multiple active claims for the same order.
        - Evidence files (if provided) are validated for type and size.
        """
        if isinstance(order, (int, str)):
            order = Order.objects.get(pk=order)
        if isinstance(dealer, (int, str)):
            dealer = Dealer.objects.get(pk=dealer)

        # 1. Order ownership check
        if order.dealer_id != dealer.pk:
            raise ValidationError("Order does not belong to the specified dealer.")

        # 2. Creator role & ownership security
        if created_by and getattr(created_by, 'is_authenticated', False):
            role_code = getattr(getattr(created_by, 'role', None), 'code', None)
            if role_code == Role.Code.DEALER:
                dealer_profile = getattr(created_by, 'dealer_profile', None)
                if not dealer_profile or dealer_profile.pk != dealer.pk:
                    raise PermissionDenied("Dealers can only file claims for their own dealership.")

        # 3. Order status check (Must be dispatched / delivered)
        eligible_statuses = {
            Order.Status.DISPATCHED,
            Order.Status.DELIVERED,
            Order.Status.GATE_CLEARED,
        }
        if order.status not in eligible_statuses:
            raise ValidationError(
                f"Cannot file claim: Order '{order.order_number}' has status '{order.status}'. "
                f"Claims can only be filed after loading clearance and dispatch."
            )

        # 4. Bag count check
        try:
            affected_bags = int(affected_bags)
        except (ValueError, TypeError):
            raise ValidationError("Affected bags must be a valid integer.")

        if affected_bags <= 0:
            raise ValidationError("Affected bags must be greater than zero.")

        if affected_bags > order.total_bags:
            raise ValidationError(
                f"Affected bags ({affected_bags}) cannot exceed total order bags ({order.total_bags})."
            )

        # 5. Normalize claim type
        normalized_claim_type = cls.normalize_claim_type(claim_type)

        # 6. Duplicate claim prevention
        active_statuses = [
            Claim.Status.CREATED,
            Claim.Status.UNDER_REVIEW,
            'submitted',
            'under_review',
        ]
        existing_active = Claim.objects.filter(order=order, status__in=active_statuses).first()
        if existing_active:
            raise ValidationError(
                f"Duplicate claim rejected: An active claim '{existing_active.claim_number}' "
                f"({existing_active.status}) already exists for Order '{order.order_number}'."
            )

        # Also prevent filing duplicate claim of the same type if one was already approved
        same_type_approved = Claim.objects.filter(
            order=order,
            claim_type=normalized_claim_type,
            status__in=[Claim.Status.APPROVED, 'approved']
        ).first()
        if same_type_approved:
            raise ValidationError(
                f"Duplicate claim rejected: A '{normalized_claim_type}' claim '{same_type_approved.claim_number}' "
                f"has already been approved for Order '{order.order_number}'."
            )

        desc = (description or '').strip()
        if not desc:
            raise ValidationError("Claim description is required.")

        # Validate all evidence files first before opening transaction
        if evidence_files:
            for f in evidence_files:
                cls.validate_evidence_file(f)

        claim_number = f"CLM-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        with transaction.atomic():
            shortage_bags = affected_bags
            shortage_weight_kg = Decimal(affected_bags * 50)
            received_bags = max(0, order.total_bags - affected_bags) if normalized_claim_type == Claim.ClaimType.SHORTAGE else order.total_bags

            claim = Claim.objects.create(
                claim_number=claim_number,
                order=order,
                dealer=dealer,
                claim_type=normalized_claim_type,
                affected_bags=affected_bags,
                expected_bags=order.total_bags,
                received_bags=received_bags,
                shortage_bags=shortage_bags,
                shortage_weight_kg=shortage_weight_kg,
                description=desc,
                status=Claim.Status.CREATED,
                created_by=created_by,
            )

            if evidence_files:
                for f in evidence_files:
                    cls.add_evidence(claim, f, uploaded_by=created_by)

            AuditService.log_event(
                action='CLAIM_CREATED',
                entity='Claim',
                entity_id=claim.claim_number,
                role=getattr(getattr(created_by, 'role', None), 'code', 'dealer'),
                actor=created_by,
                metadata={
                    'order_number': order.order_number,
                    'dealer_name': dealer.dealership_name,
                    'claim_type': normalized_claim_type,
                    'affected_bags': affected_bags,
                    'evidence_count': len(evidence_files or []),
                }
            )

        return claim

    @classmethod
    def mark_under_review(
        cls,
        claim: Union[Claim, int, str],
        reviewer,
        review_notes: str = ''
    ) -> Claim:
        """
        Transitions a submitted/created claim into 'Under Review'.
        Restricted to Accounts personnel or Admin.
        """
        if isinstance(claim, (int, str)):
            claim = Claim.objects.get(pk=claim)

        cls._verify_reviewer_permission(reviewer)

        if claim.status not in {Claim.Status.CREATED, 'submitted'}:
            raise ValidationError(
                f"Claim '{claim.claim_number}' cannot be marked under review from status '{claim.status}'."
            )

        claim.status = Claim.Status.UNDER_REVIEW
        claim.reviewed_by = reviewer
        claim.reviewed_at = timezone.now()
        if review_notes:
            claim.review_notes = review_notes
            claim.admin_remarks = review_notes
        claim.save()

        AuditService.log_event(
            action='CLAIM_UNDER_REVIEW',
            entity='Claim',
            entity_id=claim.claim_number,
            role=getattr(getattr(reviewer, 'role', None), 'code', 'accounts'),
            actor=reviewer,
            metadata={'review_notes': review_notes}
        )
        return claim

    @classmethod
    def approve_claim(
        cls,
        claim: Union[Claim, int, str],
        reviewer,
        approved_amount: Optional[Decimal] = None,
        review_notes: str = '',
    ) -> Claim:
        """
        Approves a claim and issues an authoritative credit note.
        - Calculates or validates credit note refund amount.
        - Credits distributor wallet (if linked to order).
        - Transitions claim to APPROVED.
        - Sends operational WhatsApp alert.
        """
        if isinstance(claim, (int, str)):
            claim = Claim.objects.get(pk=claim)

        cls._verify_reviewer_permission(reviewer)

        allowed_from = {Claim.Status.CREATED, Claim.Status.UNDER_REVIEW, 'submitted', 'under_review'}
        if claim.status not in allowed_from:
            raise ValidationError(
                f"Claim '{claim.claim_number}' in status '{claim.status}' cannot be approved."
            )

        order = claim.order

        # Calculate authoritative credit note amount
        if approved_amount is not None:
            approved_amount = Decimal(str(approved_amount))
            if approved_amount <= Decimal('0.00'):
                raise ValidationError("Credit note amount must be greater than zero.")
            if approved_amount > order.net_total:
                raise ValidationError(
                    f"Credit note amount (₹{approved_amount}) cannot exceed total order value (₹{order.net_total})."
                )
        else:
            # Pro-rata bag calculation based on order net total and total bag count
            if order.total_bags > 0:
                bag_price = order.net_total / Decimal(order.total_bags)
                approved_amount = (bag_price * Decimal(claim.affected_bags)).quantize(Decimal('0.01'))
            else:
                approved_amount = Decimal('0.00')

        credit_note_id = f"CN-{claim.claim_number}"

        with transaction.atomic():
            claim.status = Claim.Status.APPROVED
            claim.reviewed_by = reviewer
            claim.reviewed_at = timezone.now()
            claim.review_notes = review_notes or 'Claim approved upon review.'
            claim.admin_remarks = claim.review_notes
            claim.credit_note_id = credit_note_id
            claim.credit_note_amount = approved_amount
            claim.save()

            # Credit distributor wallet if order is backed by a distributor
            if order.distributor and approved_amount > Decimal('0.00'):
                wallet = DistributorWalletService.get_or_create_wallet(order.distributor)
                DistributorWalletService.credit_wallet(
                    wallet=wallet,
                    amount=approved_amount,
                    reference=credit_note_id,
                    description=f"Credit Note {credit_note_id} for Claim {claim.claim_number} ({claim.claim_type})",
                    actor=reviewer,
                )

            AuditService.log_event(
                action='CLAIM_APPROVED',
                entity='Claim',
                entity_id=claim.claim_number,
                role=getattr(getattr(reviewer, 'role', None), 'code', 'accounts'),
                actor=reviewer,
                metadata={
                    'credit_note_id': credit_note_id,
                    'credit_note_amount': str(approved_amount),
                    'review_notes': claim.review_notes,
                }
            )

        # Notify via WhatsApp
        try:
            WhatsAppService.send_claim_update(claim)
        except Exception as e:
            logger.warning(f"Failed to send claim approval WhatsApp notification: {e}")

        return claim

    @classmethod
    def reject_claim(
        cls,
        claim: Union[Claim, int, str],
        reviewer,
        rejection_reason: str,
    ) -> Claim:
        """
        Rejects a claim with an authoritative reason.
        Restricted to Accounts personnel or Admin.
        """
        if isinstance(claim, (int, str)):
            claim = Claim.objects.get(pk=claim)

        cls._verify_reviewer_permission(reviewer)

        reason = (rejection_reason or '').strip()
        if not reason:
            raise ValidationError("Rejection reason is mandatory to reject a claim.")

        allowed_from = {Claim.Status.CREATED, Claim.Status.UNDER_REVIEW, 'submitted', 'under_review'}
        if claim.status not in allowed_from:
            raise ValidationError(
                f"Claim '{claim.claim_number}' in status '{claim.status}' cannot be rejected."
            )

        with transaction.atomic():
            claim.status = Claim.Status.REJECTED
            claim.reviewed_by = reviewer
            claim.reviewed_at = timezone.now()
            claim.review_notes = reason
            claim.admin_remarks = reason
            claim.save()

            AuditService.log_event(
                action='CLAIM_REJECTED',
                entity='Claim',
                entity_id=claim.claim_number,
                role=getattr(getattr(reviewer, 'role', None), 'code', 'accounts'),
                actor=reviewer,
                metadata={
                    'rejection_reason': reason,
                }
            )

        try:
            WhatsAppService.send_claim_update(claim)
        except Exception as e:
            logger.warning(f"Failed to send claim rejection WhatsApp notification: {e}")

        return claim

    @classmethod
    def verify_dealer_access(cls, claim: Claim, user):
        """
        Ensures a dealer user can only access their own claims.
        Accounts and Admin have global access.
        """
        if not user or not getattr(user, 'is_authenticated', False):
            raise PermissionDenied("Authentication required to access claims.")

        role_code = getattr(getattr(user, 'role', None), 'code', None)
        is_staff = getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)

        if role_code in {Role.Code.ACCOUNTS, Role.Code.ADMIN} or is_staff:
            return True

        if role_code == Role.Code.DEALER:
            dealer_profile = getattr(user, 'dealer_profile', None)
            if not dealer_profile or claim.dealer_id != dealer_profile.pk:
                raise PermissionDenied("Dealers are strictly restricted to accessing their own claims.")
            return True

        if role_code == Role.Code.SALES_AGENT:
            agent_profile = getattr(user, 'sales_agent_profile', None)
            if agent_profile and claim.dealer.assigned_sales_agent_id == agent_profile.pk:
                return True
            raise PermissionDenied("Sales agents can only access claims of their assigned dealers.")

        raise PermissionDenied("You do not have permission to access this claim.")

    @staticmethod
    def _verify_reviewer_permission(reviewer):
        if not reviewer or not getattr(reviewer, 'is_authenticated', False):
            raise PermissionDenied("Authentication required to review claims.")

        role_code = getattr(getattr(reviewer, 'role', None), 'code', None)
        is_staff = getattr(reviewer, 'is_staff', False) or getattr(reviewer, 'is_superuser', False)

        if role_code not in {Role.Code.ACCOUNTS, Role.Code.ADMIN} and not is_staff:
            raise PermissionDenied("Only Accounts personnel or Central Admin can review and resolve claims.")
