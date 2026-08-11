from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database import get_db
from app.auth import get_current_user, get_current_student, get_current_coordinator
from app.models import User, Team, Submission, ProblemStatement, IntelligenceAuditLog, IntelligenceResult, Event
from app.intelligence.team_intelligence import analyze_team_composition, check_name_similarity
from app.intelligence.problem_intelligence import get_problem_recommendations, explain_problem_statement, get_team_problem_compatibility
from app.intelligence.submission_intelligence import analyze_submission_readiness, trigger_background_submission_analysis
from app.intelligence.evaluation_intelligence import get_judge_evidence_assistance, detect_evaluation_anomalies
from app.intelligence.shortlist_intelligence import get_shortlisting_insights
from app.intelligence.anomaly_detection import detect_admin_anomalies
from app.intelligence.notification_intelligence import get_workflow_notifications
from app.intelligence.orchestrator import ai_provider
from app.intelligence.prompts import AnnouncementDraftResponse, ANNOUNCEMENT_SYSTEM

router = APIRouter(prefix="/intelligence", tags=["intelligence"])

# Helper schema models
class RecommendRequest(BaseModel):
    idea: str
    event_id: int

class CheckNameRequest(BaseModel):
    name: str
    event_id: int

class ExplainRequest(BaseModel):
    problem_id: int

class AnnouncementDraftRequest(BaseModel):
    rough_text: str

def get_user_college(db: Session, user: User) -> Optional[str]:
    """Helper to dynamically resolve user college context from database records."""
    if user.college:
        return user.college
    if user.role == "student" and user.student_profile:
        return user.student_profile.college
    if user.role == "coordinator" and user.coordinator_profile:
        return user.coordinator_profile.college
    if user.role == "judge" and user.judge_profile:
        return user.judge_profile.college
    if user.role == "spoc" and user.spoc_profile:
        return user.spoc_profile.college
    return None

# ----------------- Team Intelligence Endpoints -----------------

