import time
from sqlalchemy.orm import Session
from app.models import IntelligenceAuditLog
from app.config import settings

def log_ai_call(
    db: Session,
    college: str,
    event_id: int,
    actor_id: int,
    actor_role: str,
    operation: str,
    latency: float,
    status: str,
    confidence: str = None,
    input_ref: str = None,
    output_ref: str = None,
    error: str = None
) -> IntelligenceAuditLog:
    """Logs an AI operation audit record for transparency and billing tracking."""
    try:
        audit = IntelligenceAuditLog(
            college=college,
            event_id=event_id,
            actor_id=actor_id,
            actor_role=actor_role,
            operation=operation,
            provider=settings.AI_PROVIDER,
            model=settings.AI_MODEL,
            input_reference=input_ref[:250] if input_ref else None,
            output_reference=output_ref[:250] if output_ref else None,
            confidence=confidence,
            latency=round(latency, 3),
            status=status,
            error=str(error)[:1000] if error else None
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit
    except Exception as e:
        # Fallback to prevent db failure from breaking core system
        db.rollback()
        import traceback
        traceback.print_exc()
        return None
