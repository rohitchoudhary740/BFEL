import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from apps.users.models import Role, SalesAgent
from apps.dealers.models import Dealer
from apps.distributors.models import Distributor, DistributorWallet, WalletLedgerEntry
from apps.products.models import Product, ProductPrice
from apps.orders.models import Order, OrderItem, BAG_WEIGHT_KG
from apps.payments.models import Payment
from apps.loading.models import Truck, Driver, LoadingBay, LoadingSession, WeighbridgeReading
from apps.dispatch.models import GatePass, Dispatch
from apps.claims.models import Claim, ClaimEvidence
from apps.accounts.models import AuditEvent
from services.orders import (
    OrderCalculationService,
    OrderService,
    OrderStateMachine,
    InvalidOrderStateTransitionError,
)
from services.audit import AuditService

User = get_user_model()

@pytest.fixture
def sample_setup(db):
    """Sets up seed entities for domain testing."""
    dealer_role, _ = Role.objects.get_or_create(
        code=Role.Code.DEALER,
        defaults={'name': 'Dealer', 'description': 'Authorized Tier-1 Dealer'}
    )
    admin_role, _ = Role.objects.get_or_create(
        code=Role.Code.ADMIN,
        defaults={'name': 'Admin', 'description': 'Central Command Admin'}
    )

    admin_user = User.objects.create_user(
        username='admin_rajeshwar',
        phone='9826100552',
        role=admin_role,
        first_name='Rajeshwar',
        last_name='Sharma'
    )

    dist_user = User.objects.create_user(
        username='dist_sanjay',
        phone='9827033412',
        first_name='Sanjay',
        last_name='Maheshwari'
    )
    distributor = Distributor.objects.create(
        user=dist_user,
        company_name='Malwa Agri Feeds Pvt Ltd',
        distributor_code='DIST-IND-01',
        gstin='23AABCM4412L1Z9',
        warehouse_address='Sanwer Road Industrial Area',
        city='Indore',
        district='Indore'
    )
    wallet = DistributorWallet.objects.create(
        distributor=distributor,
        available_balance=Decimal('420000.00'),
        credit_limit=Decimal('1000000.00'),
        reserved_funds=Decimal('180000.00')
    )

    dealer_user = User.objects.create_user(
        username='dealer_ramesh',
        phone='9826041290',
        role=dealer_role,
        first_name='Ramesh',
        last_name='Patel'
    )
    dealer = Dealer.objects.create(
        user=dealer_user,
        dealership_name='Patel Agro Agency',
        gstin='23AABCP8921M1Z4',
        mandi_yard='Dewas Mandi Yard',
        address='Shop 14-16, Mandi Parisar',
        city='Dewas',
        district='Dewas',
        pincode='455001',
        assigned_distributor=distributor
    )

    product = Product.objects.create(
        sku='BFEL-DD-50',
        name='BFEL Dudh Dhara 50kg',
        category='Cattle Feed',
        protein_percent=Decimal('20.00'),
        fat_percent=Decimal('4.00')
    )
    price = ProductPrice.objects.create(
        product=product,
        price_per_bag=Decimal('1420.00')
    )

    return {
        'admin_user': admin_user,
        'distributor': distributor,
        'wallet': wallet,
        'dealer': dealer,
        'product': product,
        'price': price,
    }

# ==============================================================================
# 1. 20 MT = 400 Bags Validation
# ==============================================================================
def test_20mt_equals_400_bags(sample_setup):
    """Verify that a 20 MT truck capacity strictly maps to 400 bags (20,000 kg)."""
    dealer = sample_setup['dealer']
    distributor = sample_setup['distributor']

    # 400 bags * 50 kg = 20,000 kg = 20 MT
    kg, mt = OrderCalculationService.calculate_weight_from_bags(400)
    assert kg == Decimal('20000.00')
    assert mt == Decimal('20.000')

    order = Order(
        order_number='BFEL-TEST-20MT-400',
        dealer=dealer,
        distributor=distributor,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        total_bags=400,
        subtotal=Decimal('568000.00'),
        net_total=Decimal('556000.00'),
        advance_payable=Decimal('556000.00'),
        destination='Dewas Mandi Yard'
    )
    order.save()

    assert order.max_bags == 400
    assert order.total_bags == 400
    assert order.total_weight_kg == Decimal('20000.00')
    assert order.total_weight_mt == Decimal('20.000')

# ==============================================================================
# 2. 25 MT = 500 Bags Validation
# ==============================================================================
def test_25mt_equals_500_bags(sample_setup):
    """Verify that a 25 MT truck capacity strictly maps to 500 bags (25,000 kg)."""
    dealer = sample_setup['dealer']
    distributor = sample_setup['distributor']

    # 500 bags * 50 kg = 25,000 kg = 25 MT
    kg, mt = OrderCalculationService.calculate_weight_from_bags(500)
    assert kg == Decimal('25000.00')
    assert mt == Decimal('25.000')

    order = Order(
        order_number='BFEL-TEST-25MT-500',
        dealer=dealer,
        distributor=distributor,
        truck_capacity=Order.TruckCapacity.CAPACITY_25_MT,
        total_bags=500,
        subtotal=Decimal('710000.00'),
        net_total=Decimal('695000.00'),
        advance_payable=Decimal('695000.00'),
        destination='Dewas Mandi Yard'
    )
    order.save()

    assert order.max_bags == 500
    assert order.total_bags == 500
    assert order.total_weight_kg == Decimal('25000.00')
    assert order.total_weight_mt == Decimal('25.000')

