import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from apps.users.models import Role, SalesAgent
from apps.dealers.models import Dealer
from apps.distributors.models import Distributor
from apps.products.models import Product, ProductPrice
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment
from services.orders import (
    create_order,
    submit_order,
    cancel_order,
    validate_order,
    calculate_order_weight,
    transition_order_state,
    InvalidOrderStateTransitionError,
)

User = get_user_model()

@pytest.fixture
def rbac_roles(db):
    roles = {}
    for code, label in [
        ('dealer', 'Dealer'),
        ('distributor', 'Distributor'),
        ('sales_agent', 'Sales Agent'),
        ('accounts', 'Accounts'),
        ('loading_operator', 'Loading Operator'),
        ('admin', 'Admin'),
    ]:
        role, _ = Role.objects.get_or_create(code=code, defaults={'name': label})
        roles[code] = role
    return roles

@pytest.fixture
def setup_domain(db, rbac_roles):
    """
    Sets up distributors, dealers, sales agents, products, and prices.
    """
    # 1. Distributor
    dist_user = User.objects.create_user(
        username='dist_malwa',
        phone='9826000001',
        role=rbac_roles['distributor'],
        status=User.Status.ACTIVE,
    )
    distributor = Distributor.objects.create(
        user=dist_user,
        distributor_code='DIST-IND-01',
        company_name='Malwa Agro Inputs',
        warehouse_address='Transport Nagar, Indore',
        city='Indore',
        district='Indore',
        state='Madhya Pradesh',
    )

    # 2. Sales Agents
    agent_user_1 = User.objects.create_user(
        username='agent_rajesh',
        phone='9826000002',
        role=rbac_roles['sales_agent'],
        status=User.Status.ACTIVE,
        first_name='Rajesh',
        last_name='Verma',
    )
    agent_1 = SalesAgent.objects.create(
        user=agent_user_1,
        employee_id='SA-MP-101',
        region='Ujjain District',
    )

    agent_user_2 = User.objects.create_user(
        username='agent_vikram',
        phone='9826000003',
        role=rbac_roles['sales_agent'],
        status=User.Status.ACTIVE,
        first_name='Vikram',
        last_name='Patel',
    )
    agent_2 = SalesAgent.objects.create(
        user=agent_user_2,
        employee_id='SA-MP-102',
        region='Dewas District',
    )

    # 3. Dealers
    dealer_user_1 = User.objects.create_user(
        username='dealer_choudhary',
        phone='9826000011',
        role=rbac_roles['dealer'],
        status=User.Status.ACTIVE,
        first_name='Gopal',
        last_name='Choudhary',
    )
    dealer_1 = Dealer.objects.create(
        user=dealer_user_1,
        dealership_name='Choudhary Kisan Kendra',
        mandi_yard='Tarana Mandi Yard',
        address='Main Market, Tarana',
        city='Tarana',
        district='Ujjain',
        state='Madhya Pradesh',
        pincode='456665',
        assigned_distributor=distributor,
        assigned_sales_agent=agent_1,
    )

    dealer_user_2 = User.objects.create_user(
        username='dealer_sharma',
        phone='9826000012',
        role=rbac_roles['dealer'],
        status=User.Status.ACTIVE,
        first_name='Suresh',
        last_name='Sharma',
    )
    dealer_2 = Dealer.objects.create(
        user=dealer_user_2,
        dealership_name='Sharma Pashu Aahar',
        mandi_yard='Dewas Mandi Yard',
        address='AB Road, Dewas',
        city='Dewas',
        district='Dewas',
        state='Madhya Pradesh',
        pincode='455001',
        assigned_distributor=distributor,
        assigned_sales_agent=agent_2,
    )

    # 4. Other Roles
    accounts_user = User.objects.create_user(
        username='accounts_officer',
        phone='9826000020',
        role=rbac_roles['accounts'],
        status=User.Status.ACTIVE,
    )
    loading_user = User.objects.create_user(
        username='loading_operator',
        phone='9826000030',
        role=rbac_roles['loading_operator'],
        status=User.Status.ACTIVE,
    )
    admin_user = User.objects.create_user(
        username='admin_central',
        phone='9826000099',
        role=rbac_roles['admin'],
        status=User.Status.ACTIVE,
        is_staff=True,
    )

    # 5. Products & Pricing
    prod_dairy_plus = Product.objects.create(
        sku='BFEL-DP-50KG',
        name='BFEL Dairy Plus (22% Protein)',
        category='Cattle Feed',
        bag_weight_kg=50,
        protein_percent=Decimal('22.00'),
        fat_percent=Decimal('4.50'),
    )
    ProductPrice.objects.create(
        product=prod_dairy_plus,
        price_per_bag=Decimal('1850.00'),
        is_active=True,
    )

    prod_super_gold = Product.objects.create(
        sku='BFEL-SG-50KG',
        name='BFEL Super Gold (24% Protein)',
        category='Cattle Feed',
        bag_weight_kg=50,
        protein_percent=Decimal('24.00'),
        fat_percent=Decimal('5.00'),
    )
    ProductPrice.objects.create(
        product=prod_super_gold,
        price_per_bag=Decimal('1950.00'),
        is_active=True,
    )

    return {
        'distributor': distributor,
        'dist_user': dist_user,
        'agent_1': agent_1,
        'agent_user_1': agent_user_1,
        'agent_2': agent_2,
        'agent_user_2': agent_user_2,
        'dealer_1': dealer_1,
        'dealer_user_1': dealer_user_1,
        'dealer_2': dealer_2,
        'dealer_user_2': dealer_user_2,
        'accounts_user': accounts_user,
        'loading_user': loading_user,
        'admin_user': admin_user,
        'prod_dairy_plus': prod_dairy_plus,
        'prod_super_gold': prod_super_gold,
    }


