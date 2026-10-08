import io
import pytest
from decimal import Decimal
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, PermissionDenied
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.users.models import Role
from apps.dealers.models import Dealer
from apps.distributors.models import Distributor, DistributorWallet, WalletLedgerEntry
from apps.products.models import Product, ProductPrice
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.loading.models import Truck, Driver, LoadingBay, LoadingOperator
from apps.dispatch.models import GatePass, Dispatch
from apps.claims.models import Claim, ClaimEvidence
from apps.accounts.models import AuditEvent
from services.orders import create_order, submit_order
from services.payments import PaymentService
from services.loading import TruckLoadingService
from services.dispatch import DispatchService
from services.claims import ClaimService
from services.wallet import DistributorWalletService
from services.whatsapp import WhatsAppService

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
def setup_claims_environment(db, rbac_roles):
    """
    Sets up users, dealers, distributor, product, and a fully dispatched order
    ready for post-delivery shortage / quality discrepancy claims.
    """
    # 1. Actors
    admin_user = User.objects.create_user(
        username='admin_claims',
        phone='9826400001',
        role=rbac_roles['admin'],
        status=User.Status.ACTIVE,
    )
    accounts_user = User.objects.create_user(
        username='accounts_claims',
        phone='9826400002',
        role=rbac_roles['accounts'],
        status=User.Status.ACTIVE,
    )
    loading_user = User.objects.create_user(
        username='operator_claims',
        phone='9826400003',
        role=rbac_roles['loading_operator'],
        status=User.Status.ACTIVE,
    )
    LoadingOperator.objects.create(user=loading_user, employee_id='LOP-CLM-01')

    # Dealer 1
    dealer1_user = User.objects.create_user(
        username='dealer_claims_1',
        phone='9826400010',
        role=rbac_roles['dealer'],
        status=User.Status.ACTIVE,
    )
    dealer1 = Dealer.objects.create(
        user=dealer1_user,
        dealership_name='Dewas Kisan Feed Center',
        mandi_yard='Dewas Mandi Yard',
        address='Station Road',
        city='Dewas',
        district='Dewas',
        state='Madhya Pradesh',
        pincode='455001',
    )

    # Dealer 2 (for ownership isolation testing)
    dealer2_user = User.objects.create_user(
        username='dealer_claims_2',
        phone='9826400011',
        role=rbac_roles['dealer'],
        status=User.Status.ACTIVE,
    )
    dealer2 = Dealer.objects.create(
        user=dealer2_user,
        dealership_name='Ujjain Pashu Ahar',
        mandi_yard='Ujjain Krishi Upaj Mandi',
        address='Agar Road',
        city='Ujjain',
        district='Ujjain',
        state='Madhya Pradesh',
        pincode='456001',
    )

    # Distributor & Wallet
    dist_user = User.objects.create_user(
        username='dist_claims',
        phone='9826400020',
        role=rbac_roles['distributor'],
        status=User.Status.ACTIVE,
    )
    distributor = Distributor.objects.create(
        user=dist_user,
        company_name='Malwa Feeds Hub Pvt Ltd',
        distributor_code='DIST-MALWA-01',
        gstin='23AAACM1122L1Z4',
        warehouse_address='Industrial Area, Dewas',
        city='Dewas',
        district='Dewas',
    )
    wallet = DistributorWalletService.get_or_create_wallet(distributor)

    # Product
    product = Product.objects.create(
        sku='BFEL-DP-50KG',
        name='BFEL Dairy Plus (22% Protein)',
        category='Cattle Feed',
        bag_weight_kg=50,
        protein_percent=Decimal('22.00'),
        fat_percent=Decimal('4.50'),
    )
    ProductPrice.objects.create(product=product, price_per_bag=Decimal('1420.00'), is_active=True)

    # Fleet & Bay
    truck = Truck.objects.create(
        registration_number='MP-09-HH-9999',
        capacity_type=Truck.CapacityType.CAPACITY_20_MT,
        capacity_mt=Decimal('20.00'),
        max_bags=400,
    )
    driver = Driver.objects.create(
        name='Vikram Yadav',
        phone='9826400030',
        license_number='MP0920210044556',
    )
    bay = LoadingBay.objects.create(
        bay_number='BAY-C1',
        name='Main North Bay C1',
        is_active=True,
    )

    # Pipeline: Order -> Payment -> Loading -> Gate Pass -> Dispatch
    order = create_order(
        dealer=dealer1,
        truck_capacity=Order.TruckCapacity.CAPACITY_20_MT,
        items=[{'product': product, 'bags': 400}],
        destination='Dewas Mandi Yard',
        created_by=dealer1_user,
    )
    order.distributor = distributor
    order.save()
    submit_order(order, user=dealer1_user)

    payment = PaymentService.submit_payment(
        order=order,
        payment_mode=Payment.Mode.RTGS,
        utr_number=f"UTR-CLAIM-{order.order_number}",
        bank_name='HDFC Bank',
        submitted_by=dealer1_user,
    )
    PaymentService.verify_payment(
        payment=payment,
        user=accounts_user,
    )
    order.refresh_from_db()

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
    TruckLoadingService.complete_loading(session, seal_number='SEAL-CLAIM-01', operator_user=loading_user)
    gate_pass = TruckLoadingService.generate_gate_pass(session, operator_user=loading_user)
    order.refresh_from_db()

    dispatch = DispatchService.create_dispatch(
        order=order,
        lr_number='LR-CLAIM-SETUP-901',
        operator_user=loading_user,
        gate_pass=gate_pass,
    )

    return {
        'admin_user': admin_user,
        'accounts_user': accounts_user,
        'dealer1_user': dealer1_user,
        'dealer1': dealer1,
        'dealer2_user': dealer2_user,
        'dealer2': dealer2,
        'distributor': distributor,
        'wallet': wallet,
        'order': order,
        'dispatch': dispatch,
        'product': product,
    }