# ==============================================================================
# 3. Invalid 401 Bags on 20 MT Rejection
# ==============================================================================
def test_invalid_401_bags_rejected(sample_setup):
    """Verify that attempting to order 401 bags on a 20 MT truck raises ValidationError."""
    dealer = sample_setup['dealer']
    distributor = sample_setup['distributor']

    # Test calculation service validation
    with pytest.raises(ValidationError) as exc_info:
        OrderCalculationService.validate_truck_capacity('20_MT', 401)
    assert "Truck capacity exceeded" in str(exc_info.value)
    assert "400" in str(exc_info.value)

    # Test model-level validation
    order = Order(
        order_number='BFEL-FAIL-401',
        dealer=dealer,
        distributor=distributor,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        total_bags=401,
        subtotal=Decimal('569420.00'),
        net_total=Decimal('569420.00'),
        advance_payable=Decimal('569420.00'),
        destination='Dewas Mandi Yard'
    )
    with pytest.raises(ValidationError) as model_exc:
        order.save()
    assert "Truck capacity violation" in str(model_exc.value)

# ==============================================================================
# 4. Invalid 501 Bags on 25 MT Rejection
# ==============================================================================
def test_invalid_501_bags_rejected(sample_setup):
    """Verify that attempting to order 501 bags on a 25 MT truck raises ValidationError."""
    dealer = sample_setup['dealer']
    distributor = sample_setup['distributor']

    # Test calculation service validation
    with pytest.raises(ValidationError) as exc_info:
        OrderCalculationService.validate_truck_capacity('25_MT', 501)
    assert "Truck capacity exceeded" in str(exc_info.value)
    assert "500" in str(exc_info.value)

    # Test model-level validation
    order = Order(
        order_number='BFEL-FAIL-501',
        dealer=dealer,
        distributor=distributor,
        truck_capacity=Order.TruckCapacity.CAPACITY_25_MT,
        total_bags=501,
        subtotal=Decimal('711420.00'),
        net_total=Decimal('711420.00'),
        advance_payable=Decimal('711420.00'),
        destination='Dewas Mandi Yard'
    )
    with pytest.raises(ValidationError) as model_exc:
        order.save()
    assert "Truck capacity violation" in str(model_exc.value)

# ==============================================================================
# 5. Order State Transitions
# ==============================================================================
def test_valid_order_state_transitions(sample_setup):
    """Verify authorized sequence of order lifecycle transitions."""
    dealer = sample_setup['dealer']
    distributor = sample_setup['distributor']
    admin = sample_setup['admin_user']

    order = Order.objects.create(
        order_number='BFEL-FLOW-LIFECYCLE-1',
        dealer=dealer,
        distributor=distributor,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        max_bags=400,
        total_bags=400,
        subtotal=Decimal('568000.00'),
        net_total=Decimal('556000.00'),
        advance_payable=Decimal('556000.00'),
        status=Order.Status.DRAFT,
        destination='Dewas'
    )
    assert order.status == Order.Status.DRAFT

    # DRAFT -> PLACED
    OrderService.transition_order_status(order, Order.Status.PLACED, actor=admin, role='admin')
    assert order.status == Order.Status.PLACED

    # PLACED -> PAYMENT_PENDING
    OrderService.transition_order_status(order, Order.Status.PAYMENT_PENDING, actor=admin, role='dealer')
    assert order.status == Order.Status.PAYMENT_PENDING

    # PAYMENT_PENDING -> PAYMENT_SUBMITTED
    OrderService.transition_order_status(order, Order.Status.PAYMENT_SUBMITTED, actor=admin, role='dealer')
    assert order.status == Order.Status.PAYMENT_SUBMITTED

    # PAYMENT_SUBMITTED -> PAYMENT_VERIFIED
    OrderService.transition_order_status(order, Order.Status.PAYMENT_VERIFIED, actor=admin, role='accounts')
    assert order.status == Order.Status.PAYMENT_VERIFIED

    # Satisfy 100% advance payment rule required before loading
    order.advance_paid = order.advance_payable
    order.save()

    # PAYMENT_VERIFIED -> LOADING_QUEUED
    OrderService.transition_order_status(order, Order.Status.LOADING_QUEUED, actor=admin, role='loading_operator')
    assert order.status == Order.Status.LOADING_QUEUED

    # LOADING_QUEUED -> LOADING
    OrderService.transition_order_status(order, Order.Status.LOADING, actor=admin, role='loading_operator')
    assert order.status == Order.Status.LOADING

    # LOADING -> LOADED
    OrderService.transition_order_status(order, Order.Status.LOADED, actor=admin, role='loading_operator')
    assert order.status == Order.Status.LOADED

    # LOADED -> GATE_CLEARED
    OrderService.transition_order_status(order, Order.Status.GATE_CLEARED, actor=admin, role='loading_operator')
    assert order.status == Order.Status.GATE_CLEARED

    # GATE_CLEARED -> DISPATCHED
    OrderService.transition_order_status(order, Order.Status.DISPATCHED, actor=admin, role='admin')
    assert order.status == Order.Status.DISPATCHED

    # DISPATCHED -> DELIVERED
    OrderService.transition_order_status(order, Order.Status.DELIVERED, actor=admin, role='admin')
    assert order.status == Order.Status.DELIVERED

    # DELIVERED -> CLOSED
    OrderService.transition_order_status(order, Order.Status.CLOSED, actor=admin, role='admin')
    assert order.status == Order.Status.CLOSED

