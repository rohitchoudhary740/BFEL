import secrets
from decimal import Decimal
from typing import Tuple, Optional, Dict, Any, List, Union
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.orders.models import Order, OrderItem
from apps.products.models import Product, ProductPrice
from apps.dealers.models import Dealer
from apps.distributors.models import Distributor
from services.audit import AuditService

BAG_WEIGHT_KG = 50

TRUCK_LIMITS = {
    Order.TruckCapacity.CAPACITY_20_MT: {
        'max_bags': 400,
        'kg': Decimal('20000.00'),
        'mt': Decimal('20.000'),
    },
    Order.TruckCapacity.CAPACITY_25_MT: {
        'max_bags': 500,
        'kg': Decimal('25000.00'),
        'mt': Decimal('25.000'),
    },
}

class InvalidOrderStateTransitionError(Exception):
    """Raised when an illegal order status transition is attempted."""
    pass

class WeightResult(dict):
    """
    Weight result carrying both dictionary keys and attribute/tuple unpacking access.
    """
    def __init__(self, weight_kg: Decimal, weight_mt: Decimal):
        super().__init__(weight_kg=weight_kg, weight_mt=weight_mt)
        self.weight_kg = weight_kg
        self.weight_mt = weight_mt

    def __iter__(self):
        return iter((self.weight_kg, self.weight_mt))


def calculate_order_weight(bag_quantity: int) -> WeightResult:
    """
    Calculates order weight in KG and MT for given 50 kg bags.
    Backend remains authoritative.
    """
    if bag_quantity < 0:
        raise ValidationError("Bag quantity cannot be negative.")
    weight_kg = Decimal(bag_quantity * BAG_WEIGHT_KG).quantize(Decimal('0.00'))
    weight_mt = (weight_kg / Decimal('1000.000')).quantize(Decimal('0.001'))
    return WeightResult(weight_kg=weight_kg, weight_mt=weight_mt)


def validate_order(order_or_capacity: Union[Order, str], bag_quantity: Optional[int] = None) -> bool:
    """
    Validates truck capacity rules:
    - 20 MT: maximum 400 bags (20,000 kg)
    - 25 MT: maximum 500 bags (25,000 kg)
    """
    if isinstance(order_or_capacity, Order):
        truck_capacity = order_or_capacity.truck_capacity
        bags = order_or_capacity.total_bags
    else:
        truck_capacity = order_or_capacity
        bags = bag_quantity if bag_quantity is not None else 0

    if truck_capacity not in TRUCK_LIMITS:
        raise ValidationError(f"Invalid truck capacity: '{truck_capacity}'. Must be '20_MT' or '25_MT'.")

    limit_data = TRUCK_LIMITS[truck_capacity]
    max_bags = limit_data['max_bags']

    if bags <= 0:
        raise ValidationError("Order quantity must be at least 1 bag.")

    if bags > max_bags:
        raise ValidationError(
            f"Truck capacity violation: Truck capacity exceeded for {truck_capacity}: "
            f"allows maximum {max_bags} bags (50 kg each), requested {bags} bags."
        )
    return True


class OrderStateMachine:
    """
    Controlled lifecycle transition rules for BFEL feed orders.
    """
    VALID_TRANSITIONS = {
        Order.Status.DRAFT: {Order.Status.PLACED, Order.Status.CANCELLED},
        Order.Status.PLACED: {Order.Status.PAYMENT_PENDING, Order.Status.CANCELLED},
        Order.Status.PAYMENT_PENDING: {Order.Status.PAYMENT_SUBMITTED, Order.Status.CANCELLED},
        Order.Status.PAYMENT_SUBMITTED: {Order.Status.PAYMENT_VERIFIED, Order.Status.PAYMENT_PENDING, Order.Status.CANCELLED},
        Order.Status.PAYMENT_VERIFIED: {Order.Status.LOADING_QUEUED, Order.Status.CANCELLED},
        Order.Status.LOADING_QUEUED: {Order.Status.LOADING, Order.Status.CANCELLED},
        Order.Status.LOADING: {Order.Status.LOADED},
        Order.Status.LOADED: {Order.Status.GATE_CLEARED},
        Order.Status.GATE_CLEARED: {Order.Status.DISPATCHED},
        Order.Status.DISPATCHED: {Order.Status.DELIVERED},
        Order.Status.DELIVERED: {Order.Status.CLAIM_PENDING, Order.Status.CLOSED},
        Order.Status.CLAIM_PENDING: {Order.Status.CLOSED},
        Order.Status.CLOSED: set(),
        Order.Status.CANCELLED: set(),
    }

    @classmethod
    def can_transition(cls, current_status: str, next_status: str) -> bool:
        allowed = cls.VALID_TRANSITIONS.get(current_status, set())
        return next_status in allowed


