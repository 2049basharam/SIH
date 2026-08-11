import datetime
from sqlalchemy.orm import Session
from app.models import AuditLog, Event

def detect_admin_anomalies(db: Session, college: str, event_id: int) -> list:
    """
    Scans recent administrative audit logs for rapid/unusual patterns.
    (Deterministic Rules to control LLM cost and guarantee accuracy)
    """
    anomalies = []
    
    # Define timeframe (e.g. last 1 hour)
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=12)
    
    # Query logs
    logs = db.query(AuditLog).filter(
        AuditLog.college == college,
        AuditLog.timestamp >= cutoff
    ).order_by(AuditLog.timestamp.desc()).all()
    
    # Group actions by actor within a 10-minute sliding window
    actor_actions = {}
    for log in logs:
        actor_id = log.actor_id
        if not actor_id:
            continue
            
        if actor_id not in actor_actions:
            actor_actions[actor_id] = []
        actor_actions[actor_id].append(log)
        
    for actor_id, actor_logs in actor_actions.items():
        # Sort chronologically
        actor_logs.sort(key=lambda x: x.timestamp)
        
        # Check sliding window of 5 minutes
        for i in range(len(actor_logs)):
            window = [actor_logs[i]]
            for j in range(i + 1, len(actor_logs)):
                diff = (actor_logs[j].timestamp - actor_logs[i].timestamp).total_seconds()
                if diff <= 300.0: # 5 minutes
                    window.append(actor_logs[j])
                else:
                    break
                    
            if len(window) >= 8:
                # Flag rapid administrative modifications
                action_counts = {}
                for w in window:
                    action_counts[w.action] = action_counts.get(w.action, 0) + 1
                    
                actions_summary = ", ".join([f"{k} ({v} times)" for k, v in action_counts.items()])
                
                anomalies.append({
                    "severity": "MEDIUM",
                    "type": "SCRIPT_ADMIN",
                    "description": f"Actor {actor_id} performed {len(window)} modifications within a 5-minute window: {actions_summary}.",
                    "metadata": {
                        "actor_id": actor_id,
                        "window_count": len(window),
                        "actions": list(action_counts.keys())
                    }
                })
                break  # flag once per sequence to avoid duplicate logs
                
    return anomalies
