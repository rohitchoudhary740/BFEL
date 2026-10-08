from typing import Optional, Dict, Any
from apps.accounts.models import AuditEvent

class AuditService:
    """
    Central service for recording immutable business audit events.
    """
    @staticmethod
    def log_event(
        action: str,
        entity: str,
        entity_id: str,
        role: str,
        actor=None,
        actor_name: str = '',
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditEvent:
        if actor and not actor_name:
            actor_name = actor.get_full_name() or getattr(actor, 'username', '')

        event = AuditEvent.objects.create(
            actor=actor if (actor and getattr(actor, 'is_authenticated', False)) else None,
            actor_name=actor_name,
            role=role,
            action=action,
            entity=entity,
            entity_id=str(entity_id),
            metadata=metadata or {},
        )
        return event
