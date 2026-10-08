import hashlib
import json
from decimal import Decimal
from typing import Dict, Any, List, Optional, Union
from django.db.models import Q, Count, Sum
from django.utils import timezone
from django.core.exceptions import PermissionDenied, ValidationError

from apps.orders.models import Order
from apps.loading.models import LoadingSession, Truck, Driver, LoadingBay
from apps.dispatch.models import GatePass, Dispatch
from apps.claims.models import Claim
from apps.payments.models import Payment
from apps.dealers.models import Dealer
from apps.distributors.models import Distributor, DistributorWallet, WalletLedgerEntry
from apps.accounts.models import AuditEvent
from apps.users.models import Role


class OperationalLiveUpdateService:
    """
    Authoritative service providing live operational status aggregation
    and real-time delta synchronization directly from PostgreSQL.
    Strict rule: Never invents state; PostgreSQL is the single source of truth.
    """

    @classmethod
    def get_order_live_status(cls, order: Union[Order, int, str], user=None) -> Dict[str, Any]:
        """
        Returns full live tracking for an order across all 5 operational milestones:
        [PAYMENT] -> [LOADING] -> [GATE_PASS] -> [DISPATCH] -> [CLAIMS]
        """
        if isinstance(order, (int, str)):
            order = Order.objects.select_related(
                'dealer', 'distributor', 'created_by'
            ).prefetch_related('items__product', 'payments', 'claims').get(pk=order)

        # Ownership verification
        if user and getattr(user, 'is_authenticated', False):
            role_code = getattr(getattr(user, 'role', None), 'code', None)
            if role_code == Role.Code.DEALER:
                dealer_profile = getattr(user, 'dealer_profile', None)
                if not dealer_profile or order.dealer_id != dealer_profile.pk:
                    raise PermissionDenied("Dealers are restricted to tracking their own orders.")

        # Payment details
        verified_payments = [p for p in order.payments.all() if p.status == Payment.Status.VERIFIED]
        pending_payments = [p for p in order.payments.all() if p.status == Payment.Status.PENDING]
        is_payment_verified = (order.advance_paid >= order.advance_payable) and len(verified_payments) > 0

        # Loading session
        active_session = LoadingSession.objects.filter(order=order).select_related(
            'truck', 'driver', 'bay'
        ).order_by('-started_at').first()

        # Gate pass
        gate_pass = getattr(order, 'gate_pass', None) or GatePass.objects.filter(order=order).first()

        # Dispatch
        dispatch = Dispatch.objects.filter(order=order).select_related(
            'truck', 'driver', 'gate_pass'
        ).first()

        # Claims
        latest_claim = order.claims.all().order_by('-created_at').first()

        # Human-readable operational stage description
        current_step_text = cls._resolve_current_step_text(order, is_payment_verified, active_session, gate_pass, dispatch, latest_claim)

        return {
            'order_id': order.pk,
            'order_number': order.order_number,
            'status': order.status,
            'current_step': current_step_text,
            'destination': order.destination,
            'truck_capacity': order.truck_capacity,
            'total_bags': order.total_bags,
            'net_total': str(order.net_total),
            'advance_payable': str(order.advance_payable),
            'advance_paid': str(order.advance_paid),
            'dealer': {
                'id': order.dealer.pk,
                'name': order.dealer.dealership_name,
                'city': order.dealer.city,
            },
            'payment': {
                'is_verified': is_payment_verified,
                'status': 'VERIFIED' if is_payment_verified else ('PENDING_VERIFICATION' if pending_payments else 'AWAITING_PAYMENT'),
                'advance_paid': str(order.advance_paid),
                'advance_payable': str(order.advance_payable),
                'verified_payments_count': len(verified_payments),
                'pending_payments_count': len(pending_payments),
                'latest_utr': verified_payments[-1].utr_number if verified_payments else (pending_payments[0].utr_number if pending_payments else None),
            },
            'loading': {
                'is_eligible': order.status in {
                    Order.Status.PAYMENT_VERIFIED,
                    Order.Status.LOADING_QUEUED,
                    Order.Status.LOADING,
                    Order.Status.LOADED,
                    Order.Status.GATE_CLEARED,
                    Order.Status.DISPATCHED,
                    Order.Status.DELIVERED,
                },
                'is_queued': order.status in {Order.Status.PAYMENT_VERIFIED, Order.Status.LOADING_QUEUED} and not active_session,
                'session_status': active_session.status if active_session else None,
                'truck': active_session.truck.registration_number if active_session and active_session.truck else None,
                'driver': active_session.driver.name if active_session and active_session.driver else None,
                'bay': active_session.bay.bay_number if active_session and active_session.bay else None,
                'bags_counted': active_session.bags_loaded if active_session else 0,
                'is_loaded': order.status in {Order.Status.LOADED, Order.Status.GATE_CLEARED, Order.Status.DISPATCHED, Order.Status.DELIVERED},
                'seal_number': active_session.seal_number if active_session else '',
            },
            'gate_pass': {
                'is_available': gate_pass is not None,
                'pass_number': gate_pass.gate_pass_number if gate_pass else None,
                'qr_code_hash': gate_pass.qr_code_hash if gate_pass else None,
                'issued_at': gate_pass.issued_at.isoformat() if gate_pass and gate_pass.issued_at else None,
                'is_cleared': order.status in {Order.Status.GATE_CLEARED, Order.Status.DISPATCHED, Order.Status.DELIVERED},
            },
            'dispatch': {
                'is_dispatched': order.status in {Order.Status.DISPATCHED, Order.Status.DELIVERED, Order.Status.CLAIM_PENDING, Order.Status.CLOSED},
                'lr_number': dispatch.lr_number if dispatch else None,
                'dispatched_at': dispatch.dispatched_at.isoformat() if dispatch and dispatch.dispatched_at else None,
                'truck': dispatch.truck.registration_number if dispatch and dispatch.truck else (active_session.truck.registration_number if active_session and active_session.truck else None),
                'driver': dispatch.driver.name if dispatch and dispatch.driver else (active_session.driver.name if active_session and active_session.driver else None),
                'destination': dispatch.destination if dispatch and dispatch.destination else order.destination,
            },
            'claims': {
                'has_claim': latest_claim is not None,
                'claim_number': latest_claim.claim_number if latest_claim else None,
                'claim_type': latest_claim.claim_type if latest_claim else None,
                'affected_bags': latest_claim.affected_bags if latest_claim else 0,
                'status': latest_claim.status if latest_claim else None,
                'credit_note_id': latest_claim.credit_note_id if latest_claim else '',
                'credit_note_amount': str(latest_claim.credit_note_amount) if latest_claim else '0.00',
            },
            'updated_at': order.updated_at.isoformat() if hasattr(order, 'updated_at') and order.updated_at else None,
        }

    @classmethod
    def _resolve_current_step_text(cls, order, is_payment_verified, active_session, gate_pass, dispatch, claim) -> str:
        if order.status in {Order.Status.DRAFT, Order.Status.PLACED, Order.Status.PAYMENT_PENDING}:
            return "Awaiting 100% Advance Payment"
        if order.status == Order.Status.PAYMENT_SUBMITTED:
            return "Advance Payment Submitted — Under Accounts Verification"
        if order.status in {Order.Status.PAYMENT_VERIFIED, Order.Status.LOADING_QUEUED}:
            return "Payment Verified — Queued for Plant Loading"
        if order.status == Order.Status.LOADING:
            bay_info = f" at {active_session.bay.bay_number}" if active_session and active_session.bay else ""
            return f"Loading in Progress{bay_info}"
        if order.status == Order.Status.LOADED:
            return "Loading Completed — Awaiting Security Gate Clearance"
        if order.status == Order.Status.GATE_CLEARED:
            return "Gate Pass Cleared — Ready for Road Dispatch"
        if order.status == Order.Status.DISPATCHED:
            lr_info = f" (LR: {dispatch.lr_number})" if dispatch and dispatch.lr_number else ""
            return f"Dispatched in Transit{lr_info}"
        if order.status == Order.Status.DELIVERED:
            return "Delivered at Destination Mandi"
        if order.status == Order.Status.CLAIM_PENDING or (claim and claim.status in {Claim.Status.CREATED, Claim.Status.UNDER_REVIEW}):
            return f"Discrepancy Claim Filed ({claim.claim_number}) — Under Review"
        if order.status == Order.Status.CLOSED:
            return "Order Fulfilled & Closed"
        if order.status == Order.Status.CANCELLED:
            return "Order Cancelled"
        return order.status

    @classmethod
    def get_loading_queue(cls) -> Dict[str, Any]:
        """
        Plant Loading Terminal live queue:
        - Orders waiting for truck & bay assignment (payment verified)
        - Active loading sessions in bays
        - Completed loading sessions awaiting gate clearance
        - Gate-cleared orders ready for road dispatch
        """
        # 1. Orders waiting for bay assignment
        queued_orders_qs = Order.objects.filter(
            status__in=[Order.Status.PAYMENT_VERIFIED, Order.Status.LOADING_QUEUED]
        ).select_related('dealer').order_by('created_at')

        queued_orders = []
        for o in queued_orders_qs:
            queued_orders.append({
                'order_id': o.pk,
                'order_number': o.order_number,
                'dealer_name': o.dealer.dealership_name,
                'destination': o.destination,
                'truck_capacity': o.truck_capacity,
                'total_bags': o.total_bags,
                'status': o.status,
                'advance_paid': str(o.advance_paid),
                'created_at': o.created_at.isoformat() if o.created_at else None,
            })

        # 2. Active loading sessions
        active_sessions_qs = LoadingSession.objects.filter(
            status__in=[LoadingSession.Status.QUEUED, LoadingSession.Status.IN_PROGRESS]
        ).select_related('order', 'truck', 'driver', 'bay').order_by('started_at')

        active_sessions = []
        for s in active_sessions_qs:
            active_sessions.append({
                'session_id': s.pk,
                'order_number': s.order.order_number,
                'truck': s.truck.registration_number,
                'driver': s.driver.name,
                'bay': s.bay.bay_number,
                'status': s.status,
                'expected_bags': s.expected_bags,
                'bags_counted': s.bags_loaded,
                'started_at': s.started_at.isoformat() if s.started_at else None,
            })

        # 3. Completed loading awaiting gate pass
        awaiting_gate_pass_qs = LoadingSession.objects.filter(
            status=LoadingSession.Status.COMPLETED,
            order__status=Order.Status.LOADED
        ).select_related('order', 'truck', 'driver').order_by('completed_at')

        awaiting_gate_pass = []
        for s in awaiting_gate_pass_qs:
            awaiting_gate_pass.append({
                'session_id': s.pk,
                'order_number': s.order.order_number,
                'truck': s.truck.registration_number,
                'driver': s.driver.name,
                'seal_number': s.seal_number,
                'completed_at': s.completed_at.isoformat() if s.completed_at else None,
            })

        # 4. Gate-cleared orders ready for road dispatch
        ready_for_dispatch_qs = Order.objects.filter(
            status=Order.Status.GATE_CLEARED
        ).select_related('dealer').order_by('updated_at')

        ready_for_dispatch = []
        for o in ready_for_dispatch_qs:
            gp = getattr(o, 'gate_pass', None) or GatePass.objects.filter(order=o).first()
            ready_for_dispatch.append({
                'order_id': o.pk,
                'order_number': o.order_number,
                'dealer_name': o.dealer.dealership_name,
                'destination': o.destination,
                'gate_pass_number': gp.gate_pass_number if gp else None,
                'status': o.status,
            })

        return {
            'queued_orders': queued_orders,
            'active_sessions': active_sessions,
            'awaiting_gate_pass': awaiting_gate_pass,
            'ready_for_dispatch': ready_for_dispatch,
            'counts': {
                'queued_count': len(queued_orders),
                'active_loading_count': len(active_sessions),
                'awaiting_gate_pass_count': len(awaiting_gate_pass),
                'ready_for_dispatch_count': len(ready_for_dispatch),
            }
        }

    @classmethod
    def get_accounts_live(cls) -> Dict[str, Any]:
        """
        Finance and Accounts desk live operational overview:
        - Pending payment remittances to verify
        - Recently verified payments
        - Pending shortage / quality claims to review
        """
        pending_payments_qs = Payment.objects.filter(
            status=Payment.Status.PENDING
        ).select_related('order__dealer').order_by('-created_at')

        pending_payments = []
        for p in pending_payments_qs:
            pending_payments.append({
                'payment_id': p.pk,
                'order_id': p.order.pk,
                'order_number': p.order.order_number,
                'dealer_name': p.order.dealer.dealership_name,
                'amount': str(p.amount),
                'payment_mode': p.payment_mode,
                'utr_number': p.utr_number,
                'bank_name': p.bank_name,
                'submitted_at': p.created_at.isoformat() if p.created_at else None,
            })

        recently_verified_qs = Payment.objects.filter(
            status=Payment.Status.VERIFIED
        ).select_related('order__dealer', 'verified_by').order_by('-verified_at')[:15]

        recently_verified = []
        for p in recently_verified_qs:
            recently_verified.append({
                'payment_id': p.pk,
                'order_number': p.order.order_number,
                'dealer_name': p.order.dealer.dealership_name,
                'amount': str(p.amount),
                'utr_number': p.utr_number,
                'verified_by': p.verified_by.username if p.verified_by else 'accounts',
                'verified_at': p.verified_at.isoformat() if p.verified_at else None,
            })

        pending_claims_qs = Claim.objects.filter(
            status__in=[Claim.Status.CREATED, Claim.Status.UNDER_REVIEW, 'submitted', 'under_review']
        ).select_related('order', 'dealer').order_by('-created_at')

        pending_claims = []
        for c in pending_claims_qs:
            pending_claims.append({
                'claim_id': c.pk,
                'claim_number': c.claim_number,
                'order_number': c.order.order_number,
                'dealer_name': c.dealer.dealership_name,
                'claim_type': c.claim_type,
                'affected_bags': c.affected_bags,
                'status': c.status,
                'created_at': c.created_at.isoformat() if c.created_at else None,
            })

        return {
            'pending_payments': pending_payments,
            'recently_verified': recently_verified,
            'pending_claims': pending_claims,
            'counts': {
                'pending_payments_count': len(pending_payments),
                'recently_verified_count': len(recently_verified),
                'pending_claims_count': len(pending_claims),
            }
        }

    @classmethod
    def get_dealer_live_dashboard(cls, dealer_user) -> Dict[str, Any]:
        """
        Live operational view for Authorized Dealers:
        - Active order status tracking
        - Orders requiring payment
        - In-transit dispatches
        - Filed claims and resolution status
        """
        dealer = getattr(dealer_user, 'dealer_profile', None)
        if not dealer:
            dealer = Dealer.objects.filter(user=dealer_user).first()

        if not dealer:
            return {'active_orders': [], 'pending_payments': [], 'dispatches': [], 'claims': []}

        orders_qs = Order.objects.filter(
            dealer=dealer
        ).exclude(
            status__in=[Order.Status.CLOSED, Order.Status.CANCELLED]
        ).prefetch_related('payments', 'claims').order_by('-created_at')

        active_orders = [cls.get_order_live_status(o, user=dealer_user) for o in orders_qs]

        # Pending payments
        pending_payment_orders = [
            o for o in active_orders if o['status'] in {Order.Status.PAYMENT_PENDING, Order.Status.DRAFT, Order.Status.PLACED}
        ]

        # Dispatches in transit
        in_transit = [o for o in active_orders if o['status'] == Order.Status.DISPATCHED]

        # Claims
        claims_qs = Claim.objects.filter(dealer=dealer).order_by('-created_at')[:10]
        claims = []
        for c in claims_qs:
            claims.append({
                'claim_id': c.pk,
                'claim_number': c.claim_number,
                'order_number': c.order.order_number,
                'claim_type': c.claim_type,
                'affected_bags': c.affected_bags,
                'status': c.status,
                'credit_note_id': c.credit_note_id,
                'credit_note_amount': str(c.credit_note_amount),
                'created_at': c.created_at.isoformat() if c.created_at else None,
            })

        return {
            'dealer': {
                'id': dealer.pk,
                'name': dealer.dealership_name,
                'city': dealer.city,
                'mandi_yard': dealer.mandi_yard,
            },
            'active_orders': active_orders,
            'pending_payment_orders': pending_payment_orders,
            'in_transit_dispatches': in_transit,
            'claims': claims,
            'counts': {
                'active_orders_count': len(active_orders),
                'pending_payment_count': len(pending_payment_orders),
                'in_transit_count': len(in_transit),
                'claims_count': len(claims),
            }
        }

    @classmethod
    def get_distributor_live_dashboard(cls, dist_user) -> Dict[str, Any]:
        """
        Live operational overview for Regional Distributors:
        - Prepaid Wallet balance and credit limit
        - Recent ledger credits and debits
        - Affiliated dealer orders and status
        - Discrepancy claims and credit notes issued
        """
        distributor = getattr(dist_user, 'distributor_profile', None)
        if not distributor:
            from apps.distributors.models import Distributor
            distributor = Distributor.objects.filter(user=dist_user).first()

        if not distributor:
            return {'wallet': None, 'dealer_orders': [], 'claims': []}

        wallet, _ = DistributorWallet.objects.get_or_create(
            distributor=distributor,
            defaults={'available_balance': Decimal('0.00'), 'credit_limit': Decimal('1000000.00')}
        )

        ledger_qs = WalletLedgerEntry.objects.filter(wallet=wallet).order_by('-created_at')[:10]
        ledger = []
        for l in ledger_qs:
            ledger.append({
                'id': l.pk,
                'entry_type': l.entry_type,
                'amount': str(l.amount),
                'balance_after': str(l.balance_after),
                'reference': l.reference,
                'description': l.description,
                'created_at': l.created_at.isoformat() if l.created_at else None,
            })

        orders_qs = Order.objects.filter(
            Q(distributor=distributor) | Q(dealer__assigned_distributor=distributor)
        ).select_related('dealer').order_by('-created_at')[:15]

        dealer_orders = []
        for o in orders_qs:
            dealer_orders.append({
                'order_id': o.pk,
                'order_number': o.order_number,
                'dealer_name': o.dealer.dealership_name,
                'status': o.status,
                'net_total': str(o.net_total),
                'total_bags': o.total_bags,
                'created_at': o.created_at.isoformat() if o.created_at else None,
            })

        claims_qs = Claim.objects.filter(
            order__distributor=distributor
        ).select_related('order', 'dealer').order_by('-created_at')[:10]

        claims = []
        for c in claims_qs:
            claims.append({
                'claim_id': c.pk,
                'claim_number': c.claim_number,
                'order_number': c.order.order_number,
                'dealer_name': c.dealer.dealership_name,
                'claim_type': c.claim_type,
                'affected_bags': c.affected_bags,
                'status': c.status,
                'credit_note_id': c.credit_note_id,
                'credit_note_amount': str(c.credit_note_amount),
            })

        return {
            'distributor': {
                'id': distributor.pk,
                'company_name': distributor.company_name,
                'distributor_code': distributor.distributor_code,
            },
            'wallet': {
                'available_balance': str(wallet.available_balance),
                'reserved_funds': str(wallet.reserved_funds),
                'credit_limit': str(wallet.credit_limit),
            },
            'recent_ledger': ledger,
            'dealer_orders': dealer_orders,
            'claims': claims,
        }

    @classmethod
    def get_admin_live_stream(cls, since=None, limit=50) -> Dict[str, Any]:
        """
        Unified real-time operational stream for Central Admin Command Center.
        Aggregates immutable AuditEvent records with human-readable event descriptions.
        """
        events_qs = AuditEvent.objects.all().select_related('actor')
        if since:
            events_qs = events_qs.filter(timestamp__gt=since)

        events = []
        for ev in events_qs.order_by('-timestamp')[:limit]:
            events.append({
                'id': ev.pk,
                'action': ev.action,
                'role': ev.role,
                'actor': ev.actor.username if ev.actor else ev.actor_name or 'System',
                'entity': ev.entity,
                'entity_id': ev.entity_id,
                'timestamp': ev.timestamp.isoformat() if ev.timestamp else None,
                'metadata': ev.metadata,
                'summary': cls._summarize_audit_event(ev),
            })

        # Overall Plant Operational Funnel
        kpis = {
            'awaiting_payment_count': Order.objects.filter(status__in=[Order.Status.DRAFT, Order.Status.PLACED, Order.Status.PAYMENT_PENDING]).count(),
            'pending_verification_count': Payment.objects.filter(status=Payment.Status.PENDING).count(),
            'queued_for_loading_count': Order.objects.filter(status__in=[Order.Status.PAYMENT_VERIFIED, Order.Status.LOADING_QUEUED]).count(),
            'active_in_loading_bays_count': LoadingSession.objects.filter(status__in=[LoadingSession.Status.QUEUED, LoadingSession.Status.IN_PROGRESS]).count(),
            'gate_cleared_count': Order.objects.filter(status=Order.Status.GATE_CLEARED).count(),
            'dispatched_in_transit_count': Order.objects.filter(status=Order.Status.DISPATCHED).count(),
            'active_claims_count': Claim.objects.filter(status__in=[Claim.Status.CREATED, Claim.Status.UNDER_REVIEW]).count(),
        }

        return {
            'events': events,
            'kpis': kpis,
            'timestamp': timezone.now().isoformat(),
        }

    @classmethod
    def _summarize_audit_event(cls, ev: AuditEvent) -> str:
        meta = ev.metadata or {}
        actor = ev.actor.username if ev.actor else ev.actor_name or 'System'

        if ev.action == 'ORDER_CREATED':
            return f"Order #{ev.entity_id} created by {actor} ({meta.get('truck_capacity', '')})"
        if ev.action == 'PAYMENT_SUBMITTED':
            return f"Payment of ₹{meta.get('amount', '')} submitted for Order #{meta.get('order_number', '')} (UTR: {ev.entity_id})"
        if ev.action == 'PAYMENT_VERIFIED':
            return f"Payment UTR {ev.entity_id} verified by {actor}. Order #{meta.get('order_number', '')} advance cleared."
        if ev.action == 'TRUCK_ASSIGNED':
            return f"Truck {meta.get('truck', '')} assigned to Bay {meta.get('bay', '')} for Order #{meta.get('order_number', '')}"
        if ev.action == 'LOADING_STARTED':
            return f"Loading started at Bay {meta.get('bay', '')} for Order #{meta.get('order_number', '')}"
        if ev.action == 'BAGS_COUNTED':
            return f"Counted {meta.get('bags_counted', '')} bags for Order #{meta.get('order_number', '')}"
        if ev.action == 'WEIGHBRIDGE_RECORDED':
            return f"Weighbridge net weight {meta.get('net_weight_kg', '')} kg verified (Tolerance check: PASS)"
        if ev.action == 'LOADING_COMPLETED':
            return f"Loading completed for Order #{meta.get('order_number', '')}. Seal #{meta.get('seal_number', '')} applied."
        if ev.action == 'GATE_PASS_GENERATED':
            return f"Gate Pass #{ev.entity_id} issued for Order #{meta.get('order_number', '')}. Gate cleared."
        if ev.action == 'ORDER_DISPATCHED':
            return f"Order #{meta.get('order_number', '')} dispatched on Truck {meta.get('truck', '')} (LR: {meta.get('lr_number', '')})"
        if ev.action == 'CLAIM_CREATED':
            return f"Discrepancy Claim #{ev.entity_id} filed for Order #{meta.get('order_number', '')} ({meta.get('affected_bags', '')} bags {meta.get('claim_type', '')})"
        if ev.action == 'CLAIM_UNDER_REVIEW':
            return f"Claim #{ev.entity_id} placed under review by {actor}."
        if ev.action == 'CLAIM_APPROVED':
            return f"Claim #{ev.entity_id} approved. Credit Note #{meta.get('credit_note_id', '')} (₹{meta.get('credit_note_amount', '')}) issued."
        if ev.action == 'CLAIM_REJECTED':
            return f"Claim #{ev.entity_id} rejected by {actor}."
        if ev.action == 'WALLET_CREDITED':
            return f"Distributor Wallet credited with ₹{meta.get('amount', '')} (Ref: {meta.get('reference', '')})"
        return f"{ev.action} on {ev.entity}#{ev.entity_id} by {actor}"

    @classmethod
    def get_role_dashboard_snapshot(cls, user, since=None) -> Dict[str, Any]:
        """
        Universal role-aware operational snapshot endpoint designed for short-interval polling.
        Returns live state computed directly from PostgreSQL.
        """
        role_code = getattr(getattr(user, 'role', None), 'code', None)

        if user.is_superuser or role_code == Role.Code.ADMIN:
            data = cls.get_admin_live_stream(since=since)
            data['workspace'] = 'admin'
            return data

        if role_code == Role.Code.LOADING_OPERATOR:
            data = cls.get_loading_queue()
            data['workspace'] = 'loading_operator'
            return data

        if role_code == Role.Code.ACCOUNTS:
            data = cls.get_accounts_live()
            data['workspace'] = 'accounts'
            return data

        if role_code == Role.Code.DEALER:
            data = cls.get_dealer_live_dashboard(user)
            data['workspace'] = 'dealer'
            return data

        if role_code == Role.Code.DISTRIBUTOR:
            data = cls.get_distributor_live_dashboard(user)
            data['workspace'] = 'distributor'
            return data

        if role_code == Role.Code.SALES_AGENT:
            # Sales agent sees assigned dealers and their active orders
            from apps.dealers.models import Dealer
            dealers = Dealer.objects.filter(assigned_sales_agent__user=user)
            orders = Order.objects.filter(dealer__in=dealers).exclude(status__in=[Order.Status.CLOSED, Order.Status.CANCELLED]).order_by('-created_at')[:20]
            return {
                'workspace': 'sales_agent',
                'assigned_dealers_count': dealers.count(),
                'active_orders': [cls.get_order_live_status(o, user=user) for o in orders],
            }

        return {'workspace': 'unknown', 'detail': 'Unrecognized operational role.'}