# ==============================================================================
# 1. 20 MT & 25 MT Truck Capacity Weight Validation Rules
# ==============================================================================
def test_20t_truck_capacity_validation():
    """20 MT truck allows maximum 400 bags (20,000 kg). >400 bags must be rejected."""
    # 400 bags = 20 MT: Valid
    assert validate_order(Order.TruckCapacity.CAPACITY_20_MT, 400) is True

    weight = calculate_order_weight(400)
    assert weight.weight_kg == Decimal('20000.00')
    assert weight.weight_mt == Decimal('20.000')

    # 401 bags: Rejected
    with pytest.raises(ValidationError) as exc:
        validate_order(Order.TruckCapacity.CAPACITY_20_MT, 401)
    assert "Truck capacity violation" in str(exc.value)
    assert "allows maximum 400 bags" in str(exc.value)


def test_25t_truck_capacity_validation():
    """25 MT truck allows maximum 500 bags (25,000 kg). >500 bags must be rejected."""
    # 500 bags = 25 MT: Valid
    assert validate_order(Order.TruckCapacity.CAPACITY_25_MT, 500) is True

    weight = calculate_order_weight(500)
    assert weight.weight_kg == Decimal('25000.00')
    assert weight.weight_mt == Decimal('25.000')

    # 501 bags: Rejected
    with pytest.raises(ValidationError) as exc:
        validate_order(Order.TruckCapacity.CAPACITY_25_MT, 501)
    assert "Truck capacity violation" in str(exc.value)
    assert "allows maximum 500 bags" in str(exc.value)


# ==============================================================================
# 2. Dealer Creates Order (Service & API)
# ==============================================================================
def test_dealer_creates_order_service(setup_domain):
    """Dealer creates a 20 MT order of 400 bags via service."""
    d = setup_domain
    order = create_order(
        dealer=d['dealer_1'],
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[
            {'product': d['prod_dairy_plus'], 'bags': 250},
            {'product': d['prod_super_gold'], 'bags': 150},
        ],
        destination='Tarana Godown',
        created_by=d['dealer_user_1'],
    )
    assert order.pk is not None
    assert order.total_bags == 400
    assert order.total_weight_kg == Decimal('20000.00')
    assert order.total_weight_mt == Decimal('20.000')
    assert order.status == Order.Status.DRAFT
    assert order.items.count() == 2

    # Volume discount scheme: 400 bags * Rs 30 = Rs 12,000 discount
    assert order.discount == Decimal('12000.00')
    expected_subtotal = (250 * Decimal('1850.00')) + (150 * Decimal('1950.00'))
    assert order.subtotal == expected_subtotal
    assert order.net_total == expected_subtotal - Decimal('12000.00')
    assert order.advance_payable == order.net_total


