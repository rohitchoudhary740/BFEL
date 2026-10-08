import pytest
from decimal import Decimal
from unittest.mock import patch
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.users.models import Role
from apps.dealers.models import Dealer
from apps.distributors.models import Distributor
from apps.products.models import Product, ProductPrice
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.loading.models import Truck, Driver, LoadingBay, LoadingSession
from apps.dispatch.models import GatePass, Dispatch
from apps.claims.models import Claim
from services.orders import create_order, submit_order
from services.payments import PaymentService
from services.loading import TruckLoadingService
from services.dispatch import DispatchService
from services.claims import ClaimService
from services.whatsapp import WhatsAppService
from services.live import OperationalLiveUpdateService

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
def setup_operational_pipeline(db, rbac_roles):
    """
    Sets up users, plant infrastructure, catalog, and dealerships for live operational testing.
    """
    # 1. Operators & Staff
    admin_user = User.objects.create_user(
        username='admin_live',
        phone='9826500001',
        role=rbac_roles['admin'],
        status=User.Status.ACTIVE,
    )
    accounts_user = User.objects.create_user(
        username='accounts_live',
        phone='9826500002',
        role=rbac_roles['accounts'],
        status=User.Status.ACTIVE,
    )
    loading_user = User.objects.create_user(
        username='operator_live',
        phone='9826500003',
        role=rbac_roles['loading_operator'],
        status=User.Status.ACTIVE,
    )

    # 2. Dealers
    dealer1_user = User.objects.create_user(
        username='dealer_dewas_live',
        phone='9826500010',
        role=rbac_roles['dealer'],
        status=User.Status.ACTIVE,
    )
    dealer1 = Dealer.objects.create(
        user=dealer1_user,
        dealership_name='Dewas Agro Solutions',
        mandi_yard='Dewas Mandi Yard',
        address='AB Road',
        city='Dewas',
        district='Dewas',
        state='Madhya Pradesh',
        pincode='455001',
    )

    dealer2_user = User.objects.create_user(
        username='dealer_ujjain_live',
        phone='9826500011',
        role=rbac_roles['dealer'],
        status=User.Status.ACTIVE,
    )
    dealer2 = Dealer.objects.create(
        user=dealer2_user,
        dealership_name='Ujjain Pashu Sewa',
        mandi_yard='Ujjain Krishi Mandi',
        address='Indore Road',
        city='Ujjain',
        district='Ujjain',
        state='Madhya Pradesh',
        pincode='456001',
    )

    # 3. Distributor
    dist_user = User.objects.create_user(
        username='dist_live',
        phone='9826500020',
        role=rbac_roles['distributor'],
        status=User.Status.ACTIVE,
    )
    distributor = Distributor.objects.create(
        user=dist_user,
        company_name='Nimar Feeds Hub Pvt Ltd',
        distributor_code='DIST-NIMAR-01',
        gstin='23AAACN5566M1Z2',
        warehouse_address='Industrial Area, Dewas',
        city='Dewas',
        district='Dewas',
    )
    dealer1.assigned_distributor = distributor
    dealer1.save()

    # 4. Product Catalog (20 MT truck = 400 bags)
    product = Product.objects.create(
        sku='BFEL-LIVE-50',
        name='BFEL Super Gold 20',
        category='Cattle Feed',
        bag_weight_kg=50,
        protein_percent=Decimal('20.00'),
        fat_percent=Decimal('4.00'),
    )
    ProductPrice.objects.create(product=product, price_per_bag=Decimal('1500.00'), is_active=True)

    # 5. Plant Logistics (Truck, Driver, Loading Bay)
    truck = Truck.objects.create(
        registration_number='MP-09-LIVE-101',
        capacity_type=Truck.CapacityType.CAPACITY_20_MT,
        capacity_mt=Decimal('20.00'),
        max_bags=400,
    )
    driver = Driver.objects.create(
        name='Rameshwar Patidar',
        phone='9826500030',
        license_number='MP0920230099881',
    )
    bay = LoadingBay.objects.create(
        bay_number='BAY-01',
        name='Plant East Bay 1',
        is_active=True,
    )

    return {
        'admin_user': admin_user,
        'accounts_user': accounts_user,
        'loading_user': loading_user,
        'dealer1_user': dealer1_user,
        'dealer1': dealer1,
        'dealer2_user': dealer2_user,
        'dealer2': dealer2,
        'distributor': distributor,
        'dist_user': dist_user,
        'product': product,
        'truck': truck,
        'driver': driver,
        'bay': bay,
    }


