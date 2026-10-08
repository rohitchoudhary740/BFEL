from django.db import models
from django.conf import settings
from decimal import Decimal

def claim_evidence_upload_path(instance, filename):
    claim_num = getattr(instance.claim, 'claim_number', 'unknown')
    return f"claims/evidence/{claim_num}/{filename}"

class Claim(models.Model):
    """
    Formal shortage, transit damage, or quality discrepancy claim filed upon unloading.
    """
    class ClaimType(models.TextChoices):
        SHORTAGE = 'SHORTAGE', 'Shortage'
        QUALITY_DAMAGE = 'QUALITY_DAMAGE', 'Quality/Damage'
        # Legacy/alternate representations
        SHORTAGE_LEGACY = 'shortage', 'Shortage (Legacy)'
        DAMAGED_BAGS_LEGACY = 'damaged_bags', 'Damaged Bags'
        QUALITY_ISSUE_LEGACY = 'quality_issue', 'Quality Issue'
        WRONG_PRODUCT_LEGACY = 'wrong_product', 'Wrong Product'

    class Status(models.TextChoices):
        CREATED = 'CREATED', 'Created'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        # Legacy mappings
        SUBMITTED = 'submitted', 'Submitted (Legacy)'
        UNDER_REVIEW_LEGACY = 'under_review', 'Under Review (Legacy)'
        APPROVED_LEGACY = 'approved', 'Approved (Legacy)'
        REJECTED_LEGACY = 'rejected', 'Rejected (Legacy)'

    claim_number = models.CharField(max_length=50, unique=True, db_index=True)
    order = models.ForeignKey('orders.Order', on_delete=models.PROTECT, related_name='claims')
    dealer = models.ForeignKey('dealers.Dealer', on_delete=models.PROTECT, related_name='claims')
    claim_type = models.CharField(max_length=30, choices=ClaimType.choices, default=ClaimType.SHORTAGE)
    
    affected_bags = models.PositiveIntegerField(default=0)
    expected_bags = models.PositiveIntegerField(default=0)
    received_bags = models.PositiveIntegerField(default=0)
    shortage_bags = models.PositiveIntegerField(default=0)
    shortage_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    description = models.TextField()
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.CREATED, db_index=True)
    
    # Review & credit note information
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='filed_claims'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_claims'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    admin_remarks = models.TextField(blank=True)
    
    credit_note_id = models.CharField(max_length=60, blank=True)
    credit_note_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.affected_bags:
            self.shortage_bags = self.affected_bags
            self.shortage_weight_kg = Decimal(self.affected_bags * 50)
        elif self.expected_bags and self.received_bags:
            if self.received_bags > self.expected_bags:
                self.shortage_bags = 0
                self.shortage_weight_kg = Decimal('0.00')
            else:
                self.shortage_bags = self.expected_bags - self.received_bags
                self.shortage_weight_kg = Decimal(self.shortage_bags * 50)
                self.affected_bags = self.shortage_bags

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.claim_number} ({self.claim_type}) - Affected: {self.affected_bags or self.shortage_bags} bags [{self.status}]"

class ClaimEvidence(models.Model):
    """
    Photo documentation proving delivery discrepancy or damaged bags.
    Large binaries are stored in configurable file storage; DB records metadata.
    """
    claim = models.ForeignKey(Claim, on_delete=models.CASCADE, related_name='evidence_files')
    file = models.FileField(upload_to=claim_evidence_upload_path, max_length=500, blank=True, null=True)
    file_reference = models.CharField(max_length=500, blank=True)
    file_url = models.CharField(max_length=500, blank=True)
    content_type = models.CharField(max_length=100, default='image/jpeg')
    size_bytes = models.PositiveIntegerField(default=0, help_text="File size in bytes")
    caption = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.file and not self.file_reference:
            self.file_reference = str(self.file.name)
        if self.file and hasattr(self.file, 'url'):
            self.file_url = self.file.url
        elif not self.file_url and self.file_reference:
            self.file_url = f"/media/{self.file_reference}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Evidence for {self.claim.claim_number} ({self.caption or self.content_type})"