def test_dealer_creates_order_api(api_client, setup_domain):
    """Dealer creates an order via POST /api/v1/orders/."""
    d = setup_domain
    api_client.force_authenticate(user=d['dealer_user_1'])

    payload = {
        'truck_capacity': '20_MT',
        'destination': 'Tarana Central Godown',
        'items': [
            {'product_id': d['prod_dairy_plus'].id, 'bags': 400}
        ],
        'notes': 'Urgent dispatch for peak lactation cycle.',
    }

    res = api_client.post('/api/v1/orders/', payload, format='json')
    assert res.status_code == 201
    data = res.json()
    assert data['total_bags'] == 400
    assert data['total_weight_mt'] == '20.000'
    assert data['status'] == 'DRAFT'
    assert data['destination'] == 'Tarana Central Godown'
    assert len(data['items']) == 1


def test_dealer_cannot_create_for_other_dealer(api_client, setup_domain):
    """Dealer 1 cannot create an order targeting Dealer 2."""
    d = setup_domain
    api_client.force_authenticate(user=d['dealer_user_1'])

    payload = {
        'dealer_id': d['dealer_2'].id,
        'truck_capacity': '20_MT',
        'destination': 'Dewas Godown',
        'items': [{'product_id': d['prod_dairy_plus'].id, 'bags': 400}],
    }
    res = api_client.post('/api/v1/orders/', payload, format='json')
    assert res.status_code == 403
    assert "Dealers are only permitted to place orders for their own dealership" in res.json().get('detail', '')


# ==============================================================================
# 3. Sales Agent Creates Order (Service & API)
# ==============================================================================
def test_sales_agent_creates_order_api(api_client, setup_domain):
    """Sales Agent 1 creates an order for assigned Dealer 1."""
    d = setup_domain
    api_client.force_authenticate(user=d['agent_user_1'])

    payload = {
        'dealer_id': d['dealer_1'].id,
        'truck_capacity': '25_MT',
        'destination': 'Tarana Godown',
        'items': [{'product_id': d['prod_super_gold'].id, 'bags': 500}],
    }
    res = api_client.post('/api/v1/orders/', payload, format='json')
    assert res.status_code == 201
    data = res.json()
    assert data['total_bags'] == 500
    assert data['total_weight_mt'] == '25.000'
    assert data['truck_capacity'] == '25_MT'


def test_sales_agent_cannot_create_for_unassigned_dealer(api_client, setup_domain):
    """Sales Agent 1 is not assigned to Dealer 2, so order creation must fail."""
    d = setup_domain
    api_client.force_authenticate(user=d['agent_user_1'])

    payload = {
        'dealer_id': d['dealer_2'].id,
        'truck_capacity': '20_MT',
        'destination': 'Dewas Godown',
        'items': [{'product_id': d['prod_super_gold'].id, 'bags': 400}],
    }
    res = api_client.post('/api/v1/orders/', payload, format='json')
    assert res.status_code == 403
    assert "not assigned to dealer" in res.json().get('detail', '')


# ==============================================================================
# 4. Unauthorized Role Cannot Create
# ==============================================================================
def test_unauthorized_roles_cannot_create_orders(api_client, setup_domain):
    """Accounts, Loading Operator, and Distributor cannot create feed orders."""
    d = setup_domain
    payload = {
        'dealer_id': d['dealer_1'].id,
        'truck_capacity': '20_MT',
        'destination': 'Tarana Godown',
        'items': [{'product_id': d['prod_dairy_plus'].id, 'bags': 400}],
    }

    for unauthorized_user in [d['accounts_user'], d['loading_user'], d['dist_user']]:
        api_client.force_authenticate(user=unauthorized_user)
        res = api_client.post('/api/v1/orders/', payload, format='json')
        assert res.status_code == 403
        assert "not authorized to create feed orders" in res.json().get('detail', '')


