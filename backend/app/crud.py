from sqlalchemy.orm import Session
from typing import Optional, Any, Dict
from app.models import AuditLog, Notification

def log_action(
    db: Session,
    actor_id: Optional[int],
    actor_role: str,
    action: str,
    entity: str,
    entity_id: Optional[int] = None,
    reason: Optional[str] = None,
    metadata_json: Optional[Dict[str, Any]] = None,
    college: Optional[str] = None
) -> AuditLog:
    """
    Creates a system audit log record.
    """
    audit = AuditLog(
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        entity=entity,
        entity_id=entity_id,
        reason=reason,
        metadata_json=metadata_json,
        college=college
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit

def send_notification(
    db: Session,
    student_id: int,
    title: str,
    message: str
) -> Notification:
    """
    Creates an in-app student notification record.
    """
    notif = Notification(
        student_id=student_id,
        title=title,
        message=message,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
