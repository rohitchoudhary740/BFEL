from django.db import models
from django.conf import settings

class AccountsUser(models.Model):
    """
    Finance and Accounts desk staff profile for payment verification.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='accounts_profile')
    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    department = models.CharField(max_length=100, default='Finance & Accounts')

    def __str__(self):
        return f"{self.user.get_full_name()} (Accounts: {self.employee_id})"

class AuditEvent(models.Model):
    """
    Central immutable audit trail capturing all critical business actions.
    """
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='audit_actions'
    )
    actor_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=50, db_index=True)
    action = models.CharField(max_length=100, db_index=True)
    entity = models.CharField(max_length=100, db_index=True)
    entity_id = models.CharField(max_length=100, db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {self.role} - {self.action} on {self.entity}#{self.entity_id}"