# ==============================================================================
# 1. Payment Verification -> Loading Queue Visibility -> Dealer Status
# ==============================================================================
def test_payment_verified_visible_to_loading_queue_and_dealer(setup_operational_pipeline):
    """
    Workflow Step 1:
    When Accounts verifies payment:
    - Order becomes payment verified
    - Loading queue can see it
    - Dealer sees updated order status
    """
    p = setup_operational_pipeline
    dealer1 = p['dealer1']
    dealer1_user = p['dealer1_user']
    accounts_user = p['accounts_user']
    loading_user = p['loading_user']
    product = p['product']

    client = APIClient()

    # Dealer creates and submits 20 MT order (400 bags)
    order = create_order(
        dealer=dealer1,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': product, 'bags': 400}],
        destination='Dewas Mandi Yard',
        created_by=dealer1_user,
    )
    submit_order(order, user=dealer1_user)
    assert order.status == Order.Status.PAYMENT_PENDING

    # Dealer submits advance payment
    payment = PaymentService.submit_payment(
        order=order,
        payment_mode=Payment.Mode.RTGS,
        utr_number=f"UTR-LIVE-{order.order_number}",
        bank_name='HDFC Bank',
        submitted_by=dealer1_user,
    )

    # Before verification: Order is NOT in loading queue
    queue_before = OperationalLiveUpdateService.get_loading_queue()
    queued_order_ids_before = [o['order_id'] for o in queue_before['queued_orders']]
    assert order.id not in queued_order_ids_before

    # Accounts verifies payment
    PaymentService.verify_payment(payment, user=accounts_user)
    order.refresh_from_db()
    assert order.status == Order.Status.PAYMENT_VERIFIED

    # 1. Loading queue immediately sees the order!
    queue_after = OperationalLiveUpdateService.get_loading_queue()
    queued_order_ids_after = [o['order_id'] for o in queue_after['queued_orders']]
    assert order.id in queued_order_ids_after

    queued_item = next(o for o in queue_after['queued_orders'] if o['order_id'] == order.id)
    assert queued_item['order_number'] == order.order_number
    assert queued_item['dealer_name'] == dealer1.dealership_name
    assert queued_item['total_bags'] == 400
    assert queued_item['status'] == Order.Status.PAYMENT_VERIFIED

    # 2. Dealer sees updated order status via live tracking endpoint
    client.force_authenticate(user=dealer1_user)
    resp = client.get(f'/api/v1/live/orders/{order.id}/')
    assert resp.status_code == 200
    live_data = resp.json()
    assert live_data['status'] == Order.Status.PAYMENT_VERIFIED
    assert live_data['payment']['is_verified'] is True
    assert live_data['loading']['is_queued'] is True
    assert "Queued for Plant Loading" in live_data['current_step']

    # 3. Loading operator workspace endpoint also reflects the queue
    client.force_authenticate(user=loading_user)
    loading_resp = client.get('/api/v1/loading/workspace/')
    assert loading_resp.status_code == 200
    loading_ws = loading_resp.json()
    assert loading_ws['workspace'] == 'loading_operator'
    assert any(o['order_id'] == order.id for o in loading_ws['queued_orders'])