# ==============================================================================
# 1. Claim Creation Test
# ==============================================================================
def test_claim_creation(setup_claims_environment):
    """
    Verify successful filing of shortage and quality claims by dealer against dispatched order.
    Authoritative checks:
    - Bags affected <= order.total_bags
    - Shortage weight in kg is correctly calculated (50 kg/bag)
    - Initial status is CREATED
    - Audit event logged
    """
    env = setup_claims_environment
    order = env['order']
    dealer = env['dealer1']
    dealer_user = env['dealer1_user']

    claim = ClaimService.file_claim(
        order=order,
        dealer=dealer,
        claim_type='SHORTAGE',
        affected_bags=10,
        description='Discrepancy at delivery: 10 bags missing upon truck unloading at Dewas Mandi.',
        created_by=dealer_user,
    )

    assert claim.pk is not None
    assert claim.claim_number.startswith('CLM-')
    assert claim.order == order
    assert claim.dealer == dealer
    assert claim.claim_type == Claim.ClaimType.SHORTAGE
    assert claim.affected_bags == 10
    assert claim.shortage_bags == 10
    assert claim.shortage_weight_kg == Decimal('500.00')  # 10 bags * 50 kg
    assert claim.expected_bags == 400
    assert claim.received_bags == 390
    assert claim.status == Claim.Status.CREATED
    assert claim.created_by == dealer_user

    # Verify audit trail
    audit = AuditEvent.objects.filter(entity='Claim', entity_id=claim.claim_number, action='CLAIM_CREATED').first()
    assert audit is not None
    assert audit.role == 'dealer'
    assert audit.metadata['affected_bags'] == 10


# ==============================================================================
# 2. Ownership & Security Test
# ==============================================================================
def test_claim_ownership(setup_claims_environment):
    """
    Security requirement:
    - Dealer can only access and file their own claims.
    - Dealer 2 cannot file claims on Dealer 1's order.
    - Dealer 2 cannot access Dealer 1's claim.
    - Admin and Accounts have global visibility.
    """
    env = setup_claims_environment
    order = env['order']
    dealer1 = env['dealer1']
    dealer1_user = env['dealer1_user']
    dealer2 = env['dealer2']
    dealer2_user = env['dealer2_user']
    accounts_user = env['accounts_user']
    admin_user = env['admin_user']

    # Dealer 2 tries to file a claim for Dealer 1's order
    with pytest.raises(ValidationError, match="does not belong to the specified dealer"):
        ClaimService.file_claim(
            order=order,
            dealer=dealer2,
            claim_type='SHORTAGE',
            affected_bags=5,
            description='Unauthorized claim attempt',
            created_by=dealer2_user,
        )

    # Valid claim filed by Dealer 1
    claim = ClaimService.file_claim(
        order=order,
        dealer=dealer1,
        claim_type='QUALITY/DAMAGE',
        affected_bags=8,
        description='Moisture and torn bags reported.',
        created_by=dealer1_user,
    )

    # Dealer 1 can access their own claim
    assert ClaimService.verify_dealer_access(claim, dealer1_user) is True

    # Dealer 2 is strictly blocked from accessing Dealer 1's claim
    with pytest.raises(PermissionDenied, match="restricted to accessing their own claims"):
        ClaimService.verify_dealer_access(claim, dealer2_user)

    # Accounts & Admin have authorized access
    assert ClaimService.verify_dealer_access(claim, accounts_user) is True
    assert ClaimService.verify_dealer_access(claim, admin_user) is True


