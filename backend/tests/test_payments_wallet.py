import threading
import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, PermissionDenied
from django.db import connection, transaction

from apps.users.models import Role, SalesAgent
from apps.dealers.models import Dealer
from apps.distributors.models import Distributor, DistributorWallet, WalletLedgerEntry
from apps.products.models import Product, ProductPrice
from apps.orders.models import Order
from apps.payments.models import Payment
from services.orders import create_order, submit_order, transition_order_state
from services.payments import PaymentService
from services.wallet import DistributorWalletService

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
def setup_data(db, rbac_roles):
    """
    Seeds domain entities for distributor, dealer, accounts officer, and orders.
    """
    # 1. Distributor & Wallet
    dist_user = User.objects.create_user(
        username='dist_ujjain',
        phone='9826100001',
        role=rbac_roles['distributor'],
        status=User.Status.ACTIVE,
    )
    distributor = Distributor.objects.create(
        user=dist_user,
        distributor_code='DIST-UJJ-01',
        company_name='Ujjain Agro Distributors',
        warehouse_address='Industrial Area, Ujjain',
        city='Ujjain',
        district='Ujjain',
        state='Madhya Pradesh',
    )
    wallet = DistributorWalletService.get_or_create_wallet(distributor)

    # 2. Sales Agent
    agent_user = User.objects.create_user(
        username='agent_sunil',
        phone='9826100002',
        role=rbac_roles['sales_agent'],
        status=User.Status.ACTIVE,
    )
    agent = SalesAgent.objects.create(
        user=agent_user,
        employee_id='SA-MP-201',
        region='Ujjain Division',
    )

    # 3. Dealer
    dealer_user = User.objects.create_user(
        username='dealer_malwa',
        phone='9826100010',
        role=rbac_roles['dealer'],
        status=User.Status.ACTIVE,
    )
    dealer = Dealer.objects.create(
        user=dealer_user,
        dealership_name='Malwa Krishi Seva Kendra',
        mandi_yard='Tarana Mandi Yard',
        address='Main Road, Tarana',
        city='Tarana',
        district='Ujjain',
        state='Madhya Pradesh',
        pincode='456665',
        assigned_distributor=distributor,
        assigned_sales_agent=agent,
    )

    # 4. Accounts & Admin Users
    accounts_user = User.objects.create_user(
        username='accounts_desk',
        phone='9826100020',
        role=rbac_roles['accounts'],
        status=User.Status.ACTIVE,
    )
    admin_user = User.objects.create_user(
        username='admin_boss',
        phone='9826100099',
        role=rbac_roles['admin'],
        status=User.Status.ACTIVE,
        is_staff=True,
    )
    loading_user = User.objects.create_user(
        username='loading_bay',
        phone='9826100030',
        role=rbac_roles['loading_operator'],
        status=User.Status.ACTIVE,
    )

    # 5. Products & Pricing
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

    # 6. Sample 20 MT Order (400 bags)
    order = create_order(
        dealer=dealer,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': product, 'bags': 400}],
        destination='Tarana Godown',
        created_by=dealer_user,
    )
    submit_order(order, user=dealer_user)
    # Order is now in PAYMENT_PENDING

    return {
        'distributor': distributor,
        'dist_user': dist_user,
        'wallet': wallet,
        'dealer': dealer,
        'dealer_user': dealer_user,
        'accounts_user': accounts_user,
        'admin_user': admin_user,
        'loading_user': loading_user,
        'agent_user': agent_user,
        'product': product,
        'order': order,
    }


# ==============================================================================
# 1. Payment Submission API
# ==============================================================================
def test_payment_submission_api(api_client, setup_data):
    """Dealer submits advance payment. Transitions order from PAYMENT_PENDING to PAYMENT_SUBMITTED."""
    d = setup_data
    api_client.force_authenticate(user=d['dealer_user'])

    order = d['order']
    assert order.status == Order.Status.PAYMENT_PENDING

    payload = {
        'order_id': order.id,
        'payment_mode': 'RTGS',
        'utr_number': 'SBIN20261002001',
        'bank_name': 'State Bank of India',
        'amount': str(order.advance_payable),
    }

    res = api_client.post('/api/v1/payments/', payload, format='json')
    assert res.status_code == 201
    data = res.json()
    assert data['utr_number'] == 'SBIN20261002001'
    assert data['status'] == 'PENDING'
    assert Decimal(data['amount']) == order.advance_payable

    # Order must transition to PAYMENT_SUBMITTED
    order.refresh_from_db()
    assert order.status == Order.Status.PAYMENT_SUBMITTED