# ==============================================================================
# 5. 20T and 25T Capacity API Rejections
# ==============================================================================
def test_20t_capacity_rejection_api(api_client, setup_domain):
    """20 MT with 401 bags must return 400 Bad Request."""
    d = setup_domain
    api_client.force_authenticate(user=d['dealer_user_1'])

    payload = {
        'truck_capacity': '20_MT',
        'destination': 'Tarana Godown',
        'items': [{'product_id': d['prod_dairy_plus'].id, 'bags': 401}],
    }
    res = api_client.post('/api/v1/orders/', payload, format='json')
    assert res.status_code == 400
    assert "Truck capacity violation" in res.json().get('detail', '')


def test_25t_capacity_rejection_api(api_client, setup_domain):
    """25 MT with 501 bags must return 400 Bad Request."""
    d = setup_domain
    api_client.force_authenticate(user=d['dealer_user_1'])

    payload = {
        'truck_capacity': '25_MT',
        'destination': 'Tarana Godown',
        'items': [{'product_id': d['prod_dairy_plus'].id, 'bags': 501}],
    }
    res = api_client.post('/api/v1/orders/', payload, format='json')
    assert res.status_code == 400
    assert "Truck capacity violation" in res.json().get('detail', '')


# ==============================================================================
# 6. Payment Gate (100% Advance Payment Rule)
# ==============================================================================
def test_order_advance_payment_gate(setup_domain):
    """
    An order must NOT become eligible for loading until 100% advance payment is verified.
    """
    d = setup_domain
    order = create_order(
        dealer=d['dealer_1'],
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': d['prod_dairy_plus'], 'bags': 400}],
        destination='Tarana Godown',
        created_by=d['dealer_user_1'],
    )
    submit_order(order, user=d['dealer_user_1'])
    assert order.status == Order.Status.PAYMENT_PENDING

    # Attempt to bypass payment and transition directly to LOADING_QUEUED
    with pytest.raises(InvalidOrderStateTransitionError):
        # Cannot jump from PAYMENT_PENDING to LOADING_QUEUED directly
        transition_order_state(order, Order.Status.LOADING_QUEUED)

    # Transition to PAYMENT_SUBMITTED then PAYMENT_VERIFIED
    transition_order_state(order, Order.Status.PAYMENT_SUBMITTED)

    # Simulate advance_paid not recorded
    assert order.advance_paid == Decimal('0.00')
    assert order.advance_payable > Decimal('0.00')

    transition_order_state(order, Order.Status.PAYMENT_VERIFIED)

    # Attempt to transition to LOADING_QUEUED without verified payment amount
    with pytest.raises(ValidationError) as exc:
        transition_order_state(order, Order.Status.LOADING_QUEUED)
    assert "100% advance payment required before loading" in str(exc.value)

    # Now record 100% verified payment
    Payment.objects.create(
        order=order,
        dealer=d['dealer_1'],
        amount=order.advance_payable,
        payment_mode=Payment.Mode.RTGS,
        utr_number='UTR-SBI-20261002-88899',
        bank_name='State Bank of India',
        status=Payment.Status.VERIFIED,
    )

    # Now transition to LOADING_QUEUED must succeed
    transition_order_state(order, Order.Status.LOADING_QUEUED)
    assert order.status == Order.Status.LOADING_QUEUED

    # Transition to LOADING must succeed
    transition_order_state(order, Order.Status.LOADING)
    assert order.status == Order.Status.LOADING


# ==============================================================================
# 7. Order State Transitions & Cancellation
# ==============================================================================
def test_order_submission_api(api_client, setup_domain):
    """POST /api/v1/orders/{id}/submit/ transitions order to PLACED / PAYMENT_PENDING."""
    d = setup_domain
    order = create_order(
        dealer=d['dealer_1'],
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': d['prod_dairy_plus'], 'bags': 400}],
        destination='Tarana Godown',
        created_by=d['dealer_user_1'],
    )
    api_client.force_authenticate(user=d['dealer_user_1'])

    res = api_client.post(f'/api/v1/orders/{order.id}/submit/')
    assert res.status_code == 200
    assert res.json()['status'] == Order.Status.PAYMENT_PENDING