def transition_order_state(
    order: Order,
    new_status: str,
    actor=None,
    role: str = 'system',
    metadata: Optional[Dict[str, Any]] = None,
) -> Order:
    """
    Authoritative state transition function.
    Enforces 100% advance payment rule before loading eligibility.
    """
    if not OrderStateMachine.can_transition(order.status, new_status):
        raise InvalidOrderStateTransitionError(
            f"Unauthorized state transition: Cannot change order {order.order_number} "
            f"from '{order.status}' to '{new_status}'."
        )

    # 100% Advance Payment Gate:
    # An order must not become eligible for loading until required payment is verified.
    if new_status in (Order.Status.LOADING_QUEUED, Order.Status.LOADING):
        verified_payments = Decimal('0.00')
        if hasattr(order, 'payments'):
            for p in order.payments.filter(status='VERIFIED'):
                verified_payments += p.amount
        total_verified = order.advance_paid + verified_payments
        if total_verified < order.advance_payable:
            raise ValidationError(
                f"100% advance payment required before loading. "
                f"Required: ₹{order.advance_payable}, Verified: ₹{total_verified}."
            )

    previous_status = order.status
    order.status = new_status
    order.save()

    # Audit logging
    meta = metadata or {}
    meta['previous_status'] = previous_status
    meta['new_status'] = new_status

    action_name = f"ORDER_STATUS_CHANGED_{new_status}"
    if new_status == Order.Status.PLACED:
        action_name = 'ORDER_CREATED'
    elif new_status == Order.Status.PAYMENT_VERIFIED:
        action_name = 'PAYMENT_VERIFIED'
    elif new_status == Order.Status.LOADING:
        action_name = 'LOADING_STARTED'
    elif new_status == Order.Status.LOADED:
        action_name = 'LOADING_COMPLETED'
    elif new_status == Order.Status.GATE_CLEARED:
        action_name = 'GATE_PASS_ISSUED'
    elif new_status == Order.Status.DISPATCHED:
        action_name = 'DISPATCH_CREATED'
    elif new_status == Order.Status.CANCELLED:
        action_name = 'ORDER_CANCELLED'

    AuditService.log_event(
        action=action_name,
        entity='Order',
        entity_id=order.order_number,
        role=role,
        actor=actor,
        metadata=meta,
    )

    return order


def create_order(
    dealer: Union[Dealer, int],
    truck_capacity: str,
    items: List[Dict[str, Any]],
    destination: str,
    requested_dispatch_date=None,
    notes: str = "",
    created_by=None,
    order_reference: Optional[str] = None,
    distributor: Optional[Union[Distributor, int]] = None,
) -> Order:
    """
    Creates a feed order strictly governed by 20 MT (400 bags) or 25 MT (500 bags) capacity.
    Calculates weights and financials with Decimal precision.
    """
    if isinstance(dealer, (int, str)):
        dealer = Dealer.objects.get(pk=dealer)

    if distributor is None:
        distributor = dealer.assigned_distributor
        if distributor is None:
            # Fallback to first available distributor or raise error
            distributor = Distributor.objects.first()
            if not distributor:
                raise ValidationError("No regional distributor configured for this dealer.")
    elif isinstance(distributor, (int, str)):
        distributor = Distributor.objects.get(pk=distributor)

    if not items:
        raise ValidationError("Order must contain at least one product item.")

    # Calculate total bags
    total_bags = sum(int(item.get('bags', 0)) for item in items)
    validate_order(truck_capacity, total_bags)

    # Authority weights
    weight_res = calculate_order_weight(total_bags)

    # Validate items and calculate financials
    prepared_items = []
    subtotal = Decimal('0.00')

    for itm in items:
        prod = itm.get('product')
        if isinstance(prod, (int, str)):
            prod = Product.objects.get(pk=prod)
        elif not isinstance(prod, Product):
            raise ValidationError("Valid product is required for each line item.")

        bags = int(itm.get('bags', 0))
        if bags <= 0:
            raise ValidationError(f"Bag quantity for {prod.name} must be greater than zero.")

        rate = itm.get('rate_per_bag')
        if rate is None:
            active_price = ProductPrice.objects.filter(product=prod, is_active=True).first()
            if not active_price:
                raise ValidationError(f"No active price found for product '{prod.name}'.")
            rate = active_price.price_per_bag
        else:
            rate = Decimal(str(rate))

        line_total = Decimal(bags) * rate
        subtotal += line_total

        line_weight_res = calculate_order_weight(bags)
        prepared_items.append({
            'product': prod,
            'bags': bags,
            'rate_per_bag': rate,
            'weight_kg': line_weight_res.weight_kg,
            'weight_mt': line_weight_res.weight_mt,
            'total_amount': line_total,
        })

    # Volume discount scheme: >= 400 bags gets Rs. 30 per bag discount
    discount = Decimal('0.00')
    if total_bags >= 400:
        discount = Decimal(total_bags) * Decimal('30.00')

    net_total = subtotal - discount
    advance_payable = net_total

    order_number = order_reference or f"ORD-{timezone.now().strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}"

    with transaction.atomic():
        max_bags = 400 if truck_capacity == Order.TruckCapacity.CAPACITY_20_MT else 500
        order = Order.objects.create(
            order_number=order_number,
            dealer=dealer,
            distributor=distributor,
            truck_capacity=truck_capacity,
            max_bags=max_bags,
            total_bags=total_bags,
            total_weight_kg=weight_res.weight_kg,
            total_weight_mt=weight_res.weight_mt,
            subtotal=subtotal,
            discount=discount,
            net_total=net_total,
            advance_payable=advance_payable,
            advance_paid=Decimal('0.00'),
            status=Order.Status.DRAFT,
            destination=destination,
            requested_dispatch_date=requested_dispatch_date,
            notes=notes,
            created_by=created_by,
        )

        for p_item in prepared_items:
            OrderItem.objects.create(
                order=order,
                product=p_item['product'],
                bags=p_item['bags'],
                weight_kg=p_item['weight_kg'],
                weight_mt=p_item['weight_mt'],
                rate_per_bag=p_item['rate_per_bag'],
                total_amount=p_item['total_amount'],
            )

        AuditService.log_event(
            action='ORDER_CREATED',
            entity='Order',
            entity_id=order.order_number,
            role=getattr(getattr(created_by, 'role', None), 'code', 'system'),
            actor=created_by,
            metadata={
                'truck_capacity': truck_capacity,
                'total_bags': total_bags,
                'net_total': str(net_total),
            }
        )

    return order