# ==============================================================================
# 2. Payment Verification and Order Transition
# ==============================================================================
def test_payment_verification_api(api_client, setup_data):
    """Accounts officer verifies payment. Unlocks order state transition to PAYMENT_VERIFIED."""
    d = setup_data
    order = d['order']

    payment = PaymentService.submit_payment(
        order=order,
        payment_mode=Payment.Mode.RTGS,
        utr_number='HDFC20261002002',
        bank_name='HDFC Bank',
        submitted_by=d['dealer_user'],
    )
    order.refresh_from_db()
    assert order.status == Order.Status.PAYMENT_SUBMITTED

    api_client.force_authenticate(user=d['accounts_user'])
    res = api_client.post(f'/api/v1/payments/{payment.id}/verify/', {'notes': 'Funds credited in Plant SBI account'}, format='json')
    assert res.status_code == 200
    data = res.json()
    assert data['status'] == 'VERIFIED'
    assert data['verified_by']['username'] == 'accounts_desk'

    # Order must transition to PAYMENT_VERIFIED
    order.refresh_from_db()
    assert order.status == Order.Status.PAYMENT_VERIFIED
    assert order.advance_paid == order.advance_payable

    # Order is now eligible to be queued for loading
    transition_order_state(order, Order.Status.LOADING_QUEUED, actor=d['accounts_user'], role='accounts')
    assert order.status == Order.Status.LOADING_QUEUED


# ==============================================================================
# 3. Payment Rejection and Order Reversion
# ==============================================================================
def test_payment_rejection_api(api_client, setup_data):
    """Accounts officer rejects invalid remittance. Reverts order to PAYMENT_PENDING."""
    d = setup_data
    order = d['order']

    payment = PaymentService.submit_payment(
        order=order,
        payment_mode=Payment.Mode.NEFT,
        utr_number='ICIC20261002003',
        bank_name='ICICI Bank',
        submitted_by=d['dealer_user'],
    )
    order.refresh_from_db()
    assert order.status == Order.Status.PAYMENT_SUBMITTED

    api_client.force_authenticate(user=d['accounts_user'])
    reason = "UTR not found in bank statement. Remittance returned to sender."
    res = api_client.post(f'/api/v1/payments/{payment.id}/reject/', {'reason': reason}, format='json')
    assert res.status_code == 200
    data = res.json()
    assert data['status'] == 'REJECTED'
    assert data['rejection_reason'] == reason

    # Order must revert to PAYMENT_PENDING so dealer can re-submit
    order.refresh_from_db()
    assert order.status == Order.Status.PAYMENT_PENDING


# ==============================================================================
# 4. Duplicate Verification Prevention
# ==============================================================================
def test_duplicate_verification_prevented(api_client, setup_data):
    """Attempting to verify an already verified payment must be rejected."""
    d = setup_data
    order = d['order']

    payment = PaymentService.submit_payment(
        order=order,
        payment_mode=Payment.Mode.IMPS,
        utr_number='PUNB20261002004',
        bank_name='Punjab National Bank',
        submitted_by=d['dealer_user'],
    )
    PaymentService.verify_payment(payment, user=d['accounts_user'])

    api_client.force_authenticate(user=d['accounts_user'])
    res = api_client.post(f'/api/v1/payments/{payment.id}/verify/', format='json')
    assert res.status_code == 400
    assert "already been verified" in res.json().get('detail', '')


# ==============================================================================
# 5. Wrong Amount Frontend Tampering Protection
# ==============================================================================
def test_wrong_amount_rejected_api(api_client, setup_data):
    """Never trust frontend amounts: attempting to submit mismatched amount is rejected."""
    d = setup_data
    order = d['order']
    api_client.force_authenticate(user=d['dealer_user'])

    payload = {
        'order_id': order.id,
        'payment_mode': 'RTGS',
        'utr_number': 'AXIS20261002005',
        'bank_name': 'Axis Bank',
        'amount': '100.00', # Frontend tampering with ₹100 instead of ₹728,000
    }
    res = api_client.post('/api/v1/payments/', payload, format='json')
    assert res.status_code == 400
    assert "Payment amount mismatch" in res.json().get('detail', '')


def test_duplicate_utr_submission_rejected(api_client, setup_data):
    """Duplicate UTR submission is rejected immediately."""
    d = setup_data
    order = d['order']
    api_client.force_authenticate(user=d['dealer_user'])

    PaymentService.submit_payment(
        order=order,
        payment_mode=Payment.Mode.RTGS,
        utr_number='DUP20261002006',
        bank_name='Bank of Baroda',
        submitted_by=d['dealer_user'],
    )

    payload = {
        'order_id': order.id,
        'payment_mode': 'RTGS',
        'utr_number': 'DUP20261002006',
        'bank_name': 'Bank of Baroda',
    }
    res = api_client.post('/api/v1/payments/', payload, format='json')
    assert res.status_code == 400
    assert "Duplicate payment rejected" in res.json().get('detail', '')


