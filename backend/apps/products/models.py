from django.db import models
from decimal import Decimal

class Product(models.Model):
    """
    Cattle feed finished product specification.
    Standard: Exactly 50 kg per bag across all product formulations.
    """
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, default='Cattle Feed')
    bag_weight_kg = models.PositiveIntegerField(default=50, editable=False)
    protein_percent = models.DecimalField(max_digits=5, decimal_places=2)
    fat_percent = models.DecimalField(max_digits=5, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

class ProductPrice(models.Model):
    """
    Time-versioned master pricing per 50 kg bag.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='prices')
    price_per_bag = models.DecimalField(max_digits=10, decimal_places=2)
    effective_from = models.DateTimeField(auto_now_add=True)
    effective_to = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-effective_from']

    def __str__(self):
        return f"{self.product.name} @ ₹{self.price_per_bag}/bag"
