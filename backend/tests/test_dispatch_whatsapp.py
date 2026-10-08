import os
import pytest
from decimal import Decimal
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, PermissionDenied

from apps.users.models import Role
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
)
from apps.dispatch.models import GatePass, Dispatch
from services.orders import create_order, submit_order
from services.payments import PaymentService
from services.loading import TruckLoadingService
from services.dispatch import DispatchService
from services.whatsapp import WhatsAppService, WhatsAppDeliveryError

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
def setup_dispatch_pipeline(db, rbac_roles):
    """
    Sets up a complete verified and gate-cleared order pipeline ready for dispatch.
    """
    # 1. Operators & Users
    loading_user = User.objects.create_user(
        username='operator_dispatch',
        phone='9826300001',
        role=rbac_roles['loading_operator'],
        status=User.Status.ACTIVE,
    )
    LoadingOperator.objects.create(
        user=loading_user,
        employee_id='LOP-002',
    )
    accounts_user = User.objects.create_user(
        username='accounts_dispatch',
        phone='9826300002',
        role=rbac_roles['accounts'],
        status=User.Status.ACTIVE,
    )
    dealer_user = User.objects.create_user(
        username='dealer_dewas',
        phone='9826300010',
        role=rbac_roles['dealer'],
        status=User.Status.ACTIVE,
    )
    dist_user = User.objects.create_user(
        username='dist_dewas',
        phone='9826300020',
        role=rbac_roles['distributor'],
        status=User.Status.ACTIVE,
    )
    distributor = Distributor.objects.create(
        user=dist_user,
        distributor_code='DIST-DEW-01',
        company_name='Dewas Agro Distributors',
        warehouse_address='Dewas Industrial Area',
        city='Dewas',
        district='Dewas',
        state='Madhya Pradesh',
    )
    dealer = Dealer.objects.create(
        user=dealer_user,
        dealership_name='Kisan Agro Center',
        mandi_yard='Dewas Mandi Yard',
        address='Main Market, Dewas',
        city='Dewas',
        district='Dewas',
        state='Madhya Pradesh',
        pincode='455001',
        assigned_distributor=distributor,
    )

    # 2. Logistics
    truck = Truck.objects.create(
        registration_number='MP-09-HH-9999',
        capacity_type=Truck.CapacityType.CAPACITY_20_MT,
        capacity_mt=Decimal('20.00'),
        max_bags=400,
    )
    driver = Driver.objects.create(
        name='Harpreet Singh',
        phone='9826399999',
        license_number='DL-MP-2022-9999',
    )
    bay = LoadingBay.objects.create(
        bay_number='BAY-02',
        name='Bulk Dispatch Bay 2',
    )

    # 3. Product & Order
    product = Product.objects.create(
        sku='BFEL-DP-50KG',
        name='BFEL Dairy Plus (22% Protein)',
        category='Cattle Feed',
        bag_weight_kg=50,
        protein_percent=Decimal('22.00'),
        fat_percent=Decimal('4.50'),
    )
    ProductPrice.objects.create(product=product, price_per_bag=Decimal('1850.00'), is_active=True)

    order = create_order(
        dealer=dealer,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': product, 'bags': 400}],
        destination='Dewas Mandi',
        created_by=dealer_user,
    )
    submit_order(order, user=dealer_user)

    # 4. Advance Remittance & Verification
    payment = PaymentService.submit_payment(
        order=order,
        payment_mode=Payment.Mode.RTGS,
        utr_number=f"UTR-{order.order_number}",
        bank_name='SBI Plant Account',
        submitted_by=dealer_user,
    )
    PaymentService.verify_payment(payment, user=accounts_user)
    order.refresh_from_db()

    # 5. Truck Loading & Gate Pass Clearance
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
    TruckLoadingService.complete_loading(session, seal_number='SEAL-DISP-001', operator_user=loading_user)
    gate_pass = TruckLoadingService.generate_gate_pass(session, operator_user=loading_user)
    order.refresh_from_db()
    assert order.status == Order.Status.GATE_CLEARED

    return {
        'loading_user': loading_user,
        'accounts_user': accounts_user,
        'dealer_user': dealer_user,
        'order': order,
        'gate_pass': gate_pass,
        'truck': truck,
        'driver': driver,
    }


# ==============================================================================
# 1. Dispatch Creation (Service & API)
# ==============================================================================
def test_dispatch_creation_service(setup_dispatch_pipeline):
    """
    Creates road dispatch for gate-cleared order.
    Transitions order to DISPATCHED and verifies dispatch fields.
    """
    d = setup_dispatch_pipeline
    order = d['order']
    gate_pass = d['gate_pass']

    dispatch = DispatchService.create_dispatch(
        order=order,
        lr_number='LR-DEWAS-8899',
        operator_user=d['loading_user'],
        gate_pass=gate_pass,
    )

    assert dispatch.pk is not None
    assert dispatch.lr_number == 'LR-DEWAS-8899'
    assert dispatch.status == Dispatch.Status.IN_TRANSIT
    assert dispatch.truck == d['truck']
    assert dispatch.driver == d['driver']
    assert dispatch.destination == 'Dewas Mandi'
    assert dispatch.gate_pass == gate_pass

    order.refresh_from_db()
    assert order.status == Order.Status.DISPATCHED