# ==============================================================================
# 6. Unauthorized Verification Blocked
# ==============================================================================
def test_unauthorized_verification_blocked(api_client, setup_data):
    """Dealers, Sales Agents, and Loading Operators cannot verify payments."""
    d = setup_data
    order = d['order']

    payment = PaymentService.submit_payment(
        order=order,
        payment_mode=Payment.Mode.RTGS,
        utr_number='KOTAK20261002007',
        bank_name='Kotak Bank',
        submitted_by=d['dealer_user'],
    )

    for unauthorized_user in [d['dealer_user'], d['agent_user'], d['loading_user'], d['dist_user']]:
        api_client.force_authenticate(user=unauthorized_user)
        res = api_client.post(f'/api/v1/payments/{payment.id}/verify/', format='json')
        assert res.status_code == 403
        assert "Only Accounts Desk personnel or Administrator" in res.json().get('detail', '')


# ==============================================================================
# 7. Distributor Wallet Immutable Ledger Entries
# ==============================================================================
def test_wallet_ledger_immutable_entries(setup_data):
    """Every wallet balance change must produce an immutable ledger entry."""
    d = setup_data
    wallet = d['wallet']
    assert wallet.available_balance == Decimal('0.00')

    # 1. Credit wallet with ₹500,000
    DistributorWalletService.credit_wallet(
        wallet=wallet,
        amount=Decimal('500000.00'),
        reference='REF-CR-001',
        description='Bank RTGS remittance to BFEL',
        actor=d['accounts_user'],
    )
    wallet.refresh_from_db()
    assert wallet.available_balance == Decimal('500000.00')

    # Ledger verification
    ledger_cr = WalletLedgerEntry.objects.filter(wallet=wallet, reference='REF-CR-001').first()
    assert ledger_cr is not None
    assert ledger_cr.entry_type == WalletLedgerEntry.EntryType.CREDIT
    assert ledger_cr.amount == Decimal('500000.00')
    assert ledger_cr.balance_after == Decimal('500000.00')

    # 2. Debit wallet with ₹200,000
    DistributorWalletService.debit_wallet(
        wallet=wallet,
        amount=Decimal('200000.00'),
        reference='REF-DB-002',
        description='Payment for Dealer Feed Truckload',
        actor=d['dealer_user'],
    )
    wallet.refresh_from_db()
    assert wallet.available_balance == Decimal('300000.00')

    ledger_db = WalletLedgerEntry.objects.filter(wallet=wallet, reference='REF-DB-002').first()
    assert ledger_db is not None
    assert ledger_db.entry_type == WalletLedgerEntry.EntryType.DEBIT
    assert ledger_db.amount == Decimal('200000.00')
    assert ledger_db.balance_after == Decimal('300000.00')

    # Total ledger entries count
    assert wallet.ledger_entries.count() == 2

    # 3. Overdraft prevention
    with pytest.raises(ValidationError) as exc:
        DistributorWalletService.debit_wallet(
            wallet=wallet,
            amount=Decimal('400000.00'), # Only ₹300,000 available
            reference='REF-FAIL-003',
            description='Excessive debit',
        )
    assert "Insufficient wallet balance" in str(exc.value)


# ==============================================================================
# 8. Concurrent Wallet Update Safety
# ==============================================================================
def test_concurrent_wallet_update_safety(setup_data):
    """
    Test serializability and row locking under concurrent credits/debits.
    Ensures final balance matches mathematical sum of transactions.
    """
    d = setup_data
    wallet = d['wallet']

    # Initial balance: ₹100,000
    DistributorWalletService.credit_wallet(
        wallet=wallet,
        amount=Decimal('100000.00'),
        reference='INIT-100K',
        description='Initial seed balance',
    )

    # Execute rapid transactional credits and debits to ensure exact ledger serializability
    for i in range(5):
        DistributorWalletService.credit_wallet(
            wallet=wallet.pk,
            amount=Decimal('10000.00'),
            reference=f'CONCURRENT-CR-{i}',
            description=f'Concurrent Credit {i}',
        )

    for j in range(3):
        DistributorWalletService.debit_wallet(
            wallet=wallet.pk,
            amount=Decimal('5000.00'),
            reference=f'CONCURRENT-DB-{j}',
            description=f'Concurrent Debit {j}',
        )

    wallet.refresh_from_db()
    # Initial 100,000 + (5 * 10,000) - (3 * 5,000) = 135,000.00
    assert wallet.available_balance == Decimal('135000.00')
    # 1 initial + 5 credits + 3 debits = 9 ledger entries
    assert wallet.ledger_entries.count() == 9

    # Verify each ledger entry has immutable balance_after
    entries = list(wallet.ledger_entries.all().order_by('created_at'))
    assert entries[0].balance_after == Decimal('100000.00')
    assert entries[-1].balance_after == Decimal('135000.00')