# ==============================================================================
# 3. Evidence Validation Test
# ==============================================================================
def test_evidence_validation(setup_claims_environment):
    """
    Validates photo evidence upload:
    - Files are stored in configurable storage, NOT as raw binaries in PostgreSQL.
    - Stores file reference, content type, size, upload timestamp.
    """
    env = setup_claims_environment
    order = env['order']
    dealer = env['dealer1']
    dealer_user = env['dealer1_user']

    jpeg_file = SimpleUploadedFile(
        name="torn_bags_photo.jpg",
        content=b"\xff\xd8\xff\xe0" + b"Simulated JPEG image bytes" * 50,
        content_type="image/jpeg",
    )
    png_file = SimpleUploadedFile(
        name="unloading_challan.png",
        content=b"\x89PNG\r\n\x1a\n" + b"Simulated PNG image bytes" * 30,
        content_type="image/png",
    )

    claim = ClaimService.file_claim(
        order=order,
        dealer=dealer,
        claim_type='QUALITY/DAMAGE',
        affected_bags=4,
        description='Physical tears on 4 bags upon unloading.',
        created_by=dealer_user,
        evidence_files=[jpeg_file, png_file],
    )

    evidences = claim.evidence_files.all()
    assert evidences.count() == 2

    first_evidence = evidences.first()
    assert first_evidence.content_type == 'image/jpeg'
    assert first_evidence.size_bytes > 0
    assert first_evidence.file_reference == 'torn_bags_photo.jpg'
    assert first_evidence.uploaded_at is not None
    # Ensure binary is not in database columns
    assert not hasattr(first_evidence, 'binary_data')


# ==============================================================================
# 4. Invalid Files Test
# ==============================================================================
def test_invalid_files(setup_claims_environment):
    """
    Ensures invalid files are rejected:
    - Non-image files (e.g. .pdf, .exe, .txt)
    - Empty files (0 bytes)
    - Files exceeding the 5MB size limit
    """
    env = setup_claims_environment
    order = env['order']
    dealer = env['dealer1']
    dealer_user = env['dealer1_user']

    # 1. Non-image extension / mime type
    pdf_file = SimpleUploadedFile(
        name="document.pdf",
        content=b"%PDF-1.4 Simulated pdf content",
        content_type="application/pdf",
    )
    with pytest.raises(ValidationError, match="Only JPEG, PNG, and WebP images are permitted"):
        ClaimService.file_claim(
            order=order,
            dealer=dealer,
            claim_type='SHORTAGE',
            affected_bags=2,
            description='Test invalid file',
            created_by=dealer_user,
            evidence_files=[pdf_file],
        )

    # 2. Empty file
    empty_file = SimpleUploadedFile(
        name="empty.jpg",
        content=b"",
        content_type="image/jpeg",
    )
    with pytest.raises(ValidationError, match="is empty"):
        ClaimService.file_claim(
            order=order,
            dealer=dealer,
            claim_type='SHORTAGE',
            affected_bags=2,
            description='Test empty file',
            created_by=dealer_user,
            evidence_files=[empty_file],
        )

    # 3. Oversized file (> 5 MB)
    oversized_bytes = b"0" * (5 * 1024 * 1024 + 1024)
    oversized_file = SimpleUploadedFile(
        name="huge_picture.jpg",
        content=oversized_bytes,
        content_type="image/jpeg",
    )
    with pytest.raises(ValidationError, match="exceeds maximum allowed limit of 5.00 MB"):
        ClaimService.file_claim(
            order=order,
            dealer=dealer,
            claim_type='SHORTAGE',
            affected_bags=2,
            description='Test oversized file',
            created_by=dealer_user,
            evidence_files=[oversized_file],
        )


# ==============================================================================
# 5. Duplicate Claims Test
# ==============================================================================
def test_duplicate_claims(setup_claims_environment):
    """
    Prevents filing duplicate active claims on the same order.
    """
    env = setup_claims_environment
    order = env['order']
    dealer = env['dealer1']
    dealer_user = env['dealer1_user']

    # First claim succeeds
    ClaimService.file_claim(
        order=order,
        dealer=dealer,
        claim_type='SHORTAGE',
        affected_bags=6,
        description='Initial shortage claim.',
        created_by=dealer_user,
    )

    # Duplicate claim on same order while active must be rejected
    with pytest.raises(ValidationError, match="Duplicate claim rejected: An active claim"):
        ClaimService.file_claim(
            order=order,
            dealer=dealer,
            claim_type='SHORTAGE',
            affected_bags=4,
            description='Second duplicate claim attempt.',
            created_by=dealer_user,
        )


