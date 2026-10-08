import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, PermissionDenied

from apps.users.models import Role, SalesAgent
from apps.dealers.models import Dealer
from apps.distributors.models import Distributor
from apps.products.models import Product, ProductPrice
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.loading.models import (
    Truck,
    Driver,
    LoadingBay,
    LoadingOperator,
    LoadingSession,
    WeighbridgeReading,
)
from apps.dispatch.models import GatePass
from services.orders import create_order, submit_order, transition_order_state
from services.payments import PaymentService
from services.loading import TruckLoadingService

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
def setup_loading_domain(db, rbac_roles):
    """
    Sets up users, logistics assets (trucks, bays, drivers), products, and orders.
    """
    # 1. Operators & Users
    loading_user = User.objects.create_user(
        username='operator_ramesh',
        phone='9826200001',
        role=rbac_roles['loading_operator'],
        status=User.Status.ACTIVE,
        first_name='Ramesh',
        last_name='Yadav',
    )
    operator = LoadingOperator.objects.create(
        user=loading_user,
        employee_id='LOP-001',
        plant_terminal='Manglia Loading Terminal, Indore',
    )

    accounts_user = User.objects.create_user(
        username='accounts_sharma',
        phone='9826200002',
        role=rbac_roles['accounts'],
        status=User.Status.ACTIVE,
    )

    dealer_user = User.objects.create_user(
        username='dealer_patel',
        phone='9826200003',
        role=rbac_roles['dealer'],
        status=User.Status.ACTIVE,
    )

    dist_user = User.objects.create_user(
        username='dist_indore',
        phone='9826200004',
        role=rbac_roles['distributor'],
        status=User.Status.ACTIVE,
    )
    distributor = Distributor.objects.create(
        user=dist_user,
        distributor_code='DIST-IND-02',
        company_name='Indore Feeds Hub',
        warehouse_address='Manglia, Indore',
        city='Indore',
        district='Indore',
        state='Madhya Pradesh',
    )

    dealer = Dealer.objects.create(
        user=dealer_user,
        dealership_name='Patel Agro Agency',
        mandi_yard='Sanwer Mandi',
        address='Main Road, Sanwer',
        city='Sanwer',
        district='Indore',
        state='Madhya Pradesh',
        pincode='453551',
        assigned_distributor=distributor,
    )

    # 2. Trucks
    truck_20t = Truck.objects.create(
        registration_number='MP-09-AB-1234',
        capacity_type=Truck.CapacityType.CAPACITY_20_MT,
        capacity_mt=Decimal('20.00'),
        max_bags=400,
    )
    truck_25t = Truck.objects.create(
        registration_number='MP-09-CD-5678',
        capacity_type=Truck.CapacityType.CAPACITY_25_MT,
        capacity_mt=Decimal('25.00'),
        max_bags=500,
    )

    # 3. Drivers & Bays
    driver = Driver.objects.create(
        name='Balwinder Singh',
        phone='9826299999',
        license_number='DL-MP-2020-0099',
    )
    bay_1 = LoadingBay.objects.create(
        bay_number='BAY-01',
        name='Main Bulk Feeds Bay 1',
    )

    # 4. Product & Price
    product = Product.objects.create(
        sku='BFEL-DP-50KG',
        name='BFEL Dairy Plus (22% Protein)',
        category='Cattle Feed',
        bag_weight_kg=50,
        protein_percent=Decimal('22.00'),
        fat_percent=Decimal('4.50'),
    )
    ProductPrice.objects.create(
        product=product,
        price_per_bag=Decimal('1850.00'),
        is_active=True,
    )

    # 5. Orders: 20 MT Order (400 bags) & 25 MT Order (500 bags)
    order_20t = create_order(
        dealer=dealer,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': product, 'bags': 400}],
        destination='Sanwer Godown',
        created_by=dealer_user,
    )
    submit_order(order_20t, user=dealer_user)

    order_25t = create_order(
        dealer=dealer,
        truck_capacity=Order.TruckCapacity.CAPACITY_25_MT,
        items=[{'product': product, 'bags': 500}],
        destination='Sanwer Godown',
        created_by=dealer_user,
    )
    submit_order(order_25t, user=dealer_user)

    return {
        'operator': operator,
        'loading_user': loading_user,
        'accounts_user': accounts_user,
        'dealer_user': dealer_user,
        'dealer': dealer,
        'truck_20t': truck_20t,
        'truck_25t': truck_25t,
        'driver': driver,
        'bay_1': bay_1,
        'product': product,
        'order_20t': order_20t,
        'order_25t': order_25t,
    }


