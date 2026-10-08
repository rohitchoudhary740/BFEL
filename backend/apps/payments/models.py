from django.db import models
from django.conf import settings
from decimal import Decimal

class Payment(models.Model):
    """
    100% advance remittance record mapped to feed order.
    """
    class Mode(models.TextChoices):
        RTGS = 'RTGS', 'RTGS'
        NEFT = 'NEFT', 'NEFT'
        IMPS = 'IMPS', 'IMPS'
        WALLET = 'WALLET', 'Distributor Wallet'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Verification'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

    order = models.ForeignKey('orders.Order', on_delete=models.PROTECT, related_name='payments')
    dealer = models.ForeignKey('dealers.Dealer', on_delete=models.PROTECT, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(max_length=10, choices=Mode.choices)
    utr_number = models.CharField(max_length=100, unique=True, db_index=True)
    bank_name = models.CharField(max_length=150)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    receipt_url = models.CharField(max_length=500, blank=True)
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='submitted_payments'
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='verified_payments'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment ₹{self.amount} for {self.order.order_number} (UTR: {self.utr_number}) - [{self.status}]"