# ==============================================================================
# 2. Loading Completes -> Gate Pass Available -> Dispatch Can Proceed
# ==============================================================================
def test_loading_completes_unlocks_gate_pass_and_dispatch(setup_operational_pipeline):
    """
    Workflow Step 2:
    When Loading completes:
    - Order becomes loaded
    - Gate Pass becomes available
    - Dispatch can proceed
    """
    p = setup_operational_pipeline
    dealer1 = p['dealer1']
    dealer1_user = p['dealer1_user']
    accounts_user = p['accounts_user']
    loading_user = p['loading_user']
    product = p['product']
    truck = p['truck']
    driver = p['driver']
    bay = p['bay']

    client = APIClient()

    # Create, pay, and queue order
    order = create_order(
        dealer=dealer1,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': product, 'bags': 400}],
        destination='Dewas Mandi Yard',
        created_by=dealer1_user,
    )
    submit_order(order, user=dealer1_user)
    payment = PaymentService.submit_payment(
        order=order,
        payment_mode=Payment.Mode.RTGS,
        utr_number=f"UTR-LIVE-{order.order_number}",
        bank_name='HDFC Bank',
        submitted_by=dealer1_user,
    )
    PaymentService.verify_payment(payment, user=accounts_user)
    order.refresh_from_db()

    # Assign truck and bay
    session = TruckLoadingService.assign_truck_and_bay(
        order=order,
        truck=truck,
        bay=bay,
        driver=driver,
        operator_user=loading_user,
    )
    TruckLoadingService.start_loading(session, operator_user=loading_user)
    TruckLoadingService.record_bag_count(session, 400, operator_user=loading_user)
    TruckLoadingService.record_weighbridge(
        session=session,
        tare_weight_kg=Decimal('10000.00'),
        gross_weight_kg=Decimal('30000.00'),
        operator_user=loading_user,
    )

    # Before completion: Dispatch cannot proceed
    with pytest.raises(Exception):
        DispatchService.create_dispatch(
            order=order,
            lr_number='LR-FAIL-TEST',
            operator_user=loading_user,
        )

    # Loading completes
    TruckLoadingService.complete_loading(session, seal_number='SEAL-LIVE-888', operator_user=loading_user)
    order.refresh_from_db()
    assert order.status == Order.Status.LOADED

    # Live status reflects LOADED
    client.force_authenticate(user=dealer1_user)
    live_resp = client.get(f'/api/v1/live/orders/{order.id}/')
    assert live_resp.status_code == 200
    assert live_resp.json()['status'] == Order.Status.LOADED
    assert live_resp.json()['loading']['is_loaded'] is True
    assert live_resp.json()['loading']['seal_number'] == 'SEAL-LIVE-888'

    # Gate Pass becomes available
    gate_pass = TruckLoadingService.generate_gate_pass(session, operator_user=loading_user)
    order.refresh_from_db()
    assert order.status == Order.Status.GATE_CLEARED
    assert gate_pass.gate_pass_number.startswith('GP-')

    # Live status reflects gate pass available
    live_resp2 = client.get(f'/api/v1/live/orders/{order.id}/')
    assert live_resp2.json()['gate_pass']['is_available'] is True
    assert live_resp2.json()['gate_pass']['pass_number'] == gate_pass.gate_pass_number
    assert live_resp2.json()['gate_pass']['is_cleared'] is True

    # Dispatch can now proceed!
    dispatch = DispatchService.create_dispatch(
        order=order,
        lr_number='LR-LIVE-SUCCESS-101',
        operator_user=loading_user,
        gate_pass=gate_pass,
    )
    assert dispatch.pk is not None
    order.refresh_from_db()
    assert order.status == Order.Status.DISPATCHED