def submit_order(order: Order, user=None) -> Order:
    """
    Submits a draft order into PLACED and PAYMENT_PENDING state.
    """
    if order.status != Order.Status.DRAFT:
        raise InvalidOrderStateTransitionError(
            f"Cannot submit order in status '{order.status}'. Only DRAFT orders can be submitted."
        )

    if not order.items.exists():
        raise ValidationError("Cannot submit order without line items.")

    role_code = getattr(getattr(user, 'role', None), 'code', 'system')
    transition_order_state(order, Order.Status.PLACED, actor=user, role=role_code)
    transition_order_state(order, Order.Status.PAYMENT_PENDING, actor=user, role=role_code)
    return order


def cancel_order(order: Order, user=None, reason: str = "") -> Order:
    """
    Cancels an order if loading has not commenced.
    """
    non_cancellable_states = {
        Order.Status.LOADING,
        Order.Status.LOADED,
        Order.Status.GATE_CLEARED,
        Order.Status.DISPATCHED,
        Order.Status.DELIVERED,
        Order.Status.CLOSED,
        Order.Status.CANCELLED,
    }

    if order.status in non_cancellable_states:
        raise ValidationError(
            f"Cannot cancel order in status '{order.status}'. "
            f"Loading or dispatch has already commenced or completed."
        )

    role_code = getattr(getattr(user, 'role', None), 'code', 'system')
    return transition_order_state(
        order,
        Order.Status.CANCELLED,
        actor=user,
        role=role_code,
        metadata={'cancellation_reason': reason}
    )


class OrderCalculationService:
    """Backward compatibility helper."""
    @staticmethod
    def validate_truck_capacity(truck_capacity: str, bags: int) -> int:
        validate_order(truck_capacity, bags)
        return TRUCK_LIMITS[truck_capacity]['max_bags']

    @staticmethod
    def calculate_weight_from_bags(bags: int) -> Tuple[Decimal, Decimal]:
        res = calculate_order_weight(bags)
        return res.weight_kg, res.weight_mt

    @staticmethod
    def calculate_bags_from_mt(metric_tons: Decimal) -> int:
        kg = metric_tons * Decimal('1000.00')
        return int(kg / Decimal(BAG_WEIGHT_KG))


class OrderService:
    """
    Facade class exposing all order operations.
    """
    create_order = staticmethod(create_order)
    submit_order = staticmethod(submit_order)
    validate_order = staticmethod(validate_order)
    calculate_order_weight = staticmethod(calculate_order_weight)
    cancel_order = staticmethod(cancel_order)
    transition_order_state = staticmethod(transition_order_state)
    transition_order_status = staticmethod(transition_order_state)
