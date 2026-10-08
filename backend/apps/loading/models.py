from django.db import models
from django.conf import settings
from decimal import Decimal

class LoadingOperator(models.Model):
    """
    Plant dispatch operator terminal user.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='loading_operator_profile')
    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    plant_terminal = models.CharField(max_length=100, default='Manglia Loading Terminal, Indore')

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_id})"

class Truck(models.Model):
    """
    Heavy transport vehicle strictly categorized by 20 MT (400 bags) or 25 MT (500 bags).
    """
    class CapacityType(models.TextChoices):
        CAPACITY_20_MT = '20_MT', '20 Metric Tons (400 Bags)'
        CAPACITY_25_MT = '25_MT', '25 Metric Tons (500 Bags)'

    registration_number = models.CharField(max_length=20, unique=True, db_index=True)
    capacity_type = models.CharField(max_length=10, choices=CapacityType.choices)
    capacity_mt = models.DecimalField(max_digits=5, decimal_places=2) # 20.00 or 25.00
    max_bags = models.PositiveIntegerField() # 400 or 500
    is_active = models.BooleanField(default=True)

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.capacity_type == self.CapacityType.CAPACITY_20_MT:
            self.capacity_mt = Decimal('20.00')
            self.max_bags = 400
        elif self.capacity_type == self.CapacityType.CAPACITY_25_MT:
            self.capacity_mt = Decimal('25.00')
            self.max_bags = 500
        else:
            raise ValidationError("Invalid truck capacity. Only 20 MT or 25 MT supported.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.registration_number} ({self.capacity_type})"

class Driver(models.Model):
    """
    Authorized commercial truck driver.
    """
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    license_number = models.CharField(max_length=50, unique=True, db_index=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.license_number})"

class LoadingBay(models.Model):
    """
    Plant physical loading bay terminal.
    """
    bay_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} [{self.bay_number}]"

class LoadingSession(models.Model):
    """
    Active loading execution session linking Order to Truck, Driver, Bay and Operator.
    """
    class Status(models.TextChoices):
        QUEUED = 'QUEUED', 'Queued'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    order = models.OneToOneField('orders.Order', on_delete=models.PROTECT, related_name='loading_session')
    bay = models.ForeignKey(LoadingBay, on_delete=models.PROTECT, related_name='sessions')
    truck = models.ForeignKey(Truck, on_delete=models.PROTECT, related_name='loading_sessions')
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT, related_name='loading_sessions')
    operator = models.ForeignKey(LoadingOperator, on_delete=models.PROTECT, related_name='sessions')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED)
    expected_bags = models.PositiveIntegerField(default=0)
    bags_loaded = models.PositiveIntegerField(default=0)
    seal_number = models.CharField(max_length=50, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Loading Session #{self.id} for Order {self.order.order_number}"

class WeighbridgeReading(models.Model):
    """
    Electronic weighbridge weight ticket reading with variance analysis.
    """
    session = models.ForeignKey(LoadingSession, on_delete=models.CASCADE, related_name='weighbridge_readings')
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='weighbridge_readings'
    )
    tare_weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    gross_weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    net_weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    expected_weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    variance_kg = models.DecimalField(max_digits=10, decimal_places=2)
    tolerance_kg = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('100.00'))
    recorded_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_within_tolerance(self) -> bool:
        return abs(self.variance_kg) <= self.tolerance_kg

    def __str__(self):
        return f"Weigh Ticket (Net: {self.net_weight_kg} kg, Var: {self.variance_kg} kg)"