def pay_and_verify_order(order, accounts_user, dealer_user):
    """Helper to simulate advance remittance and accounts verification."""
    payment = PaymentService.submit_payment(
        order=order,
        payment_mode=Payment.Mode.RTGS,
        utr_number=f"UTR-{order.order_number}",
        bank_name='SBI Plant Account',
        submitted_by=dealer_user,
    )
    PaymentService.verify_payment(payment, user=accounts_user)
    order.refresh_from_db()
    assert order.status == Order.Status.PAYMENT_VERIFIED


# ==============================================================================
# 1. 20 MT (400 bags) and 25 MT (500 bags) Capacity Enforcement
# ==============================================================================
def test_truck_capacity_mismatch_and_max_bags(setup_loading_domain):
    """
    Cannot assign 25 MT truck to 20 MT order, and cannot assign 20 MT truck to 25 MT order.
    """
    d = setup_loading_domain
    order_20t = d['order_20t']
    order_25t = d['order_25t']
    pay_and_verify_order(order_20t, d['accounts_user'], d['dealer_user'])
    pay_and_verify_order(order_25t, d['accounts_user'], d['dealer_user'])

    # Assign 25 MT truck to 20 MT order fails
    with pytest.raises(ValidationError) as exc:
        TruckLoadingService.assign_truck_and_bay(
            order=order_20t,
            truck=d['truck_25t'], # 25 MT truck
            bay=d['bay_1'],
            driver=d['driver'],
            operator_user=d['loading_user'],
        )
    assert "Truck capacity mismatch" in str(exc.value)

    # Assign 20 MT truck to 25 MT order fails
    with pytest.raises(ValidationError) as exc2:
        TruckLoadingService.assign_truck_and_bay(
            order=order_25t,
            truck=d['truck_20t'], # 20 MT truck (max 400 bags) for 500 bags order
            bay=d['bay_1'],
            driver=d['driver'],
            operator_user=d['loading_user'],
        )
    assert "Truck capacity mismatch" in str(exc2.value)


# ==============================================================================
# 2. Electronic Weighbridge Calculations & Tolerance
# ==============================================================================
def test_weighbridge_calculations_and_tolerance(setup_loading_domain):
    """
    Gross - Tare = Net Weight.
    Validates variance against expected weight (loaded_bags * 50 kg) within tolerance.
    """
    d = setup_loading_domain
    order = d['order_20t']
    pay_and_verify_order(order, d['accounts_user'], d['dealer_user'])

    session = TruckLoadingService.assign_truck_and_bay(
        order=order,
        truck=d['truck_20t'],
        bay=d['bay_1'],
        driver=d['driver'],
        operator_user=d['loading_user'],
    )
    TruckLoadingService.start_loading(session, operator_user=d['loading_user'])
    TruckLoadingService.record_bag_count(session, 400, operator_user=d['loading_user'])

    # 400 bags * 50 kg = 20,000 kg expected net weight.
    # Tare = 10,000 kg. Gross = 30,050 kg. Calculated Net = 20,050 kg. Variance = +50 kg.
    # Within 100 kg tolerance.
    reading = TruckLoadingService.record_weighbridge(
        session=session,
        tare_weight_kg=Decimal('10000.00'),
        gross_weight_kg=Decimal('30050.00'),
        operator_user=d['loading_user'],
    )
    assert reading.net_weight_kg == Decimal('20050.00')
    assert reading.expected_weight_kg == Decimal('20000.00')
    assert reading.variance_kg == Decimal('50.00')
    assert reading.is_within_tolerance is True

    # Gross <= Tare: Must raise ValidationError
    with pytest.raises(ValidationError) as exc_invalid:
        TruckLoadingService.record_weighbridge(
            session=session,
            tare_weight_kg=Decimal('15000.00'),
            gross_weight_kg=Decimal('15000.00'),
            operator_user=d['loading_user'],
        )
    assert "must be strictly greater than tare weight" in str(exc_invalid.value)

    # Out of tolerance variance: e.g. Gross = 30,250 kg. Variance = +250 kg (tolerance is 100 kg)
    with pytest.raises(ValidationError) as exc_tol:
        TruckLoadingService.record_weighbridge(
            session=session,
            tare_weight_kg=Decimal('10000.00'),
            gross_weight_kg=Decimal('30250.00'),
            operator_user=d['loading_user'],
        )
    assert "exceeds maximum allowed tolerance" in str(exc_tol.value)