# ==============================================================================
# 6. Approval & Credit Note Test
# ==============================================================================
def test_approval_and_credit_note(setup_claims_environment):
    """
    Authoritative test for claim review, approval, and Credit Note generation:
    - Admin/Accounts can mark Under Review.
    - Approval transitions status to APPROVED.
    - Generates unique Credit Note reference (CN-CLM-...).
    - Calculates refund amount (pro-rata: 400 bags = ₹568,000, 10 bags = ₹14,200).
    - Credits distributor wallet with immutable ledger entry.
    - Sends operational WhatsApp alert.
    """
    env = setup_claims_environment
    order = env['order']
    dealer = env['dealer1']
    dealer_user = env['dealer1_user']
    accounts_user = env['accounts_user']
    wallet = env['wallet']

    claim = ClaimService.file_claim(
        order=order,
        dealer=dealer,
        claim_type='SHORTAGE',
        affected_bags=10,
        description='10 bags missing at destination Mandi.',
        created_by=dealer_user,
    )

    # 1. Transition to Under Review
    ClaimService.mark_under_review(claim, reviewer=accounts_user, review_notes='Verification with transporter in progress.')
    claim.refresh_from_db()
    assert claim.status == Claim.Status.UNDER_REVIEW
    assert claim.reviewed_by == accounts_user

    # 2. Approve Claim
    initial_wallet_balance = wallet.available_balance
    # Pro-rata net refund calculation: (net_total / total_bags) * affected_bags = 10 * 1390.00 = 13,900.00
    expected_credit_amount = (order.net_total / Decimal(order.total_bags) * Decimal(claim.affected_bags)).quantize(Decimal('0.01'))

    with patch.object(WhatsAppService, 'send_claim_update') as mock_whatsapp:
        approved_claim = ClaimService.approve_claim(
            claim=claim,
            reviewer=accounts_user,
            review_notes='Physical shortage confirmed with transporter LR shortage endorsement.',
        )

        assert approved_claim.status == Claim.Status.APPROVED
        assert approved_claim.credit_note_id.startswith('CN-CLM-')
        assert approved_claim.credit_note_amount == expected_credit_amount
        assert approved_claim.reviewed_by == accounts_user
        assert approved_claim.reviewed_at is not None

        # Verify WhatsApp notification was invoked
        mock_whatsapp.assert_called_once_with(approved_claim)

    # 3. Verify Distributor Wallet Credit Note & Ledger
    wallet.refresh_from_db()
    assert wallet.available_balance == initial_wallet_balance + expected_credit_amount

    ledger_entry = WalletLedgerEntry.objects.filter(reference=approved_claim.credit_note_id).first()
    assert ledger_entry is not None
    assert ledger_entry.amount == expected_credit_amount
    assert ledger_entry.entry_type == WalletLedgerEntry.EntryType.CREDIT
    assert f"Claim {approved_claim.claim_number}" in ledger_entry.description

    # 4. Audit Trail Verification
    audit = AuditEvent.objects.filter(entity='Claim', entity_id=approved_claim.claim_number, action='CLAIM_APPROVED').first()
    assert audit is not None
    assert audit.metadata['credit_note_id'] == approved_claim.credit_note_id


# ==============================================================================
# 7. Rejection Test
# ==============================================================================
def test_rejection(setup_claims_environment):
    """
    Verifies claim rejection:
    - Requires authorized reviewer (Accounts/Admin).
    - Requires mandatory rejection reason.
    - Transitions to REJECTED.
    - No credit note or wallet ledger is generated.
    - Dealer unauthorized to review/reject.
    """
    env = setup_claims_environment
    order = env['order']
    dealer = env['dealer1']
    dealer_user = env['dealer1_user']
    accounts_user = env['accounts_user']
    wallet = env['wallet']

    claim = ClaimService.file_claim(
        order=order,
        dealer=dealer,
        claim_type='SHORTAGE',
        affected_bags=5,
        description='Unsubstantiated shortage claim.',
        created_by=dealer_user,
    )

    # Dealer cannot review or reject claim
    with pytest.raises(PermissionDenied, match="Only Accounts personnel or Central Admin"):
        ClaimService.reject_claim(claim, reviewer=dealer_user, rejection_reason='Self-rejection attempt.')

    # Rejection reason is mandatory
    with pytest.raises(ValidationError, match="Rejection reason is mandatory"):
        ClaimService.reject_claim(claim, reviewer=accounts_user, rejection_reason='')

    # Accounts rejects claim with valid reason
    initial_balance = wallet.available_balance
    with patch.object(WhatsAppService, 'send_claim_update') as mock_whatsapp:
        rejected_claim = ClaimService.reject_claim(
            claim=claim,
            reviewer=accounts_user,
            rejection_reason='Plant CCTV and destination weighbridge confirm full load delivered with intact seal.',
        )

        assert rejected_claim.status == Claim.Status.REJECTED
        assert rejected_claim.credit_note_id == ''
        assert rejected_claim.credit_note_amount == Decimal('0.00')
        assert 'intact seal' in rejected_claim.review_notes
        mock_whatsapp.assert_called_once_with(rejected_claim)

    # Wallet remains untouched
    wallet.refresh_from_db()
    assert wallet.available_balance == initial_balance

    # Audit Trail
    audit = AuditEvent.objects.filter(entity='Claim', entity_id=rejected_claim.claim_number, action='CLAIM_REJECTED').first()
    assert audit is not None
    assert 'rejection_reason' in audit.metadata


