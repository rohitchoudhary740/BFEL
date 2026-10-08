from django.db import models

class GatePass(models.Model):
    """
    Factory security gate pass clearance certificate issued after loading verification.
    """
    gate_pass_number = models.CharField(max_length=50, unique=True, db_index=True)
    order = models.OneToOneField('orders.Order', on_delete=models.PROTECT, related_name='gate_pass')
    truck = models.ForeignKey('loading.Truck', on_delete=models.PROTECT, related_name='gate_passes')
    driver = models.ForeignKey('loading.Driver', on_delete=models.PROTECT, related_name='gate_passes')
    seal_number = models.CharField(max_length=50)
    qr_code_hash = models.CharField(max_length=100, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Gate Pass {self.gate_pass_number} (Order: {self.order.order_number})"

class Dispatch(models.Model):
    """
    Live factory road dispatch manifest with carrier consignment note (LR).
    """
    class Status(models.TextChoices):
        IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
        DELIVERED = 'DELIVERED', 'Delivered'
        DELAYED = 'DELAYED', 'Delayed'

    dispatch_number = models.CharField(max_length=50, unique=True, db_index=True)
    order = models.OneToOneField('orders.Order', on_delete=models.PROTECT, related_name='dispatch')
    truck = models.ForeignKey('loading.Truck', on_delete=models.PROTECT, related_name='dispatches', null=True, blank=True)
    driver = models.ForeignKey('loading.Driver', on_delete=models.PROTECT, related_name='dispatches', null=True, blank=True)
    destination = models.CharField(max_length=255, blank=True)
    lr_number = models.CharField(max_length=50, unique=True, db_index=True)
    gate_pass = models.OneToOneField(GatePass, on_delete=models.PROTECT, related_name='dispatch')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_TRANSIT)
    dispatched_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.truck and self.gate_pass and self.gate_pass.truck:
            self.truck = self.gate_pass.truck
        if not self.driver and self.gate_pass and self.gate_pass.driver:
            self.driver = self.gate_pass.driver
        if not self.destination and self.order:
            self.destination = self.order.destination
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Dispatch {self.dispatch_number} (LR: {self.lr_number}) - [{self.status}]"
