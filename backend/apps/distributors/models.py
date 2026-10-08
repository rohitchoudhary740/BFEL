from django.db import models
from django.conf import settings
from decimal import Decimal

class Distributor(models.Model):
    """
    Distributor profile entity managing regional wholesale hubs.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='distributor_profile')
    company_name = models.CharField(max_length=255)
    distributor_code = models.CharField(max_length=50, unique=True, db_index=True)
    gstin = models.CharField(max_length=15, blank=True)
    warehouse_address = models.TextField()
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100, default='Madhya Pradesh')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company_name} ({self.distributor_code})"

class DistributorWallet(models.Model):
    """
    Distributor credit wallet supporting prepaid advances and revolving credit headroom.
    """
    distributor = models.OneToOneField(Distributor, on_delete=models.CASCADE, related_name='wallet')
    available_balance = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    credit_limit = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('1000000.00'))
    reserved_funds = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def available_credit(self) -> Decimal:
        return max(Decimal('0.00'), self.credit_limit - self.reserved_funds)

    def __str__(self):
        return f"Wallet for {self.distributor.company_name} (Bal: {self.available_balance})"

class WalletLedgerEntry(models.Model):
    """
    Double-entry accounting ledger transaction record.
    """
    class EntryType(models.TextChoices):
        CREDIT = 'CREDIT', 'Credit'
        DEBIT = 'DEBIT', 'Debit'

    wallet = models.ForeignKey(DistributorWallet, on_delete=models.CASCADE, related_name='ledger_entries')
    entry_type = models.CharField(max_length=10, choices=EntryType.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    balance_after = models.DecimalField(max_digits=14, decimal_places=2)
    reference = models.CharField(max_length=100, db_index=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.entry_type}] {self.amount} Ref:{self.reference}"