# ==============================================================================
# 6. Unauthorized State Transitions Blocked
# ==============================================================================
def test_unauthorized_state_transitions_blocked(sample_setup):
    """Verify that illegal out-of-order state jumps are blocked."""
    dealer = sample_setup['dealer']
    distributor = sample_setup['distributor']

    order = Order.objects.create(
        order_number='BFEL-ILLEGAL-TRANSITION',
        dealer=dealer,
        distributor=distributor,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        max_bags=400,
        total_bags=400,
        subtotal=Decimal('568000.00'),
        net_total=Decimal('556000.00'),
        advance_payable=Decimal('556000.00'),
        status=Order.Status.DRAFT,
        destination='Dewas'
    )

    # DRAFT cannot jump directly to DISPATCHED
    with pytest.raises(InvalidOrderStateTransitionError):
        OrderService.transition_order_status(order, Order.Status.DISPATCHED)

    # DRAFT cannot jump directly to LOADING
    with pytest.raises(InvalidOrderStateTransitionError):
        OrderService.transition_order_status(order, Order.Status.LOADING)

    # Cancel order
    OrderService.transition_order_status(order, Order.Status.CANCELLED)
    assert order.status == Order.Status.CANCELLED

    # CANCELLED is a terminal state, cannot reopen to PLACED
    with pytest.raises(InvalidOrderStateTransitionError):
        OrderService.transition_order_status(order, Order.Status.PLACED)

# ==============================================================================
# 7. Decimal Money Handling
# ==============================================================================
def test_decimal_money_precision(sample_setup):
    """Verify exact Decimal arithmetic for currency without floating-point errors."""
    wallet = sample_setup['wallet']
    dealer = sample_setup['dealer']
    product = sample_setup['product']

    rate = Decimal('1420.50')
    bags = 400
    expected_subtotal = Decimal('568200.00')
    calculated_subtotal = Decimal(bags) * rate

    assert calculated_subtotal == expected_subtotal
    assert isinstance(calculated_subtotal, Decimal)

    # Scheme discount: ₹30.00/bag for 400 bags = ₹12,000.00
    discount = Decimal(bags) * Decimal('30.00')
    expected_net = expected_subtotal - discount
    assert expected_net == Decimal('556200.00')

    # Ledger entry with exact Decimal precision
    entry = WalletLedgerEntry.objects.create(
        wallet=wallet,
        entry_type=WalletLedgerEntry.EntryType.CREDIT,
        amount=Decimal('556200.75'),
        balance_after=wallet.available_balance + Decimal('556200.75'),
        reference='UTR-TEST-DECIMAL-1234',
        description='Test exact Decimal deposit'
    )
    assert entry.amount == Decimal('556200.75')
    assert isinstance(entry.amount, Decimal)

# ==============================================================================
# 8. Audit Event Creation
# ==============================================================================
def test_audit_event_creation(sample_setup):
    """Verify that critical business operations produce complete audit records."""
    admin = sample_setup['admin_user']
    dealer = sample_setup['dealer']
    distributor = sample_setup['distributor']

    order = Order.objects.create(
        order_number='BFEL-AUDIT-TEST-01',
        dealer=dealer,
        distributor=distributor,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        max_bags=400,
        total_bags=400,
        subtotal=Decimal('568000.00'),
        net_total=Decimal('556000.00'),
        advance_payable=Decimal('556000.00'),
        status=Order.Status.DRAFT,
        destination='Dewas Mandi'
    )

    # Trigger Order transition which creates audit event
    OrderService.transition_order_status(
        order,
        Order.Status.PLACED,
        actor=admin,
        role='admin',
        metadata={'channel': 'web_console', 'ip': '127.0.0.1'}
    )

    audit = AuditEvent.objects.filter(entity='Order', entity_id='BFEL-AUDIT-TEST-01').first()
    assert audit is not None
    assert audit.action == 'ORDER_CREATED'
    assert audit.role == 'admin'
    assert audit.actor == admin
    assert audit.metadata['previous_status'] == 'DRAFT'
    assert audit.metadata['new_status'] == 'PLACED'
    assert audit.metadata['channel'] == 'web_console'
