import secrets
import logging
from typing import Union, Optional, Dict, Any
from django.db import transaction
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils import timezone

from apps.orders.models import Order
from apps.dispatch.models import GatePass, Dispatch
from apps.users.models import Role
from services.orders import transition_order_state
from services.whatsapp import WhatsAppService, WhatsAppDeliveryError
from services.audit import AuditService

logger = logging.getLogger('bfel.dispatch')

class DispatchService:
    """
    Orchestrates road dispatch generation after physical gate clearance
    and automatically triggers operational WhatsApp logistics alerts.
    """

    @staticmethod
    def _assert_operator_role(user):
        role_code = getattr(getattr(user, 'role', None), 'code', None)
        if not (user and (user.is_superuser or role_code in {Role.Code.LOADING_OPERATOR, Role.Code.ADMIN})):
            raise PermissionDenied("Only Plant Dispatch Operators or Administrators are authorized to dispatch shipments.")

    @classmethod
    def create_dispatch(
        cls,
        order: Union[Order, int],
        lr_number: str,
        operator_user,
        gate_pass: Optional[Union[GatePass, int]] = None,
    ) -> Dispatch:
        """
        Creates a road dispatch record after successful loading and gate pass clearance.
        Triggers WhatsApp logistics notification to the destination dealer.
        Enforces gate pass clearance and blocks duplicate dispatches.
        """
        cls._assert_operator_role(operator_user)

        if isinstance(order, (int, str)):
            order = Order.objects.get(pk=order)

        clean_lr = lr_number.strip().upper() if lr_number else ''
        if not clean_lr:
            raise ValidationError("Consignment note / LR number is mandatory for dispatch.")

        # 1. Duplicate Dispatch Prevention
        if Dispatch.objects.filter(order=order).exists():
            raise ValidationError(
                f"Duplicate dispatch blocked: Order '{order.order_number}' has already been dispatched."
            )

        if Dispatch.objects.filter(lr_number=clean_lr).exists():
            raise ValidationError(
                f"Duplicate dispatch blocked: LR number '{clean_lr}' is already registered."
            )

        # 2. Gate Pass Requirement
        if gate_pass is None:
            gate_pass = getattr(order, 'gate_pass', None)
        elif isinstance(gate_pass, (int, str)):
            gate_pass = GatePass.objects.get(pk=gate_pass)

        if not gate_pass:
            raise ValidationError("Cannot create dispatch: Order has no issued Gate Pass clearance.")

        if order.status != Order.Status.GATE_CLEARED:
            raise ValidationError(
                f"Cannot create dispatch: Order must be in 'GATE_CLEARED' status, currently '{order.status}'."
            )

        dispatch_number = f"DSP-{order.order_number}-{secrets.token_hex(2).upper()}"

        with transaction.atomic():
            dispatch = Dispatch.objects.create(
                dispatch_number=dispatch_number,
                order=order,
                gate_pass=gate_pass,
                truck=gate_pass.truck,
                driver=gate_pass.driver,
                destination=order.destination,
                lr_number=clean_lr,
                status=Dispatch.Status.IN_TRANSIT,
            )

            # Move order to DISPATCHED
            transition_order_state(
                order=order,
                new_status=Order.Status.DISPATCHED,
                actor=operator_user,
                role='loading_operator',
                metadata={'dispatch_number': dispatch_number, 'lr_number': clean_lr}
            )

            AuditService.log_event(
                action='DISPATCH_CREATED',
                entity='Dispatch',
                entity_id=dispatch_number,
                role='loading_operator',
                actor=operator_user,
                metadata={
                    'order_number': order.order_number,
                    'lr_number': clean_lr,
                    'truck': dispatch.truck.registration_number,
                }
            )

        # 3. WhatsApp Notification Invocation (with graceful failure resilience)
        try:
            WhatsAppService.send_dispatch_alert(order=order, dispatch=dispatch)
        except Exception as e:
            logger.warning(
                f"WhatsApp alert delivery failed for dispatch {dispatch_number} (Order: {order.order_number}): {e}"
            )
            # Log audit trail for notification failure without rolling back physical truck dispatch
            AuditService.log_event(
                action='WHATSAPP_ALERT_FAILED',
                entity='Dispatch',
                entity_id=dispatch_number,
                role='system',
                metadata={'error': str(e)}
            )

        return dispatch