@router.get("/team/{team_id}/composition")
def get_team_composition_insights(team_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Analyze a team's composition. Accessible by team members or college staff."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    college = team.event.college_name
    user_college = get_user_college(db, current_user)
    
    # Enforce College Data Isolation
    if current_user.role != "spoc" and user_college != college:
        raise HTTPException(status_code=403, detail="Access denied. Different college context.")
        
    # Enforce Student Team Membership limits
    if current_user.role == "student":
        is_member = any(m.student.user_id == current_user.id for m in team.members)
        if not is_member and team.leader.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied. You are not a member of this team.")
            
    return analyze_team_composition(db, team_id, current_user.id, current_user.role)

@router.post("/team/check-name")
def get_team_name_similarity(req: CheckNameRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Checks if team name is similar to existing ones. Accessible during registration."""
    event = db.query(Event).filter(Event.id == req.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    user_college = get_user_college(db, current_user)
    if current_user.role != "spoc" and user_college != event.college_name:
        raise HTTPException(status_code=403, detail="Access denied. College mismatch.")
        
    return check_name_similarity(db, req.event_id, req.name)

# ----------------- Problem Intelligence Endpoints -----------------

@router.post("/problems/recommend")
def recommend_problems(req: RecommendRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns semantic matching problem recommendations based on solution idea."""
    event = db.query(Event).filter(Event.id == req.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    user_college = get_user_college(db, current_user)
    if current_user.role != "spoc" and user_college != event.college_name:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    return get_problem_recommendations(
        db, event.college_name, req.event_id, req.idea, current_user.id, current_user.role
    )

@router.get("/problems/explain/{problem_id}")
def explain_problem(problem_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Explain problem details including expected approaches and difficulty analysis."""
    problem = db.query(ProblemStatement).filter(ProblemStatement.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem statement not found")
        
    return explain_problem_statement(db, problem_id, current_user.id, current_user.role)

@router.get("/problems/compatibility/{team_id}/{problem_id}")
def check_compatibility(team_id: int, problem_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Compare team skills with problem statement complexity metrics."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    user_college = get_user_college(db, current_user)
    if current_user.role != "spoc" and user_college != team.event.college_name:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    return get_team_problem_compatibility(db, team_id, problem_id, current_user.id, current_user.role)

# ----------------- Submission Intelligence Endpoints -----------------

@router.post("/submission/{submission_id}/analyze")
def trigger_submission_analysis(submission_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Starts background analysis task for submission readiness check."""
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    user_college = get_user_college(db, current_user)
    if current_user.role != "spoc" and user_college != sub.team.event.college_name:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    trigger_background_submission_analysis(db, submission_id, current_user.id, current_user.role)
    return {"status": "SUCCESS", "message": "Background submission analysis triggered successfully."}

@router.get("/submission/{submission_id}/readiness")
def get_submission_readiness(submission_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve cache or run a quick sync analysis on submission readiness."""
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    user_college = get_user_college(db, current_user)
    if current_user.role != "spoc" and user_college != sub.team.event.college_name:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    return analyze_submission_readiness(db, submission_id, current_user.id, current_user.role)

# ----------------- Judge Intelligence Endpoints -----------------

@router.get("/evaluation/{team_id}/assistance")
def get_judge_rubric_evidence(team_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """AI Evaluation Assistant: pulls evidence found matching criteria. Judges or coordinators only."""
    if current_user.role not in ["judge", "coordinator", "spoc"]:
        raise HTTPException(status_code=403, detail="Unprivileged access.")
        
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    user_college = get_user_college(db, current_user)
    if current_user.role != "spoc" and user_college != team.event.college_name:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    return get_judge_evidence_assistance(db, team_id, current_user.id, current_user.role)

@router.get("/evaluation/{event_id}/anomalies")
def get_evaluation_grade_anomalies(event_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Detect evaluation standard deviation outliers and grade inconsistencies."""
    if current_user.role not in ["coordinator", "spoc"]:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    user_college = get_user_college(db, current_user)
    if current_user.role != "spoc" and user_college != event.college_name:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    return detect_evaluation_anomalies(db, event_id, current_user.id, current_user.role)

# ----------------- Coordinator / SPOC Dashboard Insights -----------------

@router.get("/coordinator/overview/{event_id}")
def get_coordinator_intelligence(event_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Coordinator Intelligence Center: returns anomalies list and missing-upload reminder alerts."""
    if current_user.role not in ["coordinator", "spoc"]:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    user_college = get_user_college(db, current_user)
    if current_user.role != "spoc" and user_college != event.college_name:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    anomalies = detect_evaluation_anomalies(db, event_id, current_user.id, current_user.role)
    reminders = get_workflow_notifications(db, event.college_name, event_id)
    admin_alerts = detect_admin_anomalies(db, event.college_name, event_id)
    
    # Combined dashboard data
    return {
        "anomalies": anomalies.get("anomalies_detected", []),
        "risk_index": anomalies.get("risk_index", 0.0),
        "summary": anomalies.get("summary", ""),
        "reminders": reminders,
        "admin_alerts": admin_alerts
    }

@router.get("/spoc/overview")
def get_spoc_intelligence(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """SPOC Intelligence Center: aggregates stats and retrieves audit logs."""
    if current_user.role != "spoc":
        raise HTTPException(status_code=403, detail="Only SPOCs can access college-wide intelligence.")
        
    college = get_user_college(db, current_user)
    if not college:
        raise HTTPException(status_code=400, detail="SPOC college context not found.")
        
    # Department analytics
    events = db.query(Event).filter(Event.college_name == college).all()
    event_ids = [e.id for e in events]
    
    # Basic statistics
    teams_count = db.query(Team).filter(Team.event_id.in_(event_ids)).count()
    submissions_count = db.query(Submission).join(Team).filter(Team.event_id.in_(event_ids)).count()
    
    # Fetch all AI Audit Logs
    audit_logs = db.query(IntelligenceAuditLog).filter(
        IntelligenceAuditLog.college == college
    ).order_by(IntelligenceAuditLog.created_at.desc()).limit(100).all()
    
    return {
        "stats": {
            "teams": teams_count,
            "submissions": submissions_count,
        },
        "audit_logs": audit_logs
    }

@router.get("/shortlisting/insights/{event_id}")
def get_shortlist_explainers(event_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Explain why top teams ranked highly based on evaluation consistency."""
    if current_user.role not in ["coordinator", "spoc"]:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    user_college = get_user_college(db, current_user)
    if current_user.role != "spoc" and user_college != event.college_name:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    return get_shortlisting_insights(db, event_id, current_user.id, current_user.role)

@router.post("/announcement/draft")
def draft_announcement(req: AnnouncementDraftRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generates a professional announcement copy from rough notes. Human review mandatory."""
    if current_user.role not in ["coordinator", "spoc"]:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    prompt = f"Convert these rough notes into a professional hackathon announcement:\n'{req.rough_text}'"
    try:
        res = ai_provider.generate_structured(
            prompt,
            response_schema=AnnouncementDraftResponse,
            system_instruction=ANNOUNCEMENT_SYSTEM
        )
        return res.model_dump()
    except Exception as e:
        return {"draft": f"Important Announcement:\n\n{req.rough_text}\n\n(Drafting error: {e})"}

@router.get("/audit")
def get_audit_trail(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Gets AI execution logs. SPOC exclusive."""
    if current_user.role != "spoc":
        raise HTTPException(status_code=403, detail="Only SPOCs can inspect intelligence audit trails.")
        
    user_college = get_user_college(db, current_user)
    logs = db.query(IntelligenceAuditLog).filter(
        IntelligenceAuditLog.college == user_college
    ).order_by(IntelligenceAuditLog.created_at.desc()).all()
    
    return logs