# ==============================================================================
# 3. Invalid Loading Over Bag Limits
# ==============================================================================
def test_invalid_loading_bag_count(setup_loading_domain):
    """
    Attempting to record more bags than allowed by truck capacity or order must fail.
    """
    d = setup_loading_domain
    order = d['order_20t']
    pay_and_verify_order(order, d['accounts_user'], d['dealer_user'])

    session = TruckLoadingService.assign_truck_and_bay(
        order=order,
        truck=d['truck_20t'],
        bay=d['bay_1'],
        driver=d['driver'],
        operator_user=d['loading_user'],
    )
    TruckLoadingService.start_loading(session, operator_user=d['loading_user'])

    # 401 bags on 20 MT truck fails
    with pytest.raises(ValidationError) as exc:
        TruckLoadingService.record_bag_count(session, 401, operator_user=d['loading_user'])
    assert "allows maximum 400 bags" in str(exc.value)


# ==============================================================================
# 4. Unauthorized Operator Role Restrictions
# ==============================================================================
def test_unauthorized_operator_blocked(setup_loading_domain):
    """
    Dealer, Sales Agent, Accounts, or Distributor cannot perform plant loading operations.
    """
    d = setup_loading_domain
    order = d['order_20t']
    pay_and_verify_order(order, d['accounts_user'], d['dealer_user'])

    for unauth_user in [d['dealer_user'], d['accounts_user']]:
        with pytest.raises(PermissionDenied):
            TruckLoadingService.assign_truck_and_bay(
                order=order,
                truck=d['truck_20t'],
                bay=d['bay_1'],
                driver=d['driver'],
                operator_user=unauth_user,
            )


# ==============================================================================
# 5. Gate Pass Blocking Conditions
# ==============================================================================
def test_gate_pass_blocking_rules(setup_loading_domain):
    """
    Gate pass generation is strictly blocked if:
    - required quantity is not loaded
    - security seal is missing
    - weighbridge reading is missing or out of tolerance
    - order is not in LOADED status
    """
    d = setup_loading_domain
    order = d['order_20t']
    pay_and_verify_order(order, d['accounts_user'], d['dealer_user'])

    session = TruckLoadingService.assign_truck_and_bay(
        order=order,
        truck=d['truck_20t'],
        bay=d['bay_1'],
        driver=d['driver'],
        operator_user=d['loading_user'],
    )
    TruckLoadingService.start_loading(session, operator_user=d['loading_user'])

    # Only 300 of 400 bags loaded -> Cannot complete loading
    TruckLoadingService.record_bag_count(session, 300, operator_user=d['loading_user'])

    with pytest.raises(ValidationError) as exc_inc:
        TruckLoadingService.complete_loading(session, seal_number='SEAL-9988', operator_user=d['loading_user'])
    assert "Incomplete loading" in str(exc_inc.value)

    # Record full 400 bags
    TruckLoadingService.record_bag_count(session, 400, operator_user=d['loading_user'])

    # Missing weighbridge ticket -> Cannot complete loading
    with pytest.raises(ValidationError) as exc_wb:
        TruckLoadingService.complete_loading(session, seal_number='SEAL-9988', operator_user=d['loading_user'])
    assert "Weighbridge reading is required" in str(exc_wb.value)

    # Empty seal number -> Cannot complete loading
    TruckLoadingService.record_weighbridge(
        session=session,
        tare_weight_kg=Decimal('10000.00'),
        gross_weight_kg=Decimal('30000.00'),
        operator_user=d['loading_user'],
    )

    with pytest.raises(ValidationError) as exc_seal:
        TruckLoadingService.complete_loading(session, seal_number='   ', operator_user=d['loading_user'])
    assert "Security seal number is mandatory" in str(exc_seal.value)

    # Order is still in LOADING status, attempting to generate gate pass fails
    with pytest.raises(ValidationError) as exc_gp:
        TruckLoadingService.generate_gate_pass(session, operator_user=d['loading_user'])
    assert "Order must be in 'LOADED' status" in str(exc_gp.value)


