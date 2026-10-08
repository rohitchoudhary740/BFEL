from django.db import models
from django.conf import settings

class Dealer(models.Model):
    """
    Tier-1 rural dealer entity operating godowns and placing bulk feed orders.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dealer_profile')
    dealership_name = models.CharField(max_length=255)
    gstin = models.CharField(max_length=15, blank=True)
    mandi_yard = models.CharField(max_length=255)
    address = models.TextField()
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100, default='Madhya Pradesh')
    pincode = models.CharField(max_length=10)
    assigned_distributor = models.ForeignKey(
        'distributors.Distributor',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='dealers'
    )
    assigned_sales_agent = models.ForeignKey(
        'users.SalesAgent',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_dealers'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.dealership_name} ({self.city})"