def test_dispatch_creation_api(api_client, setup_dispatch_pipeline):
    """POST /api/v1/dispatch/ creates road manifest and triggers notifications."""
    d = setup_dispatch_pipeline
    order = d['order']
    api_client.force_authenticate(user=d['loading_user'])

    payload = {
        'order_id': order.id,
        'lr_number': 'LR-API-1001',
    }
    res = api_client.post('/api/v1/dispatch/', payload, format='json')
    assert res.status_code == 201
    data = res.json()
    assert data['lr_number'] == 'LR-API-1001'
    assert data['status'] == 'IN_TRANSIT'
    assert data['truck_number'] == 'MP-09-HH-9999'
    assert data['driver_name'] == 'Harpreet Singh'
    assert data['destination'] == 'Dewas Mandi'

    order.refresh_from_db()
    assert order.status == Order.Status.DISPATCHED


# ==============================================================================
# 2. Gate-Pass Requirement
# ==============================================================================
def test_dispatch_requires_gate_pass(api_client, setup_dispatch_pipeline):
    """
    Attempting to dispatch an order that has NOT received gate pass clearance is blocked.
    """
    d = setup_dispatch_pipeline
    # Create another order that is not gate-cleared
    order2 = create_order(
        dealer=d['order'].dealer,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': d['order'].items.first().product, 'bags': 400}],
        destination='Dewas Mandi',
        created_by=d['dealer_user'],
    )
    submit_order(order2, user=d['dealer_user'])

    api_client.force_authenticate(user=d['loading_user'])
    payload = {
        'order_id': order2.id,
        'lr_number': 'LR-FAIL-001',
    }
    res = api_client.post('/api/v1/dispatch/', payload, format='json')
    assert res.status_code == 400
    assert "no issued Gate Pass clearance" in res.json().get('detail', '')


# ==============================================================================
# 3. Duplicate Dispatch Prevention
# ==============================================================================
def test_duplicate_dispatch_prevention(setup_dispatch_pipeline):
    """
    Cannot dispatch the same order twice, and cannot reuse an existing LR number.
    """
    d = setup_dispatch_pipeline
    order = d['order']

    # 1st dispatch succeeds
    DispatchService.create_dispatch(
        order=order,
        lr_number='LR-UNIQUE-001',
        operator_user=d['loading_user'],
    )

    # Duplicate order dispatch fails
    with pytest.raises(ValidationError) as exc:
        DispatchService.create_dispatch(
            order=order,
            lr_number='LR-UNIQUE-002',
            operator_user=d['loading_user'],
        )
    assert "already been dispatched" in str(exc.value)

    # Duplicate LR number fails
    order.refresh_from_db()
    with pytest.raises(ValidationError) as exc2:
        DispatchService.create_dispatch(
            order=order,
            lr_number='LR-UNIQUE-001',
            operator_user=d['loading_user'],
        )
    assert "Duplicate dispatch blocked" in str(exc2.value)


# ==============================================================================
# 4. WhatsApp Notification Service Invocation & Message Format
# ==============================================================================
def test_whatsapp_dispatch_alert_format(setup_dispatch_pipeline):
    """
    Verifies WhatsAppService formats alert with only operationally necessary details.
    Ensures sensitive financial information is never leaked in logistics updates.
    """
    d = setup_dispatch_pipeline
    order = d['order']

    with patch.object(WhatsAppService, 'send_dispatch_alert', wraps=WhatsAppService.send_dispatch_alert) as mock_alert:
        dispatch = DispatchService.create_dispatch(
            order=order,
            lr_number='LR-NOTIF-7788',
            operator_user=d['loading_user'],
        )

        assert mock_alert.called is True
        call_kwargs = mock_alert.call_args.kwargs
        assert call_kwargs['order'] == order
        assert call_kwargs['dispatch'] == dispatch

        # Verify alert content
        alert_result = WhatsAppService.send_dispatch_alert(order=order, dispatch=dispatch)
        content = alert_result['content']

        # Required fields present
        assert "BFEL Dispatch Update" in content
        assert f"Order: {order.order_number}" in content
        assert "Truck: MP-09-HH-9999" in content
        assert "Destination: Dewas Mandi" in content
        assert "Load: 20 MT" in content
        assert "LR: LR-NOTIF-7788" in content
        assert "Status: Dispatched" in content

        # Sensitive financial fields absent
        assert "₹" not in content
        assert "Price" not in content
        assert "Total" not in content
        assert "Advance" not in content
        assert "Bank" not in content


# ==============================================================================
# 5. Failed Notification Handling (Graceful Degradation)
# ==============================================================================
def test_failed_notification_does_not_abort_dispatch(setup_dispatch_pipeline):
    """
    If the external WhatsApp API fails/times out, the physical dispatch must still succeed.
    """
    d = setup_dispatch_pipeline
    order = d['order']

    with patch.object(WhatsAppService, 'send_dispatch_alert', side_effect=WhatsAppDeliveryError("Network timeout")):
        dispatch = DispatchService.create_dispatch(
            order=order,
            lr_number='LR-RESILIENT-5544',
            operator_user=d['loading_user'],
        )

        # Dispatch is successfully recorded despite notification failure
        assert dispatch.pk is not None
        assert dispatch.status == Dispatch.Status.IN_TRANSIT
        order.refresh_from_db()
        assert order.status == Order.Status.DISPATCHED
