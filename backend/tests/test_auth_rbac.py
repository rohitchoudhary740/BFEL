import pytest
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.users.models import Role, OTPRecord
from services.auth import AuthService, RegistrationNotAllowedError, RateLimitError, AccountStatusError

User = get_user_model()

@pytest.fixture
def rbac_roles(db):
    """Seed all 6 operational roles."""
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
def users_fixture(db, rbac_roles):
    """Create active test users for all 6 roles."""
    created = {}
    for role_code in ['dealer', 'distributor', 'sales_agent', 'accounts', 'loading_operator', 'admin']:
        user = User.objects.create_user(
            username=f"user_{role_code}",
            phone=f"980000000{list(rbac_roles.keys()).index(role_code)}",
            role=rbac_roles[role_code],
            status=User.Status.ACTIVE,
            first_name=role_code.capitalize(),
            last_name='User'
        )
        user.set_password('Password123')
        user.save()
        created[role_code] = user
    return created

# ==============================================================================
# 1. Central Admin & Protected Role Public Signup Blocked
# ==============================================================================
def test_admin_public_signup_blocked_api(api_client):
    """Verify POST /api/v1/auth/signup/admin/ is rejected with 403 Forbidden."""
    res = api_client.post('/api/v1/auth/signup/admin/', {'phone': '9826199999'})
    assert res.status_code == 403
    assert "Public registration is prohibited" in res.json().get('error', '')

def test_admin_signup_service_blocks_admin():
    """Verify AuthService.block_unauthorized_signup raises exception for admin & accounts."""
    with pytest.raises(RegistrationNotAllowedError):
        AuthService.block_unauthorized_signup(Role.Code.ADMIN)

    with pytest.raises(RegistrationNotAllowedError):
        AuthService.block_unauthorized_signup(Role.Code.ACCOUNTS)

    with pytest.raises(RegistrationNotAllowedError):
        AuthService.block_unauthorized_signup(Role.Code.LOADING_OPERATOR)

# ==============================================================================
# 2. Public Partner Onboarding (Dealer, Sales Agent, Distributor)
# ==============================================================================
def test_dealer_public_signup(api_client, rbac_roles):
    """Verify dealer signup creates a user in PENDING status."""
    payload = {
        'name': 'Gopal Krishna Choudhary',
        'phone': '9425099120',
        'email': 'gopal@choudharykisan.in',
        'dealership_name': 'Choudhary Kisan Kendra',
        'city': 'Tarana',
        'district': 'Ujjain',
        'mandi_yard': 'Tarana Mandi',
        'address': 'Mandi Road, Tarana',
        'pincode': '456665',
        'password': 'Password123',
    }
    res = api_client.post('/api/v1/auth/signup/dealer/', payload)
    assert res.status_code == 201
    data = res.json()
    assert data['success'] is True
    assert data['status'] == 'pending'

    user = User.objects.get(phone='9425099120')
    assert user.status == User.Status.PENDING
    assert user.role.code == 'dealer'
    assert user.dealer_profile.dealership_name == 'Choudhary Kisan Kendra'

def test_sales_agent_public_signup(api_client, rbac_roles):
    """Verify sales agent signup creates an application in PENDING status."""
    payload = {
        'name': 'Anil Mukati',
        'phone': '9826312450',
        'email': 'anil.mukati@gmail.com',
        'region': 'Khargone Belt',
        'password': 'Password123',
    }
    res = api_client.post('/api/v1/auth/signup/sales-agent/', payload)
    assert res.status_code == 201
    assert res.json()['status'] == 'pending'

    user = User.objects.get(phone='9826312450')
    assert user.status == User.Status.PENDING
    assert user.role.code == 'sales_agent'

# ==============================================================================
# 3. OTP Security (Hashing, Expiration, Attempt Limits, Rate Limiting)
# ==============================================================================
def test_otp_hashing_security(db):
    """Verify raw OTP is never stored in database; only salted SHA256 hash is preserved."""
    phone = '9826011111'
    raw_code = '749210'
    rec = OTPRecord.create_for_phone(phone, raw_code, validity_seconds=300)

    # Database query check
    stored = OTPRecord.objects.get(id=rec.id)
    assert stored.otp_hash != raw_code
    assert len(stored.otp_hash) == 64 # SHA-256 hex string length
    assert stored.salt is not None
    assert stored.verify('749210') is True
    assert stored.verify('123456') is False

def test_otp_rate_limiting(db):
    """Verify requesting OTP twice within 60 seconds triggers RateLimitError."""
    phone = '9826022222'
    AuthService.request_otp(phone)

    with pytest.raises(RateLimitError):
        AuthService.request_otp(phone)

def test_otp_attempt_limits(db):
    """Verify 3 failed OTP verification attempts invalidates the code."""
    phone = '9826033333'
    res = AuthService.request_otp(phone)
    dev_otp = res['dev_otp']

    rec = OTPRecord.objects.filter(phone=phone, is_verified=False).first()
    assert rec.verify('000000') is False # attempt 1
    assert rec.verify('111111') is False # attempt 2
    assert rec.verify('222222') is False # attempt 3 (reaches max_attempts)

    # Even if correct OTP is provided on 4th attempt, it must fail!
    assert rec.verify(dev_otp) is False

