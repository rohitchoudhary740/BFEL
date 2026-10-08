import hashlib
import secrets
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class Role(models.Model):
    """
    Standard RBAC Role definition.
    """
    class Code(models.TextChoices):
        DEALER = 'dealer', 'Dealer'
        DISTRIBUTOR = 'distributor', 'Distributor'
        SALES_AGENT = 'sales_agent', 'Sales Agent'
        ACCOUNTS = 'accounts', 'Accounts'
        LOADING_OPERATOR = 'loading_operator', 'Loading Operator'
        ADMIN = 'admin', 'Admin'

    code = models.CharField(max_length=50, choices=Code.choices, unique=True, primary_key=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    """
    Primary user entity for BFEL Flow platform.
    Uses phone number for mobile-first identification.
    """
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        PENDING = 'pending', 'Pending Approval'
        SUSPENDED = 'suspended', 'Suspended'
        REJECTED = 'rejected', 'Rejected'

    phone = models.CharField(max_length=15, unique=True, db_index=True)
    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, blank=True, related_name='users')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    organization = models.CharField(max_length=255, blank=True)
    territory = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.phone})"

class SalesAgent(models.Model):
    """
    Sales agent profile capturing territory and reporting hierarchy.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='sales_agent_profile')
    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    region = models.CharField(max_length=100)
    reporting_manager = models.CharField(max_length=150, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name()} [{self.employee_id}]"

class OTPRecord(models.Model):
    """
    Secure transient OTP storage.
    Raw OTP is NEVER stored in database; only SHA256(raw_otp + salt) is preserved.
    """
    phone = models.CharField(max_length=15, db_index=True)
    otp_hash = models.CharField(max_length=128)
    salt = models.CharField(max_length=32)
    attempts = models.PositiveIntegerField(default=0)
    max_attempts = models.PositiveIntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def create_for_phone(cls, phone: str, raw_otp: str, validity_seconds: int = 300) -> 'OTPRecord':
        salt = secrets.token_hex(16)
        salted_str = f"{raw_otp}{salt}".encode('utf-8')
        otp_hash = hashlib.sha256(salted_str).hexdigest()
        expires_at = timezone.now() + timedelta(seconds=validity_seconds)
        
        return cls.objects.create(
            phone=phone,
            otp_hash=otp_hash,
            salt=salt,
            expires_at=expires_at,
        )

    def verify(self, candidate_otp: str) -> bool:
        """
        Validates candidate OTP against stored hash, enforcing max attempts and expiry.
        """
        if self.is_verified:
            return False

        if timezone.now() > self.expires_at:
            return False

        if self.attempts >= self.max_attempts:
            return False

        self.attempts += 1
        candidate_hash = hashlib.sha256(f"{candidate_otp}{self.salt}".encode('utf-8')).hexdigest()

        if secrets.compare_digest(self.otp_hash, candidate_hash):
            self.is_verified = True
            self.save(update_fields=['attempts', 'is_verified'])
            return True

        self.save(update_fields=['attempts'])
        return False

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at or self.attempts >= self.max_attempts