def test_order_cancellation_allowed_and_blocked(api_client, setup_domain):
    """Order can be cancelled before loading, but blocked once loading starts."""
    d = setup_domain
    order = create_order(
        dealer=d['dealer_1'],
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': d['prod_dairy_plus'], 'bags': 400}],
        destination='Tarana Godown',
        created_by=d['dealer_user_1'],
    )
    api_client.force_authenticate(user=d['dealer_user_1'])

    # Cancel DRAFT order succeeds
    res = api_client.post(f'/api/v1/orders/{order.id}/cancel/', {'reason': 'Dealer requested date change.'}, format='json')
    assert res.status_code == 200
    assert res.json()['status'] == Order.Status.CANCELLED

    # Create another order and move to LOADING
    order2 = create_order(
        dealer=d['dealer_1'],
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': d['prod_dairy_plus'], 'bags': 400}],
        destination='Tarana Godown',
        created_by=d['dealer_user_1'],
    )
    submit_order(order2, user=d['dealer_user_1'])
    transition_order_state(order2, Order.Status.PAYMENT_SUBMITTED)
    Payment.objects.create(
        order=order2,
        dealer=d['dealer_1'],
        amount=order2.advance_payable,
        payment_mode=Payment.Mode.RTGS,
        utr_number='UTR-SBI-20261002-99999',
        bank_name='State Bank of India',
        status=Payment.Status.VERIFIED,
    )
    transition_order_state(order2, Order.Status.PAYMENT_VERIFIED)
    transition_order_state(order2, Order.Status.LOADING_QUEUED)
    transition_order_state(order2, Order.Status.LOADING)

    # Attempt to cancel LOADING order must fail
    res2 = api_client.post(f'/api/v1/orders/{order2.id}/cancel/', {'reason': 'Cancel during loading'}, format='json')
    assert res2.status_code == 400
    assert "Cannot cancel order in status 'LOADING'" in res2.json().get('detail', '')


# ==============================================================================
# 8. Ownership Isolation
# ==============================================================================
def test_ownership_isolation_between_dealers(api_client, setup_domain):
    """
    Dealer 1 and Dealer 2 cannot view or act upon each other's orders.
    """
    d = setup_domain
    order_d1 = create_order(
        dealer=d['dealer_1'],
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': d['prod_dairy_plus'], 'bags': 400}],
        destination='Tarana Godown',
        created_by=d['dealer_user_1'],
    )

    order_d2 = create_order(
        dealer=d['dealer_2'],
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': d['prod_super_gold'], 'bags': 400}],
        destination='Dewas Godown',
        created_by=d['dealer_user_2'],
    )

    # Dealer 1 views orders list: sees only order_d1
    api_client.force_authenticate(user=d['dealer_user_1'])
    res_list = api_client.get('/api/v1/orders/')
    assert res_list.status_code == 200
    order_ids = [o['id'] for o in res_list.json()]
    assert order_d1.id in order_ids
    assert order_d2.id not in order_ids

    # Dealer 1 attempts to view Dealer 2's order detail -> 403 Forbidden
    res_detail = api_client.get(f'/api/v1/orders/{order_d2.id}/')
    assert res_detail.status_code == 403

    # Dealer 1 attempts to cancel Dealer 2's order -> 403 Forbidden
    res_cancel = api_client.post(f'/api/v1/orders/{order_d2.id}/cancel/', {'reason': 'Malicious cancel'})
    assert res_cancel.status_code == 403


# ==============================================================================
# 9. Frontend Authoritative MT Calculation Endpoint
# ==============================================================================
def test_calculate_weight_endpoint(api_client, setup_domain):
    """
    Frontend query to display calculated MT value.
    GET /api/v1/orders/calculate-weight/?bags=400&truck_capacity=20_MT
    """
    d = setup_domain
    api_client.force_authenticate(user=d['dealer_user_1'])

    res = api_client.get('/api/v1/orders/calculate-weight/?bags=400&truck_capacity=20_MT')
    assert res.status_code == 200
    data = res.json()
    assert data['weight_kg'] == '20000.00'
    assert data['weight_mt'] == '20.000'
    assert data['is_valid'] is True

    # Bad request if bags exceed truck capacity
    res_bad = api_client.get('/api/v1/orders/calculate-weight/?bags=450&truck_capacity=20_MT')
    assert res_bad.status_code == 400
    assert res_bad.json()['is_valid'] is False