def test_otp_expiration(db):
    """Verify expired OTP code is rejected."""
    phone = '9826044444'
    rec = OTPRecord.create_for_phone(phone, '654321', validity_seconds=1)
    
    # Simulate time traveling into the future
    rec.expires_at = timezone.now() - timedelta(minutes=1)
    rec.save()

    assert rec.verify('654321') is False
    assert rec.is_expired is True

# ==============================================================================
# 4. Account Status Enforcement (Pending, Suspended, Rejected)
# ==============================================================================
def test_pending_account_login_blocked(db, rbac_roles):
    """Verify pending account cannot log in and receives 403."""
    user = User.objects.create_user(
        username='pending_user',
        phone='9826055555',
        role=rbac_roles['dealer'],
        status=User.Status.PENDING
    )
    user.set_password('Password123')
    user.save()

    with pytest.raises(AccountStatusError) as exc:
        AuthService.login_with_credentials('9826055555', 'Password123')
    assert "pending administrative review" in str(exc.value)

def test_suspended_account_login_blocked(db, rbac_roles):
    """Verify suspended account cannot log in and receives 403."""
    user = User.objects.create_user(
        username='suspended_user',
        phone='9826066666',
        role=rbac_roles['dealer'],
        status=User.Status.SUSPENDED
    )
    user.set_password('Password123')
    user.save()

    with pytest.raises(AccountStatusError) as exc:
        AuthService.login_with_credentials('9826066666', 'Password123')
    assert "suspended" in str(exc.value)

# ==============================================================================
# 5. Role Security & Authorization Verification
# ==============================================================================
def test_dealer_accesses_dealer_workspace(api_client, users_fixture):
    """Authorized dealer successfully accesses dealer workspace."""
    dealer = users_fixture['dealer']
    tokens = AuthService.get_tokens_for_user(dealer)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    res = api_client.get('/api/v1/dealer/workspace/')
    assert res.status_code == 200
    assert res.json()['workspace'] == 'dealer'

def test_dealer_blocked_from_admin_endpoint(api_client, users_fixture):
    """
    CRITICAL SPECIFICATION TEST:
    A Dealer manually calling /api/v1/admin/command-center/ MUST receive 403 Forbidden!
    """
    dealer = users_fixture['dealer']
    tokens = AuthService.get_tokens_for_user(dealer)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    res = api_client.get('/api/v1/admin/command-center/')
    assert res.status_code == 403

def test_dealer_blocked_from_accounts_endpoint(api_client, users_fixture):
    """Dealer attempting to access Accounts desk receives 403 Forbidden."""
    dealer = users_fixture['dealer']
    tokens = AuthService.get_tokens_for_user(dealer)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    res = api_client.get('/api/v1/accounts/workspace/')
    assert res.status_code == 403

def test_accounts_accesses_accounts_workspace(api_client, users_fixture):
    """Accounts officer accesses Accounts workspace successfully."""
    accounts_user = users_fixture['accounts']
    tokens = AuthService.get_tokens_for_user(accounts_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    res = api_client.get('/api/v1/accounts/workspace/')
    assert res.status_code == 200
    assert res.json()['workspace'] == 'accounts'

def test_loading_operator_accesses_loading_workspace(api_client, users_fixture):
    """Loading operator accesses Loading workspace successfully."""
    loader = users_fixture['loading_operator']
    tokens = AuthService.get_tokens_for_user(loader)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    res = api_client.get('/api/v1/loading/workspace/')
    assert res.status_code == 200
    assert res.json()['workspace'] == 'loading_operator'

def test_sales_agent_accesses_sales_workspace(api_client, users_fixture):
    """Sales agent accesses sales workspace successfully."""
    agent = users_fixture['sales_agent']
    tokens = AuthService.get_tokens_for_user(agent)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    res = api_client.get('/api/v1/sales/workspace/')
    assert res.status_code == 200
    assert res.json()['workspace'] == 'sales_agent'

def test_distributor_accesses_distributor_workspace(api_client, users_fixture):
    """Distributor accesses distributor workspace successfully."""
    dist = users_fixture['distributor']
    tokens = AuthService.get_tokens_for_user(dist)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    res = api_client.get('/api/v1/distributor/workspace/')
    assert res.status_code == 200
    assert res.json()['workspace'] == 'distributor'

def test_admin_has_full_operational_visibility(api_client, users_fixture):
    """Admin has full operational visibility across all role workspaces."""
    admin = users_fixture['admin']
    tokens = AuthService.get_tokens_for_user(admin)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    # Admin accesses command center
    res = api_client.get('/api/v1/admin/command-center/')
    assert res.status_code == 200

    # Admin accesses dealer workspace
    res = api_client.get('/api/v1/dealer/workspace/')
    assert res.status_code == 200

    # Admin accesses accounts workspace
    res = api_client.get('/api/v1/accounts/workspace/')
    assert res.status_code == 200
