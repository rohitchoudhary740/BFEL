from decimal import Decimal
from typing import Union, Optional, Dict, Any
from django.db import transaction
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils import timezone

from apps.payments.models import Payment
from apps.orders.models import Order
from apps.users.models import Role
from services.orders import transition_order_state
from services.wallet import DistributorWalletService
from services.audit import AuditService

class PaymentService:
    """
    Authoritative service for payment submission, duplicate prevention,
    and accounts desk verification/rejection.
    """

    @classmethod
    def submit_payment(
        cls,
        order: Union[Order, int],
        payment_mode: str,
        utr_number: str,
        bank_name: str,
        submitted_by,
        amount: Optional[Decimal] = None,
        receipt_url: str = '',
    ) -> Payment:
        """
        Submits advance payment for a feed order.
        Strict rule: Never trust frontend amount values; backend validates authoritative advance payable.
        Idempotency: Prevents duplicate UTR registration.
        """
        if isinstance(order, (int, str)):
            order = Order.objects.get(pk=order)

        utr = utr_number.strip().upper() if utr_number else ''
        if not utr:
            raise ValidationError("UTR / payment reference number is required.")

        # Duplicate payment check
        if Payment.objects.filter(utr_number=utr).exists():
            raise ValidationError(
                f"Duplicate payment rejected: UTR '{utr}' has already been registered."
            )

        # Order status validation
        if order.status not in {Order.Status.PAYMENT_PENDING, Order.Status.DRAFT, Order.Status.PLACED}:
            if order.status in {Order.Status.PAYMENT_VERIFIED, Order.Status.LOADING_QUEUED, Order.Status.LOADING}:
                raise ValidationError(
                    f"Order '{order.order_number}' has already completed advance payment verification."
                )

        # Authoritative required amount check
        required_advance = order.advance_payable - order.advance_paid
        if required_advance <= Decimal('0.00'):
            raise ValidationError(f"Order '{order.order_number}' does not require any additional advance payment.")

        if amount is not None:
            amount = Decimal(str(amount))
            if amount != required_advance:
                raise ValidationError(
                    f"Payment amount mismatch: Order requires advance of ₹{required_advance}, "
                    f"but received ₹{amount}. Frontend amounts are not authoritative."
                )
        else:
            amount = required_advance

        with transaction.atomic():
            # If payment is from Distributor Wallet, debit wallet immediately
            if payment_mode == Payment.Mode.WALLET:
                distributor = order.distributor
                if not distributor:
                    raise ValidationError("Cannot charge wallet: No distributor linked to this order.")
                wallet = DistributorWalletService.get_or_create_wallet(distributor)
                DistributorWalletService.debit_wallet(
                    wallet=wallet,
                    amount=amount,
                    reference=f"ORDER-{order.order_number}",
                    description=f"100% Advance payment for Order {order.order_number}",
                    actor=submitted_by,
                )

            payment = Payment.objects.create(
                order=order,
                dealer=order.dealer,
                amount=amount,
                payment_mode=payment_mode,
                utr_number=utr,
                bank_name=bank_name,
                status=Payment.Status.PENDING,
                receipt_url=receipt_url,
                submitted_by=submitted_by,
            )

            # Move order from PAYMENT_PENDING to PAYMENT_SUBMITTED
            if order.status == Order.Status.PAYMENT_PENDING:
                role_code = getattr(getattr(submitted_by, 'role', None), 'code', 'dealer')
                transition_order_state(order, Order.Status.PAYMENT_SUBMITTED, actor=submitted_by, role=role_code)

            AuditService.log_event(
                action='PAYMENT_SUBMITTED',
                entity='Payment',
                entity_id=payment.utr_number,
                role=getattr(getattr(submitted_by, 'role', None), 'code', 'system'),
                actor=submitted_by,
                metadata={
                    'order_number': order.order_number,
                    'amount': str(amount),
                    'payment_mode': payment_mode,
                }
            )

        return payment

    @classmethod
    def verify_payment(
        cls,
        payment: Union[Payment, int],
        user,
        notes: str = '',
    ) -> Payment:
        """
        Accounts officer verifies bank remittance and unlocks order for plant loading.
        Enforces role check, duplicate verification prevention, and automatic order transition.
        """
        role_code = getattr(getattr(user, 'role', None), 'code', None)
        if not (user.is_superuser or role_code in {Role.Code.ACCOUNTS, Role.Code.ADMIN}):
            raise PermissionDenied("Only Accounts Desk or Administrator is authorized to verify payments.")

        payment_id = payment.pk if isinstance(payment, Payment) else payment

        with transaction.atomic():
            payment = Payment.objects.select_for_update().get(pk=payment_id)

            if payment.status == Payment.Status.VERIFIED:
                raise ValidationError("Payment has already been verified. Duplicate verification prohibited.")

            if payment.status == Payment.Status.REJECTED:
                raise ValidationError("Cannot verify a rejected payment without resubmission.")

            payment.status = Payment.Status.VERIFIED
            payment.verified_by = user
            payment.verified_at = timezone.now()
            payment.save()

            order = Order.objects.select_for_update().get(pk=payment.order.pk)
            order.advance_paid += payment.amount
            order.save()

            # Trigger Order Transition if 100% advance payment is now satisfied
            if order.advance_paid >= order.advance_payable:
                if order.status == Order.Status.PAYMENT_SUBMITTED:
                    transition_order_state(
                        order=order,
                        new_status=Order.Status.PAYMENT_VERIFIED,
                        actor=user,
                        role='accounts',
                        metadata={'verified_payment_utr': payment.utr_number, 'notes': notes}
                    )

            AuditService.log_event(
                action='PAYMENT_VERIFIED',
                entity='Payment',
                entity_id=payment.utr_number,
                role='accounts',
                actor=user,
                metadata={
                    'order_number': order.order_number,
                    'amount': str(payment.amount),
                    'order_advance_paid': str(order.advance_paid),
                    'order_status': order.status,
                }
            )

        return payment

    @classmethod
    def reject_payment(
        cls,
        payment: Union[Payment, int],
        user,
        reason: str,
    ) -> Payment:
        """
        Accounts officer rejects invalid remittance and reverts order to PAYMENT_PENDING.
        """
        role_code = getattr(getattr(user, 'role', None), 'code', None)
        if not (user.is_superuser or role_code in {Role.Code.ACCOUNTS, Role.Code.ADMIN}):
            raise PermissionDenied("Only Accounts Desk or Administrator is authorized to reject payments.")

        if not reason or not reason.strip():
            raise ValidationError("Rejection reason is required.")

        payment_id = payment.pk if isinstance(payment, Payment) else payment

        with transaction.atomic():
            payment = Payment.objects.select_for_update().get(pk=payment_id)

            if payment.status == Payment.Status.VERIFIED:
                raise ValidationError("Cannot reject an already verified payment.")

            payment.status = Payment.Status.REJECTED
            payment.verified_by = user
            payment.verified_at = timezone.now()
            payment.rejection_reason = reason.strip()
            payment.save()

            order = Order.objects.select_for_update().get(pk=payment.order.pk)
            # Revert order from PAYMENT_SUBMITTED back to PAYMENT_PENDING
            if order.status == Order.Status.PAYMENT_SUBMITTED:
                transition_order_state(
                    order=order,
                    new_status=Order.Status.PAYMENT_PENDING,
                    actor=user,
                    role='accounts',
                    metadata={'rejection_reason': reason.strip()}
                )

            AuditService.log_event(
                action='PAYMENT_REJECTED',
                entity='Payment',
                entity_id=payment.utr_number,
                role='accounts',
                actor=user,
                metadata={
                    'order_number': order.order_number,
                    'rejection_reason': reason.strip(),
                }
            )

        return payment