# ==============================================================================
# 3. Dispatch Created -> Dealer Sees Dispatched -> WhatsApp Alert Triggered
# ==============================================================================
def test_dispatch_created_dealer_status_and_whatsapp(setup_operational_pipeline):
    """
    Workflow Step 3:
    When Dispatch is created:
    - Dealer sees dispatched status
    - WhatsApp notification is triggered
    """
    p = setup_operational_pipeline
    dealer1 = p['dealer1']
    dealer1_user = p['dealer1_user']
    accounts_user = p['accounts_user']
    loading_user = p['loading_user']
    product = p['product']
    truck = p['truck']
    driver = p['driver']
    bay = p['bay']

    client = APIClient()

    # Complete pipeline up to Gate Cleared
    order = create_order(
        dealer=dealer1,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': product, 'bags': 400}],
        destination='Dewas Mandi Yard',
        created_by=dealer1_user,
    )
    submit_order(order, user=dealer1_user)
    payment = PaymentService.submit_payment(
        order=order,
        payment_mode=Payment.Mode.RTGS,
        utr_number=f"UTR-LIVE-{order.order_number}",
        bank_name='HDFC Bank',
        submitted_by=dealer1_user,
    )
    PaymentService.verify_payment(payment, user=accounts_user)
    order.refresh_from_db()
    session = TruckLoadingService.assign_truck_and_bay(
        order=order, truck=truck, bay=bay, driver=driver, operator_user=loading_user
    )
    TruckLoadingService.start_loading(session, operator_user=loading_user)
    TruckLoadingService.record_bag_count(session, 400, operator_user=loading_user)
    TruckLoadingService.record_weighbridge(
        session=session,
        tare_weight_kg=Decimal('10000.00'),
        gross_weight_kg=Decimal('30000.00'),
        operator_user=loading_user,
    )
    TruckLoadingService.complete_loading(session, seal_number='SEAL-LIVE-999', operator_user=loading_user)
    gate_pass = TruckLoadingService.generate_gate_pass(session, operator_user=loading_user)

    # Dispatch creation triggers WhatsApp alert
    with patch.object(WhatsAppService, 'send_dispatch_alert') as mock_whatsapp:
        dispatch = DispatchService.create_dispatch(
            order=order,
            lr_number='LR-DISP-NOTIF-01',
            operator_user=loading_user,
            gate_pass=gate_pass,
        )
        mock_whatsapp.assert_called_once_with(order=order, dispatch=dispatch)

    order.refresh_from_db()
    assert order.status == Order.Status.DISPATCHED

    # Dealer views live status via API
    client.force_authenticate(user=dealer1_user)
    resp = client.get(f'/api/v1/live/orders/{order.id}/')
    assert resp.status_code == 200
    data = resp.json()
    assert data['status'] == Order.Status.DISPATCHED
    assert data['dispatch']['is_dispatched'] is True
    assert data['dispatch']['lr_number'] == 'LR-DISP-NOTIF-01'
    assert data['dispatch']['truck'] == truck.registration_number
    assert "Dispatched in Transit" in data['current_step']

    # Dealer workspace also reflects the dispatch
    ws_resp = client.get('/api/v1/dealer/workspace/')
    assert ws_resp.status_code == 200
    ws_data = ws_resp.json()
    assert any(d['order_id'] == order.id for d in ws_data['in_transit_dispatches'])


