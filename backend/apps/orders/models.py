from django.db import models
from django.core.exceptions import ValidationError
from decimal import Decimal

BAG_WEIGHT_KG = 50

class Order(models.Model):
    """
    Central wholesale feed order entity strictly governed by 20 MT or 25 MT truck capacities.
    """
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PLACED = 'PLACED', 'Placed'
        PAYMENT_PENDING = 'PAYMENT_PENDING', 'Payment Pending'
        PAYMENT_SUBMITTED = 'PAYMENT_SUBMITTED', 'Payment Submitted'
        PAYMENT_VERIFIED = 'PAYMENT_VERIFIED', 'Payment Verified'
        LOADING_QUEUED = 'LOADING_QUEUED', 'Loading Queued'
        LOADING = 'LOADING', 'Loading'
        LOADED = 'LOADED', 'Loaded'
        GATE_CLEARED = 'GATE_CLEARED', 'Gate Cleared'
        DISPATCHED = 'DISPATCHED', 'Dispatched'
        DELIVERED = 'DELIVERED', 'Delivered'
        CLAIM_PENDING = 'CLAIM_PENDING', 'Claim Pending'
        CLOSED = 'CLOSED', 'Closed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class TruckCapacity(models.TextChoices):
        CAPACITY_20_MT = '20_MT', '20 MT (Max 400 Bags)'
        CAPACITY_25_MT = '25_MT', '25 MT (Max 500 Bags)'

    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    dealer = models.ForeignKey('dealers.Dealer', on_delete=models.PROTECT, related_name='orders')
    distributor = models.ForeignKey('distributors.Distributor', on_delete=models.PROTECT, related_name='orders')
    truck_capacity = models.CharField(max_length=10, choices=TruckCapacity.choices)
    max_bags = models.PositiveIntegerField()
    total_bags = models.PositiveIntegerField(default=0)
    total_weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_weight_mt = models.DecimalField(max_digits=6, decimal_places=3, default=Decimal('0.000'))
    
    # Financial fields in Decimal
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    net_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    advance_payable = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    advance_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.DRAFT, db_index=True)
    destination = models.CharField(max_length=255)
    requested_dispatch_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'users.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_orders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        # Configure max allowed bags strictly based on truck capacity
        if self.truck_capacity == self.TruckCapacity.CAPACITY_20_MT:
            self.max_bags = 400
        elif self.truck_capacity == self.TruckCapacity.CAPACITY_25_MT:
            self.max_bags = 500
        else:
            raise ValidationError(f"Invalid truck capacity: {self.truck_capacity}")

        if self.total_bags > self.max_bags:
            raise ValidationError(
                f"Truck capacity violation: {self.truck_capacity} allows maximum {self.max_bags} bags. "
                f"Attempted to order {self.total_bags} bags."
            )

        # Calculate exact weights based on 50 kg per bag
        expected_kg = Decimal(self.total_bags * BAG_WEIGHT_KG)
        expected_mt = expected_kg / Decimal('1000.0')
        self.total_weight_kg = expected_kg
        self.total_weight_mt = expected_mt

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_number} ({self.dealer.dealership_name}) - [{self.status}]"

class OrderItem(models.Model):
    """
    Individual feed line items within a truckload order.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT)
    bags = models.PositiveIntegerField()
    bag_weight_kg = models.PositiveIntegerField(default=50, editable=False)
    weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    weight_mt = models.DecimalField(max_digits=6, decimal_places=3)
    rate_per_bag = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)

    def clean(self):
        self.bag_weight_kg = 50
        self.weight_kg = Decimal(self.bags * self.bag_weight_kg)
        self.weight_mt = self.weight_kg / Decimal('1000.0')
        self.total_amount = Decimal(self.bags) * self.rate_per_bag

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.bags} bags of {self.product.name} (Order {self.order.order_number})"
