import hashlib
import secrets
from decimal import Decimal
from typing import Union, Optional, Tuple, Dict, Any
from django.db import transaction
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils import timezone

from apps.orders.models import Order
from apps.loading.models import (
    Truck,
    Driver,
    LoadingBay,
    LoadingOperator,
    LoadingSession,
    WeighbridgeReading,
)
from apps.dispatch.models import GatePass
from apps.users.models import Role
from services.orders import transition_order_state
from services.audit import AuditService

STANDARD_TOLERANCE_KG = Decimal('100.00')

class TruckLoadingService:
    """
    Core service governing plant truck loading operations, weighbridge verification,
    and security gate pass issuance.
    """

    @staticmethod
    def _assert_operator_role(user):
        role_code = getattr(getattr(user, 'role', None), 'code', None)
        if not (user and (user.is_superuser or role_code in {Role.Code.LOADING_OPERATOR, Role.Code.ADMIN})):
            raise PermissionDenied("Only Weighbridge / Plant Loading Operators or Administrators can perform this operation.")

    @classmethod
    def assign_truck_and_bay(
        cls,
        order: Union[Order, int],
        truck: Union[Truck, int],
        bay: Union[LoadingBay, int],
        driver: Union[Driver, int],
        operator_user,
    ) -> LoadingSession:
        """
        Assigns truck, bay, and driver to an order in LOADING_QUEUED status.
        Enforces strict 20 MT (400 bags) vs 25 MT (500 bags) capacity matching.
        """
        cls._assert_operator_role(operator_user)

        if isinstance(order, (int, str)):
            order = Order.objects.get(pk=order)
        if isinstance(truck, (int, str)):
            truck = Truck.objects.get(pk=truck)
        if isinstance(bay, (int, str)):
            bay = LoadingBay.objects.get(pk=bay)
        if isinstance(driver, (int, str)):
            driver = Driver.objects.get(pk=driver)

        # Order must be eligible for loading
        if order.status not in {Order.Status.PAYMENT_VERIFIED, Order.Status.LOADING_QUEUED}:
            raise ValidationError(
                f"Cannot assign truck to order in status '{order.status}'. "
                f"Order must have 100% verified payment and be in LOADING_QUEUED state."
            )

        # 100% advance payment check
        if order.advance_paid < order.advance_payable:
            raise ValidationError(
                f"100% advance payment required before loading assignment. "
                f"Required: ₹{order.advance_payable}, Verified Paid: ₹{order.advance_paid}."
            )

        # Capacity matching validation
        if truck.capacity_type != order.truck_capacity:
            raise ValidationError(
                f"Truck capacity mismatch: Order requires {order.truck_capacity} "
                f"({order.max_bags} bags), but truck {truck.registration_number} is {truck.capacity_type}."
            )

        if order.total_bags > truck.max_bags:
            raise ValidationError(
                f"Truck capacity violation: Order has {order.total_bags} bags, "
                f"which exceeds truck {truck.registration_number} maximum of {truck.max_bags} bags."
            )

        # Operator profile lookup
        operator_profile = getattr(operator_user, 'loading_operator_profile', None)
        if not operator_profile:
            operator_profile, _ = LoadingOperator.objects.get_or_create(
                user=operator_user,
                defaults={'employee_id': f"OP-{operator_user.id}"}
            )

        with transaction.atomic():
            # If order was PAYMENT_VERIFIED, move to LOADING_QUEUED
            if order.status == Order.Status.PAYMENT_VERIFIED:
                transition_order_state(order, Order.Status.LOADING_QUEUED, actor=operator_user, role='loading_operator')

            session, created = LoadingSession.objects.update_or_create(
                order=order,
                defaults={
                    'bay': bay,
                    'truck': truck,
                    'driver': driver,
                    'operator': operator_profile,
                    'expected_bags': order.total_bags,
                    'status': LoadingSession.Status.QUEUED,
                }
            )

            AuditService.log_event(
                action='TRUCK_ASSIGNED',
                entity='LoadingSession',
                entity_id=str(session.id),
                role='loading_operator',
                actor=operator_user,
                metadata={
                    'order_number': order.order_number,
                    'truck': truck.registration_number,
                    'bay': bay.bay_number,
                    'driver': driver.name,
                }
            )

        return session

    @classmethod
    def start_loading(cls, session: LoadingSession, operator_user) -> LoadingSession:
        """
        Starts loading operation and transitions order to LOADING.
        """
        cls._assert_operator_role(operator_user)

        if session.status != LoadingSession.Status.QUEUED:
            raise ValidationError(f"Cannot start loading: Session status is '{session.status}', expected 'QUEUED'.")

        with transaction.atomic():
            session.status = LoadingSession.Status.IN_PROGRESS
            session.started_at = timezone.now()
            session.save()

            transition_order_state(
                session.order,
                Order.Status.LOADING,
                actor=operator_user,
                role='loading_operator',
                metadata={'bay': session.bay.bay_number, 'truck': session.truck.registration_number}
            )

        return session

    @classmethod
    def record_bag_count(
        cls,
        session: LoadingSession,
        bags_loaded: int,
        operator_user,
    ) -> LoadingSession:
        """
        Records actual physical 50 kg bags loaded into the truck.
        Enforces maximum limits (400 for 20T, 500 for 25T).
        """
        cls._assert_operator_role(operator_user)

        if session.status != LoadingSession.Status.IN_PROGRESS:
            raise ValidationError(f"Cannot record bag count: Session is in '{session.status}' state.")

        if bags_loaded < 0:
            raise ValidationError("Bags loaded cannot be negative.")

        max_allowed = session.truck.max_bags
        if bags_loaded > max_allowed:
            raise ValidationError(
                f"Loading violation: {session.truck.capacity_type} allows maximum {max_allowed} bags. "
                f"Attempted to record {bags_loaded} bags."
            )

        if bags_loaded > session.expected_bags:
            raise ValidationError(
                f"Order bag count exceeded: Order specifies {session.expected_bags} bags. "
                f"Attempted to record {bags_loaded} bags."
            )

        session.bags_loaded = bags_loaded
        session.save()
        return session

    @classmethod
    def record_weighbridge(
        cls,
        session: LoadingSession,
        tare_weight_kg: Decimal,
        gross_weight_kg: Decimal,
        operator_user,
        tolerance_kg: Decimal = STANDARD_TOLERANCE_KG,
    ) -> WeighbridgeReading:
        """
        Electronic weighbridge ticket calculation:
        Net = gross - tare (calculated strictly by backend).
        Variance = calculated net - expected weight.
        Tolerance validation: abs(variance) <= tolerance_kg (default 100 kg).
        """
        cls._assert_operator_role(operator_user)

        tare = Decimal(str(tare_weight_kg))
        gross = Decimal(str(gross_weight_kg))

        if gross <= tare:
            raise ValidationError(
                f"Invalid weighbridge reading: Gross weight ({gross} kg) must be strictly greater "
                f"than tare weight ({tare} kg)."
            )

        # Backend authoritative calculation
        net_weight_kg = gross - tare
        expected_weight_kg = Decimal(session.expected_bags * 50) # 50 kg per bag
        variance_kg = net_weight_kg - expected_weight_kg

        with transaction.atomic():
            reading = WeighbridgeReading.objects.create(
                session=session,
                operator=operator_user,
                tare_weight_kg=tare,
                gross_weight_kg=gross,
                net_weight_kg=net_weight_kg,
                expected_weight_kg=expected_weight_kg,
                variance_kg=variance_kg,
                tolerance_kg=tolerance_kg,
            )

            AuditService.log_event(
                action='WEIGHBRIDGE_RECORDED',
                entity='WeighbridgeReading',
                entity_id=str(reading.id),
                role='loading_operator',
                actor=operator_user,
                metadata={
                    'net_kg': str(net_weight_kg),
                    'expected_kg': str(expected_weight_kg),
                    'variance_kg': str(variance_kg),
                    'within_tolerance': reading.is_within_tolerance,
                }
            )

            if not reading.is_within_tolerance:
                raise ValidationError(
                    f"Weighbridge variance failure: Calculated variance is {variance_kg} kg, "
                    f"which exceeds maximum allowed tolerance of ±{tolerance_kg} kg. "
                    f"(Net: {net_weight_kg} kg, Expected: {expected_weight_kg} kg)."
                )

        return reading

    @classmethod
    def complete_loading(
        cls,
        session: LoadingSession,
        seal_number: str,
        operator_user,
    ) -> LoadingSession:
        """
        Completes loading session and transitions order from LOADING to LOADED.
        Mandates exact bag count, security seal, and valid weighbridge reading within tolerance.
        """
        cls._assert_operator_role(operator_user)

        if session.status != LoadingSession.Status.IN_PROGRESS:
            raise ValidationError(f"Cannot complete loading: Session status is '{session.status}'.")

        # 1. Bag count verification
        if session.bags_loaded != session.expected_bags:
            raise ValidationError(
                f"Incomplete loading: Expected {session.expected_bags} bags, "
                f"but currently only {session.bags_loaded} bags recorded."
            )

        # 2. Security seal verification
        clean_seal = seal_number.strip().upper() if seal_number else ''
        if not clean_seal:
            raise ValidationError("Security seal number is mandatory to complete loading.")

        # 3. Weighbridge verification
        latest_ticket = session.weighbridge_readings.order_by('-recorded_at').first()
        if not latest_ticket:
            raise ValidationError("Weighbridge reading is required before completing loading.")
        if not latest_ticket.is_within_tolerance:
            raise ValidationError(
                f"Cannot complete loading: Latest weighbridge reading variance ({latest_ticket.variance_kg} kg) "
                f"exceeds tolerance of ±{latest_ticket.tolerance_kg} kg."
            )

        with transaction.atomic():
            session.seal_number = clean_seal
            session.completed_at = timezone.now()
            session.status = LoadingSession.Status.COMPLETED
            session.save()

            transition_order_state(
                session.order,
                Order.Status.LOADED,
                actor=operator_user,
                role='loading_operator',
                metadata={'seal_number': clean_seal, 'net_weight_kg': str(latest_ticket.net_weight_kg)}
            )

            AuditService.log_event(
                action='LOADING_COMPLETED',
                entity='LoadingSession',
                entity_id=str(session.id),
                role='loading_operator',
                actor=operator_user,
                metadata={
                    'order_number': session.order.order_number,
                    'seal_number': clean_seal,
                    'bags_loaded': session.bags_loaded,
                }
            )

        return session

    @classmethod
    def generate_gate_pass(
        cls,
        order_or_session: Union[Order, LoadingSession, int],
        operator_user,
    ) -> GatePass:
        """
        Issues security gate pass certificate.
        Gate Pass must NOT be generated unless:
        - payment is verified
        - order is valid
        - truck is assigned
        - required quantity is loaded
        - weight validation passes
        - seal number is recorded
        """
        cls._assert_operator_role(operator_user)

        if isinstance(order_or_session, LoadingSession):
            session = order_or_session
            order = session.order
        elif isinstance(order_or_session, Order):
            order = order_or_session
            try:
                session = order.loading_session
            except LoadingSession.DoesNotExist:
                raise ValidationError("No loading session found for this order.")
        else:
            session = LoadingSession.objects.get(pk=order_or_session)
            order = session.order

        # Gate pass validation checks:
        # 1. Payment verified
        if order.advance_paid < order.advance_payable:
            raise ValidationError("Gate pass blocked: Order requires 100% verified advance payment.")

        # 2. Order status must be LOADED
        if order.status != Order.Status.LOADED:
            raise ValidationError(
                f"Gate pass blocked: Order must be in 'LOADED' status, currently '{order.status}'."
            )

        # 3. Truck assigned
        if not session.truck:
            raise ValidationError("Gate pass blocked: No truck assigned.")

        # 4. Required quantity loaded
        if session.bags_loaded != order.total_bags:
            raise ValidationError(
                f"Gate pass blocked: Required {order.total_bags} bags loaded, but recorded {session.bags_loaded}."
            )

        # 5. Seal number recorded
        if not session.seal_number or not session.seal_number.strip():
            raise ValidationError("Gate pass blocked: Security seal number not recorded.")

        # 6. Weight validation passes
        latest_reading = session.weighbridge_readings.order_by('-recorded_at').first()
        if not latest_reading:
            raise ValidationError("Gate pass blocked: Missing weighbridge reading.")
        if not latest_reading.is_within_tolerance:
            raise ValidationError(
                f"Gate pass blocked: Weighbridge reading variance {latest_reading.variance_kg} kg "
                f"exceeds tolerance of ±{latest_reading.tolerance_kg} kg."
            )

        # Check if GatePass already exists
        existing_gp = getattr(order, 'gate_pass', None)
        if existing_gp:
            return existing_gp

        gate_pass_number = f"GP-{order.order_number}-{secrets.token_hex(2).upper()}"
        qr_hash = hashlib.sha256(f"{gate_pass_number}:{order.order_number}:{session.seal_number}".encode()).hexdigest()

        with transaction.atomic():
            gate_pass = GatePass.objects.create(
                gate_pass_number=gate_pass_number,
                order=order,
                truck=session.truck,
                driver=session.driver,
                seal_number=session.seal_number,
                qr_code_hash=qr_hash,
            )

            # Transition order from LOADED to GATE_CLEARED
            transition_order_state(
                order=order,
                new_status=Order.Status.GATE_CLEARED,
                actor=operator_user,
                role='loading_operator',
                metadata={'gate_pass_number': gate_pass_number}
            )

            AuditService.log_event(
                action='GATE_PASS_ISSUED',
                entity='GatePass',
                entity_id=gate_pass_number,
                role='loading_operator',
                actor=operator_user,
                metadata={
                    'order_number': order.order_number,
                    'truck': session.truck.registration_number,
                    'seal_number': session.seal_number,
                }
            )

        return gate_pass
