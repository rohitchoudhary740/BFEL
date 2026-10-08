import re
import secrets
from datetime import timedelta
from typing import Dict, Any, Optional, Tuple
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import Role, OTPRecord, SalesAgent
from apps.dealers.models import Dealer
from apps.distributors.models import Distributor, DistributorWallet
from apps.accounts.models import AuditEvent
from services.audit import AuditService

User = get_user_model()

class AuthError(Exception):
    """Base authentication exception."""
    pass

class AccountStatusError(AuthError):
    """Raised when an account is not in ACTIVE status."""
    pass

class RateLimitError(AuthError):
    """Raised when OTP request is rate-limited."""
    pass

class InvalidOTPError(AuthError):
    """Raised when OTP code is incorrect or expired."""
    pass

class RegistrationNotAllowedError(AuthError):
    """Raised when public registration is attempted for internal/admin roles."""
    pass

def clean_phone(phone: str) -> str:
    """Extracts 10-digit Indian mobile number."""
    digits = re.sub(r'\D', '', phone)
    return digits[-10:] if len(digits) >= 10 else digits

class AuthService:
    """
    Service layer implementing secure authentication, OTP lifecycle, and RBAC enrollment.
    """

    @staticmethod
    def get_tokens_for_user(user: User) -> Dict[str, str]:
        refresh = RefreshToken.for_user(user)
        # Custom claims
        refresh['role'] = user.role.code if user.role else 'user'
        refresh['status'] = user.status
        refresh['phone'] = user.phone
        refresh['organization'] = user.organization

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

    @staticmethod
    def login_with_credentials(identifier: str, password: str) -> Dict[str, Any]:
        phone_term = clean_phone(identifier)
        user = User.objects.filter(
            models_or_phone = phone_term
        ).first() if False else None

        user = User.objects.filter(phone=phone_term).first()
        if not user:
            user = User.objects.filter(email__iexact=identifier.strip()).first()
        if not user:
            user = User.objects.filter(username__iexact=identifier.strip()).first()

        if not user:
            AuditService.log_event(
                action='LOGIN_FAILED',
                entity='Auth',
                entity_id=identifier,
                role='anonymous',
                metadata={'reason': 'User not found'}
            )
            raise AuthError("No account found with provided credentials.")

        if not user.check_password(password):
            AuditService.log_event(
                action='LOGIN_FAILED',
                entity='Auth',
                entity_id=user.phone,
                role=user.role.code if user.role else 'user',
                actor=user,
                metadata={'reason': 'Invalid password'}
            )
            raise AuthError("Invalid password. Please check your credentials.")

        # Account status security check
        if user.status == User.Status.PENDING:
            raise AccountStatusError("Your account application is pending administrative review.")
        elif user.status == User.Status.SUSPENDED:
            raise AccountStatusError("Your account has been suspended by BFEL operations.")
        elif user.status == User.Status.REJECTED:
            raise AccountStatusError("Your account application was not approved.")
        elif user.status != User.Status.ACTIVE:
            raise AccountStatusError("Account is not active.")

        tokens = AuthService.get_tokens_for_user(user)

        AuditService.log_event(
            action='LOGIN_SUCCESSFUL',
            entity='Auth',
            entity_id=user.phone,
            role=user.role.code if user.role else 'user',
            actor=user,
            metadata={'auth_method': 'password'}
        )

        return {
            'tokens': tokens,
            'user': user,
        }

    @staticmethod
    def request_otp(phone: str) -> Dict[str, Any]:
        normalized = clean_phone(phone)
        if len(normalized) != 10:
            raise AuthError("Please provide a valid 10-digit mobile number.")

        # Rate Limiting: Minimum 60 seconds between requests
        latest = OTPRecord.objects.filter(phone=normalized).first()
        if latest and timezone.now() - latest.created_at < timedelta(seconds=60):
            wait_seconds = 60 - int((timezone.now() - latest.created_at).total_seconds())
            raise RateLimitError(f"Please wait {wait_seconds} seconds before requesting a new code.")

        # Account status check if user is already registered
        user = User.objects.filter(phone=normalized).first()
        if user:
            if user.status == User.Status.PENDING:
                raise AccountStatusError("Your account application is pending administrative review.")
            elif user.status == User.Status.SUSPENDED:
                raise AccountStatusError("Your account has been suspended by BFEL operations.")
            elif user.status == User.Status.REJECTED:
                raise AccountStatusError("Your account application was rejected.")

        # Generate cryptographic 6-digit OTP
        raw_otp = f"{secrets.randbelow(900000) + 100000}"

        # Invalidate prior pending OTPs for this phone
        OTPRecord.objects.filter(phone=normalized, is_verified=False).update(is_verified=True)

        # Store salted hash (never plaintext)
        record = OTPRecord.create_for_phone(
            phone=normalized,
            raw_otp=raw_otp,
            validity_seconds=300
        )

        AuditService.log_event(
            action='OTP_REQUESTED',
            entity='Auth',
            entity_id=normalized,
            role='anonymous' if not user else user.role.code,
            metadata={'otp_record_id': record.id}
        )

        # Development / Testing OTP isolation
        dev_otp = raw_otp if getattr(settings, 'ENABLE_DEV_OTP', False) else None

        return {
            'success': True,
            'message': '6-digit verification code dispatched.',
            'dev_otp': dev_otp,
            'expires_in_seconds': 300,
        }

    @staticmethod
    def verify_otp_and_login(phone: str, otp_code: str) -> Dict[str, Any]:
        normalized = clean_phone(phone)
        otp_clean = str(otp_code).strip()

        record = OTPRecord.objects.filter(
            phone=normalized,
            is_verified=False,
            expires_at__gt=timezone.now()
        ).first()

        if not record:
            raise InvalidOTPError("Verification code has expired or was not requested. Please request a new code.")

        if not record.verify(otp_clean):
            AuditService.log_event(
                action='OTP_VERIFICATION_FAILED',
                entity='Auth',
                entity_id=normalized,
                role='anonymous',
                metadata={'attempts': record.attempts}
            )
            if record.attempts >= record.max_attempts:
                raise InvalidOTPError("Maximum verification attempts exceeded. Please request a new code.")
            raise InvalidOTPError(f"Incorrect verification code. Attempts remaining: {record.max_attempts - record.attempts}.")

        # OTP is valid!
        user = User.objects.filter(phone=normalized).first()
        if not user:
            return {
                'success': True,
                'is_registered': False,
                'phone': normalized,
                'message': 'Mobile number verified. Please complete partner onboarding.',
            }

        # Validate account status
        if user.status == User.Status.PENDING:
            raise AccountStatusError("Your account application is pending administrative review.")
        elif user.status == User.Status.SUSPENDED:
            raise AccountStatusError("Your account has been suspended by BFEL operations.")
        elif user.status == User.Status.REJECTED:
            raise AccountStatusError("Your account application was rejected.")

        tokens = AuthService.get_tokens_for_user(user)

        AuditService.log_event(
            action='LOGIN_SUCCESSFUL',
            entity='Auth',
            entity_id=user.phone,
            role=user.role.code if user.role else 'user',
            actor=user,
            metadata={'auth_method': 'otp'}
        )

        return {
            'success': True,
            'is_registered': True,
            'tokens': tokens,
            'user': user,
        }

    @staticmethod
    def register_dealer(data: Dict[str, Any]) -> Tuple[User, Dealer]:
        phone = clean_phone(data.get('phone', ''))
        if User.objects.filter(phone=phone).exists():
            raise AuthError("A user with this mobile number already exists.")

        dealer_role, _ = Role.objects.get_or_create(
            code=Role.Code.DEALER,
            defaults={'name': 'Dealer', 'description': 'Authorized Tier-1 Dealer'}
        )

        username = data.get('username') or f"dealer_{phone}"
        user = User.objects.create_user(
            username=username,
            phone=phone,
            email=data.get('email', ''),
            first_name=data.get('name', '').split(' ')[0],
            last_name=' '.join(data.get('name', '').split(' ')[1:]) if ' ' in data.get('name', '') else '',
            role=dealer_role,
            status=User.Status.PENDING, # Requires admin vetting
            organization=data.get('dealership_name', ''),
            territory=f"{data.get('district', '')}, {data.get('state', 'MP')}"
        )
        if data.get('password'):
            user.set_password(data['password'])
            user.save(update_fields=['password'])

        dealer = Dealer.objects.create(
            user=user,
            dealership_name=data.get('dealership_name', ''),
            gstin=data.get('gstin', ''),
            mandi_yard=data.get('mandi_yard', f"{data.get('city', '')} Mandi Yard"),
            address=data.get('address', ''),
            city=data.get('city', ''),
            district=data.get('district', ''),
            state=data.get('state', 'Madhya Pradesh'),
            pincode=data.get('pincode', '455001')
        )

        AuditService.log_event(
            action='DEALER_SIGNUP_SUBMITTED',
            entity='Dealer',
            entity_id=str(dealer.id),
            role='dealer',
            actor=user,
            metadata={'dealership': dealer.dealership_name}
        )

        return user, dealer

    @staticmethod
    def register_sales_agent(data: Dict[str, Any]) -> Tuple[User, SalesAgent]:
        phone = clean_phone(data.get('phone', ''))
        if User.objects.filter(phone=phone).exists():
            raise AuthError("A user with this mobile number already exists.")

        agent_role, _ = Role.objects.get_or_create(
            code=Role.Code.SALES_AGENT,
            defaults={'name': 'Sales Agent', 'description': 'BFEL Field Sales Agent'}
        )

        username = data.get('username') or f"agent_{phone}"
        user = User.objects.create_user(
            username=username,
            phone=phone,
            email=data.get('email', ''),
            first_name=data.get('name', '').split(' ')[0],
            last_name=' '.join(data.get('name', '').split(' ')[1:]) if ' ' in data.get('name', '') else '',
            role=agent_role,
            status=User.Status.PENDING,
            organization=f"BFEL Field Sales - {data.get('region', 'Malwa')}",
            territory=data.get('region', '')
        )
        if data.get('password'):
            user.set_password(data['password'])
            user.save(update_fields=['password'])

        agent = SalesAgent.objects.create(
            user=user,
            employee_id=data.get('employee_id') or f"EMP-{secrets.randbelow(900) + 100}",
            region=data.get('region', 'Malwa Belt'),
            reporting_manager=data.get('reporting_manager', 'Rajeshwar Sharma')
        )

        AuditService.log_event(
            action='SALES_AGENT_SIGNUP_SUBMITTED',
            entity='SalesAgent',
            entity_id=str(agent.id),
            role='sales_agent',
            actor=user,
            metadata={'employee_id': agent.employee_id}
        )

        return user, agent

    @staticmethod
    def register_distributor_request(data: Dict[str, Any]) -> Tuple[User, Distributor]:
        phone = clean_phone(data.get('phone', ''))
        if User.objects.filter(phone=phone).exists():
            raise AuthError("A user with this mobile number already exists.")

        dist_role, _ = Role.objects.get_or_create(
            code=Role.Code.DISTRIBUTOR,
            defaults={'name': 'Distributor', 'description': 'Regional Wholesale Hub'}
        )

        username = data.get('username') or f"dist_{phone}"
        user = User.objects.create_user(
            username=username,
            phone=phone,
            email=data.get('email', ''),
            first_name=data.get('name', ''),
            role=dist_role,
            status=User.Status.PENDING,
            organization=data.get('company_name', ''),
            territory=f"{data.get('district', '')}, {data.get('state', 'MP')}"
        )
        if data.get('password'):
            user.set_password(data['password'])
            user.save(update_fields=['password'])

        distributor = Distributor.objects.create(
            user=user,
            company_name=data.get('company_name', ''),
            distributor_code=data.get('distributor_code') or f"REQ-DIST-{secrets.randbelow(900) + 100}",
            gstin=data.get('gstin', ''),
            warehouse_address=data.get('address', ''),
            city=data.get('city', ''),
            district=data.get('district', ''),
            state=data.get('state', 'Madhya Pradesh')
        )
        DistributorWallet.objects.create(
            distributor=distributor,
            available_balance=0.00,
            credit_limit=0.00
        )

        AuditService.log_event(
            action='DISTRIBUTOR_REQUEST_SUBMITTED',
            entity='Distributor',
            entity_id=str(distributor.id),
            role='distributor',
            actor=user,
            metadata={'company': distributor.company_name}
        )

        return user, distributor

    @staticmethod
    def block_unauthorized_signup(role_code: str):
        """
        Enforces JD specification: Central Admin, Accounts, Loading Operator cannot publicly self-signup.
        """
        if role_code in [Role.Code.ADMIN, Role.Code.ACCOUNTS, Role.Code.LOADING_OPERATOR]:
            raise RegistrationNotAllowedError(
                f"Public registration is prohibited for {role_code}. "
                "Account must be provisioned internally by BFEL Plant Administration."
            )
