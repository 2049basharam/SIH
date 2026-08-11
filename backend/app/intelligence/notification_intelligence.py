from sqlalchemy.orm import Session
from app.models import Team, Submission, Event

def get_workflow_notifications(db: Session, college: str, event_id: int) -> list:
    """
    Scans for incomplete workflow steps (e.g. finalized teams with missing GitHub or PPT links)
    to generate targeted reminders.
    """
    reminders = []
    
    # Query teams
    teams = db.query(Team).filter(Team.event_id == event_id).all()
    
    for t in teams:
        submission = db.query(Submission).filter(Submission.team_id == t.id).first()
        
        # Check if finalized but missing github
        if t.status in ["FINALIZED", "SUBMITTED"]:
            if not submission:
                reminders.append({
                    "team_id": t.id,
                    "team_name": t.name,
                    "status": "WARNING",
                    "reason": "Missing solution proposal details entirely. Please submit abstract."
                })
            else:
                missing = []
                if not submission.github_url:
                    missing.append("GitHub repository link")
                if not submission.ppt_url:
                    missing.append("PPT Slides template")
                if not submission.pdf_url:
                    missing.append("PDF document")
                    
                if missing:
                    reminders.append({
                        "team_id": t.id,
                        "team_name": t.name,
                        "status": "WARNING",
                        "reason": f"Finalized but missing uploads: {', '.join(missing)}."
                    })
                    
        elif t.status == "DRAFT":
            reminders.append({
                "team_id": t.id,
                "team_name": t.name,
                "status": "INFO",
                "reason": "Team is currently in DRAFT status. Please add members and finalize before deadline."
            })
            
    return reminders