# ==============================================================================
# 4. Claim Created -> Admin / Distributor Sees Claim -> Authorized Review
# ==============================================================================
def test_claim_created_visibility_and_processing(setup_operational_pipeline):
    """
    Workflow Step 4:
    When Claim is created:
    - Admin / distributor sees claim
    - Authorized reviewer can process it
    """
    p = setup_operational_pipeline
    dealer1 = p['dealer1']
    dealer1_user = p['dealer1_user']
    accounts_user = p['accounts_user']
    admin_user = p['admin_user']
    dist_user = p['dist_user']
    loading_user = p['loading_user']
    product = p['product']
    truck = p['truck']
    driver = p['driver']
    bay = p['bay']

    client = APIClient()

    # Complete pipeline through Dispatch
    order = create_order(
        dealer=dealer1,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': product, 'bags': 400}],
        destination='Dewas Mandi Yard',
        created_by=dealer1_user,
    )
    submit_order(order, user=dealer1_user)
    payment = PaymentService.submit_payment(
        order=order,
        payment_mode=Payment.Mode.RTGS,
        utr_number=f"UTR-LIVE-{order.order_number}",
        bank_name='HDFC Bank',
        submitted_by=dealer1_user,
    )
    PaymentService.verify_payment(payment, user=accounts_user)
    order.refresh_from_db()
    session = TruckLoadingService.assign_truck_and_bay(
        order=order, truck=truck, bay=bay, driver=driver, operator_user=loading_user
    )
    TruckLoadingService.start_loading(session, operator_user=loading_user)
    TruckLoadingService.record_bag_count(session, 400, operator_user=loading_user)
    TruckLoadingService.record_weighbridge(
        session=session,
        tare_weight_kg=Decimal('10000.00'),
        gross_weight_kg=Decimal('30000.00'),
        operator_user=loading_user,
    )
    TruckLoadingService.complete_loading(session, seal_number='SEAL-LIVE-777', operator_user=loading_user)
    gate_pass = TruckLoadingService.generate_gate_pass(session, operator_user=loading_user)
    DispatchService.create_dispatch(
        order=order,
        lr_number='LR-LIVE-CLM-01',
        operator_user=loading_user,
        gate_pass=gate_pass,
    )

    # Dealer creates claim
    claim = ClaimService.file_claim(
        order=order,
        dealer=dealer1,
        claim_type='SHORTAGE',
        affected_bags=8,
        description='8 bags shortage upon unloading at Mandi.',
        created_by=dealer1_user,
    )

    # 1. Admin Command Center sees claim
    client.force_authenticate(user=admin_user)
    admin_resp = client.get('/api/v1/admin/command-center/')
    assert admin_resp.status_code == 200
    admin_data = admin_resp.json()
    assert admin_data['kpis']['active_claims_count'] >= 1
    assert any('CLAIM_CREATED' in ev['action'] for ev in admin_data['events'])

    # 2. Distributor Hub sees claim
    client.force_authenticate(user=dist_user)
    dist_resp = client.get('/api/v1/distributor/workspace/')
    assert dist_resp.status_code == 200
    dist_data = dist_resp.json()
    assert any(c['claim_number'] == claim.claim_number for c in dist_data['claims'])

    # 3. Accounts Desk sees claim in pending queue
    client.force_authenticate(user=accounts_user)
    acc_resp = client.get('/api/v1/accounts/workspace/')
    assert acc_resp.status_code == 200
    acc_data = acc_resp.json()
    assert any(c['claim_number'] == claim.claim_number for c in acc_data['pending_claims'])

    # 4. Authorized reviewer processes the claim (Approval with Credit Note)
    with patch.object(WhatsAppService, 'send_claim_update'):
        review_resp = client.post(
            f'/api/v1/claims/{claim.id}/review/',
            {'action': 'APPROVE', 'notes': 'Verified with weighbridge and transporter LR.'},
            format='json'
        )
        assert review_resp.status_code == 200
        assert review_resp.json()['status'] == 'APPROVED'
        assert review_resp.json()['credit_note_id'].startswith('CN-CLM-')


# ==============================================================================
# 5. Live Dashboard Polling & Ownership Security
# ==============================================================================
def test_live_dashboard_polling_and_ownership_security(setup_operational_pipeline):
    """
    Tests:
    - High-frequency live polling endpoint returns accurate state and ETag
    - Dealer 2 is strictly blocked from tracking Dealer 1's order (403 Forbidden)
    - Live events stream provides real-time operational activity log
    """
    p = setup_operational_pipeline
    dealer1 = p['dealer1']
    dealer1_user = p['dealer1_user']
    dealer2_user = p['dealer2_user']
    product = p['product']

    client = APIClient()

    order = create_order(
        dealer=dealer1,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': product, 'bags': 400}],
        destination='Dewas Mandi Yard',
        created_by=dealer1_user,
    )

    # 1. Dealer 1 tracks order successfully
    client.force_authenticate(user=dealer1_user)
    resp1 = client.get(f'/api/v1/live/orders/{order.id}/')
    assert resp1.status_code == 200
    assert resp1.json()['order_number'] == order.order_number

    # 2. Dealer 2 attempting to track Dealer 1's order is 403 Forbidden
    client.force_authenticate(user=dealer2_user)
    resp2 = client.get(f'/api/v1/live/orders/{order.id}/')
    assert resp2.status_code == 403
    assert "restricted to tracking their own orders" in resp2.json()['detail']

    # 3. Live Dashboard polling endpoint returns ETag
    client.force_authenticate(user=dealer1_user)
    dash_resp = client.get('/api/v1/live/dashboard/')
    assert dash_resp.status_code == 200
    assert 'ETag' in dash_resp.headers
    assert dash_resp.json()['workspace'] == 'dealer'

    # 4. Live Events Stream endpoint
    events_resp = client.get('/api/v1/live/events/')
    assert events_resp.status_code == 200
    assert 'events' in events_resp.json()
    assert 'kpis' in events_resp.json()