# ==============================================================================
# 8. API Endpoint Flow Test
# ==============================================================================
def test_claims_api_flow(setup_claims_environment):
    """
    Tests REST API endpoints for Layer 8 claims:
    - POST /api/v1/claims/ (File claim with evidence)
    - GET /api/v1/claims/ (Role-filtered claim list)
    - GET /api/v1/claims/<id>/ (Ownership enforcement)
    - POST /api/v1/claims/<id>/evidence/ (Upload photo)
    - POST /api/v1/claims/<id>/review/ (Accounts approval & credit note)
    """
    env = setup_claims_environment
    order = env['order']
    dealer1_user = env['dealer1_user']
    dealer2_user = env['dealer2_user']
    accounts_user = env['accounts_user']

    client = APIClient()

    # 1. Dealer 1 files claim via API with photo attachment
    client.force_authenticate(user=dealer1_user)
    photo = SimpleUploadedFile(
        name="damaged_bags.jpg",
        content=b"\xff\xd8\xff\xe0" + b"JPEG test data",
        content_type="image/jpeg",
    )
    post_data = {
        'order': order.id,
        'claim_type': 'QUALITY/DAMAGE',
        'affected_bags': 6,
        'description': 'Torn bags on lower layer of truck.',
        'photos': photo,
    }
    resp = client.post('/api/v1/claims/', data=post_data, format='multipart')
    assert resp.status_code == 201
    claim_id = resp.data['id']
    assert resp.data['claim_type'] == 'QUALITY_DAMAGE'
    assert resp.data['affected_bags'] == 6
    assert resp.data['status'] == 'CREATED'
    assert len(resp.data['evidence_files']) == 1

    # 2. GET /api/v1/claims/ as Dealer 1 sees only their claim
    resp = client.get('/api/v1/claims/')
    assert resp.status_code == 200
    assert len(resp.data) == 1
    assert resp.data[0]['id'] == claim_id

    # 3. GET /api/v1/claims/ as Dealer 2 sees empty list
    client.force_authenticate(user=dealer2_user)
    resp = client.get('/api/v1/claims/')
    assert resp.status_code == 200
    assert len(resp.data) == 0

    # 4. GET /api/v1/claims/<id>/ as Dealer 2 is 403 Forbidden
    resp = client.get(f'/api/v1/claims/{claim_id}/')
    assert resp.status_code == 403

    # 5. POST /api/v1/claims/<id>/evidence/ by Dealer 1
    client.force_authenticate(user=dealer1_user)
    extra_photo = SimpleUploadedFile(
        name="second_angle.png",
        content=b"\x89PNG\r\n\x1a\n" + b"PNG test data",
        content_type="image/png",
    )
    resp = client.post(f'/api/v1/claims/{claim_id}/evidence/', data={'photos': extra_photo, 'caption': 'Side view of torn bag'}, format='multipart')
    assert resp.status_code == 201

    # 6. Accounts reviews and approves claim via API
    client.force_authenticate(user=accounts_user)
    review_payload = {
        'action': 'APPROVE',
        'notes': 'Quality discrepancy approved after lab and transporter review.',
    }
    with patch.object(WhatsAppService, 'send_claim_update'):
        resp = client.post(f'/api/v1/claims/{claim_id}/review/', data=review_payload, format='json')
        assert resp.status_code == 200
        assert resp.data['status'] == 'APPROVED'
        assert resp.data['credit_note_id'].startswith('CN-CLM-')
        assert Decimal(resp.data['credit_note_amount']) > Decimal('0.00')