# ==============================================================================
# 6. End-to-End Successful Loading and Gate Pass Issuance
# ==============================================================================
def test_successful_loading_and_gate_pass_flow_api(api_client, setup_loading_domain):
    """
    End-to-end operational flow through API:
    PAYMENT_VERIFIED -> ASSIGN TRUCK/BAY -> START LOADING -> BAG COUNT -> WEIGHBRIDGE -> COMPLETE -> GATE PASS.
    """
    d = setup_loading_domain
    order = d['order_20t']
    pay_and_verify_order(order, d['accounts_user'], d['dealer_user'])

    api_client.force_authenticate(user=d['loading_user'])

    # 1. Assign truck & bay
    assign_payload = {
        'order_id': order.id,
        'truck_id': d['truck_20t'].id,
        'bay_id': d['bay_1'].id,
        'driver_id': d['driver'].id,
    }
    res_assign = api_client.post('/api/v1/loading/sessions/assign/', assign_payload, format='json')
    assert res_assign.status_code == 201
    session_id = res_assign.json()['id']

    # 2. Start Loading
    res_start = api_client.post(f'/api/v1/loading/sessions/{session_id}/start/')
    assert res_start.status_code == 200
    assert res_start.json()['status'] == 'IN_PROGRESS'
    order.refresh_from_db()
    assert order.status == Order.Status.LOADING

    # 3. Record Bags Loaded (400 bags)
    res_bags = api_client.post(f'/api/v1/loading/sessions/{session_id}/bag-count/', {'bags_loaded': 400}, format='json')
    assert res_bags.status_code == 200
    assert res_bags.json()['bags_loaded'] == 400

    # 4. Record Weighbridge (Tare: 10,000 kg, Gross: 30,020 kg -> Net: 20,020 kg, Var: +20 kg)
    wb_payload = {
        'tare_weight_kg': '10000.00',
        'gross_weight_kg': '30020.00',
    }
    res_wb = api_client.post(f'/api/v1/loading/sessions/{session_id}/weighbridge/', wb_payload, format='json')
    assert res_wb.status_code == 201
    wb_data = res_wb.json()
    assert wb_data['net_weight_kg'] == '20020.00'
    assert wb_data['is_within_tolerance'] is True

    # 5. Complete Loading with Seal Number
    res_comp = api_client.post(f'/api/v1/loading/sessions/{session_id}/complete/', {'seal_number': 'SEAL-BFEL-0099'}, format='json')
    assert res_comp.status_code == 200
    assert res_comp.json()['status'] == 'COMPLETED'
    order.refresh_from_db()
    assert order.status == Order.Status.LOADED

    # 6. Generate Gate Pass
    res_gp = api_client.post(f'/api/v1/loading/sessions/{session_id}/gate-pass/')
    assert res_gp.status_code == 201
    gp_data = res_gp.json()
    assert 'GP-' in gp_data['gate_pass_number']
    assert gp_data['seal_number'] == 'SEAL-BFEL-0099'
    assert gp_data['truck_number'] == 'MP-09-AB-1234'
    assert gp_data['qr_code_hash'] != ''

    # Order must transition to GATE_CLEARED
    order.refresh_from_db()
    assert order.status == Order.Status.GATE_CLEARED
