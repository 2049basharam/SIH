import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth import get_current_spoc, get_password_hash
from app.models import (
    User, SpocProfile, CoordinatorProfile, JudgeProfile, StudentProfile,
    Team, Submission, Evaluation, AuditLog, InvitationToken,
    ProblemStatement, ProblemStatementSyncLog, Event, EventSettings
)
from app.schemas import (
    CoordinatorCreateRequest, JudgeCreateRequest, UserStatusUpdateRequest,
    CoordinatorProfileOut, JudgeProfileOut, SpocProfileOut
)
from app.crud import log_action
from app.routes.intelligence import get_user_college

router = APIRouter(prefix="/spoc", tags=["spoc"])

@router.get("/dashboard")
def get_spoc_dashboard(spoc: SpocProfile = Depends(get_current_spoc), db: Session = Depends(get_db)):
    college = spoc.college
    
    # 1. Students Count
    students_count = db.query(StudentProfile).filter(StudentProfile.college == college).count()
    
    # 2. Teams count
    teams_count = db.query(Team).join(Event).filter(Event.college_name == college).count()
    
    # 3. Finalized Teams
    finalized_count = db.query(Team).join(Event).filter(
        Event.college_name == college,
        Team.status.in_(["FINALIZED", "SUBMITTED", "SHORTLISTED", "WAITLISTED"])
    ).count()
    
    # 4. Problem Statements count (global active)
    problems_count = db.query(ProblemStatement).filter(ProblemStatement.active_status == True).count()
    
    # 5. Submissions count
    submissions_count = db.query(Submission).join(Team).join(Event).filter(
        Event.college_name == college
    ).count()
    
    # 6. Judges count
    judges_count = db.query(JudgeProfile).filter(JudgeProfile.college == college).count()
    
    # 7. Coordinators count
    coordinators_count = db.query(CoordinatorProfile).filter(CoordinatorProfile.college == college).count()
    
    # 8. Evaluated Teams count (Unique teams evaluated)
    evaluated_count = db.query(Evaluation).join(Team).join(Event).filter(
        Event.college_name == college
    ).group_by(Evaluation.team_id).count()
    
    # 9. Shortlisted Teams count
    shortlisted_count = db.query(Team).join(Event).filter(
        Event.college_name == college,
        Team.selection_status == "SHORTLISTED"
    ).count()
    
    return {
        "college": college,
        "spoc_name": spoc.full_name,
        "students": students_count,
        "teams": teams_count,
        "finalized": finalized_count,
        "problems": problems_count,
        "submissions": submissions_count,
        "judges": judges_count,
        "coordinators": coordinators_count,
        "evaluated": evaluated_count,
        "shortlisted": shortlisted_count
    }

@router.get("/coordinators", response_model=List[dict])
def get_coordinators(spoc: SpocProfile = Depends(get_current_spoc), db: Session = Depends(get_db)):
    profiles = db.query(CoordinatorProfile).filter(CoordinatorProfile.college == spoc.college).all()
    res = []
    for p in profiles:
        user = p.user
        # Find active invitation token if invited
        inv_token = None
        if user.status == "INVITED":
            tok = db.query(InvitationToken).filter(InvitationToken.user_id == user.id, InvitationToken.used == False).order_by(InvitationToken.created_at.desc()).first()
            if tok and tok.expires_at > datetime.utcnow():
                inv_token = tok.token
                
        res.append({
            "id": user.id,
            "profile_id": p.id,
            "full_name": p.full_name,
            "email": user.email,
            "phone": p.phone,
            "department": p.department,
            "designation": p.designation,
            "status": user.status,
            "created_at": user.created_at,
            "invitation_token": inv_token
        })
    return res

@router.post("/coordinators")
def create_coordinator(req: CoordinatorCreateRequest, spoc: SpocProfile = Depends(get_current_spoc), db: Session = Depends(get_db)):
    # Check if email exists
    existing_user = db.query(User).filter(User.email == req.email.strip()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")
        
    # Create user in INVITED status
    new_user = User(
        email=req.email.strip().lower(),
        hashed_password=get_password_hash(uuid.uuid4().hex), # secure random temp password
        role="coordinator",
        status="INVITED",
        college=spoc.college
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create CoordinatorProfile
    new_profile = CoordinatorProfile(
        user_id=new_user.id,
        staff_id=f"STAFF_{uuid.uuid4().hex[:6].upper()}",
        full_name=req.full_name.strip(),
        department=req.department.strip(),
        designation=req.designation.strip() if req.designation else None,
        phone=req.phone.strip() if req.phone else None,
        college=spoc.college
    )
    db.add(new_profile)
    db.commit()
    
    # Generate invitation token
    token = uuid.uuid4().hex
    inv_token = InvitationToken(
        user_id=new_user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(inv_token)
    db.commit()
    
    log_action(db, spoc.user_id, "spoc", "COORDINATOR_CREATE", "User", new_user.id, f"Created coordinator {new_profile.full_name}", college=spoc.college)
    
    return {
        "id": new_user.id,
        "email": new_user.email,
        "status": new_user.status,
        "token": token
    }

@router.get("/judges", response_model=List[dict])
def get_judges(spoc: SpocProfile = Depends(get_current_spoc), db: Session = Depends(get_db)):
    profiles = db.query(JudgeProfile).filter(JudgeProfile.college == spoc.college).all()
    res = []
    for p in profiles:
        user = p.user
        
        # Count assigned teams
        assigned_teams_count = db.query(func.count(Team.id)).join(Event).filter(
            Event.college_name == spoc.college
        ).scalar() # (Keep simple: or retrieve actual judge assignments once we join the evaluation router)
        
        inv_token = None
        if user.status == "INVITED":
            tok = db.query(InvitationToken).filter(InvitationToken.user_id == user.id, InvitationToken.used == False).order_by(InvitationToken.created_at.desc()).first()
            if tok and tok.expires_at > datetime.utcnow():
                inv_token = tok.token
                
        res.append({
            "id": user.id,
            "profile_id": p.id,
            "full_name": p.full_name,
            "email": user.email,
            "phone": p.phone,
            "organization": p.organization,
            "designation": p.designation,
            "expertise": p.expertise,
            "status": user.status,
            "created_at": user.created_at,
            "invitation_token": inv_token
        })
    return res

@router.post("/judges")
def create_judge(req: JudgeCreateRequest, spoc: SpocProfile = Depends(get_current_spoc), db: Session = Depends(get_db)):
    # Check email
    existing_user = db.query(User).filter(User.email == req.email.strip()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")
        
    # Create user
    new_user = User(
        email=req.email.strip().lower(),
        hashed_password=get_password_hash(uuid.uuid4().hex),
        role="judge",
        status="INVITED",
        college=spoc.college
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create JudgeProfile
    new_profile = JudgeProfile(
        user_id=new_user.id,
        full_name=req.full_name.strip(),
        organization=req.organization.strip(),
        designation=req.designation.strip(),
        email=req.email.strip().lower(),
        phone=req.phone.strip() if req.phone else None,
        expertise=req.expertise.strip() if req.expertise else None,
        college=spoc.college
    )
    db.add(new_profile)
    db.commit()
    
    # Generate token
    token = uuid.uuid4().hex
    inv_token = InvitationToken(
        user_id=new_user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(inv_token)
    db.commit()
    
    log_action(db, spoc.user_id, "spoc", "JUDGE_CREATE", "User", new_user.id, f"Created judge {new_profile.full_name}", college=spoc.college)
    
    return {
        "id": new_user.id,
        "email": new_user.email,
        "status": new_user.status,
        "token": token
    }

@router.patch("/users/{id}/status")
def update_user_status(id: int, req: UserStatusUpdateRequest, spoc: SpocProfile = Depends(get_current_spoc), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id, User.college == spoc.college).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found under your college")
        
    if user.id == spoc.user_id:
        raise HTTPException(status_code=400, detail="You cannot modify your own status")
        
    old_status = user.status
    user.status = req.status
    db.commit()
    
    log_action(db, spoc.user_id, "spoc", "USER_STATUS_UPDATE", "User", user.id, f"Updated user status from {old_status} to {req.status}", college=spoc.college)
    return {"detail": f"User account status updated to {req.status}"}

@router.post("/users/{id}/invitation")
def reset_invitation(id: int, spoc: SpocProfile = Depends(get_current_spoc), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id, User.college == spoc.college).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.status != "INVITED":
        raise HTTPException(status_code=400, detail="Account is already active or disabled")
        
    # Invalidate old tokens
    db.query(InvitationToken).filter(InvitationToken.user_id == user.id).update({InvitationToken.used: True})
    
    # Generate new token
    token = uuid.uuid4().hex
    inv_token = InvitationToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(inv_token)
    db.commit()
    
    log_action(db, spoc.user_id, "spoc", "INVITATION_RESET", "User", user.id, "Re-issued active invitation token", college=spoc.college)
    return {"token": token}

@router.get("/problem-statements/sync-history", response_model=List[dict])
def get_sync_history(spoc: SpocProfile = Depends(get_current_spoc), db: Session = Depends(get_db)):
    logs = db.query(ProblemStatementSyncLog).order_by(ProblemStatementSyncLog.sync_date.desc()).all()
    res = []
    for l in logs:
        res.append({
            "id": l.id,
            "sync_date": l.sync_date,
            "source": l.source,
            "status": l.status,
            "fetched": l.fetched,
            "created": l.created,
            "updated": l.updated,
            "unavailable": l.unavailable,
            "duration": l.duration,
            "triggered_by": l.triggered_by,
            "error_message": l.error_message
        })
    return res

@router.post("/problem-statements/sync")
async def trigger_problem_sync(background_tasks: BackgroundTasks, spoc: SpocProfile = Depends(get_current_spoc), db: Session = Depends(get_db)):
    from app.problem_statement_service import problem_sync_service
    
    log_action(db, spoc.user_id, "spoc", "PROBLEM_SYNC_START", "ProblemStatement", None, "Triggered manual SIH problem statement sync", college=spoc.college)
    
    def run_sync_in_background():
        db_session = get_db()
        try:
            db_instance = next(db_session)
            problem_sync_service.sync_now(db_instance, triggered_by=spoc.user.email)
        except Exception as e:
            print("Background sync thread error:", e)
            
    background_tasks.add_task(run_sync_in_background)
    return {"detail": "SIH problem statement synchronization started in background"}

@router.get("/settings")
def get_spoc_settings(spoc: SpocProfile = Depends(get_current_spoc), db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.college_name == spoc.college).order_by(Event.created_at.desc()).first()
    return {
        "college": spoc.college,
        "spoc_name": spoc.full_name,
        "phone": spoc.phone,
        "active_event": event
    }

@router.put("/settings")
def update_spoc_settings(req: dict, spoc: SpocProfile = Depends(get_current_spoc), db: Session = Depends(get_db)):
    if "full_name" in req:
        spoc.full_name = req["full_name"].strip()
    if "phone" in req:
        spoc.phone = req["phone"].strip()
        
    db.commit()
    log_action(db, spoc.user_id, "spoc", "SETTINGS_UPDATE", "SpocProfile", spoc.id, "Updated SPOC profile settings", college=spoc.college)
    return {"detail": "SPOC settings updated successfully"}

@router.post("/shortlisting/approve")
def approve_nominations(spoc: SpocProfile = Depends(get_current_spoc), db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.college_name == spoc.college).order_by(Event.id.desc()).first()
    if not event:
        raise HTTPException(status_code=404, detail="No active event found")
        
    if not event.nominations_submitted:
        raise HTTPException(status_code=400, detail="No nominations have been submitted by the coordinator yet")
        
    event.nominations_approved = True
    event.status = "RESULTS_PUBLISHED"
    db.commit()
    
    # Notify all finalized and shortlisted teams
    teams = db.query(Team).filter(Team.event_id == event.id).all()
    for t in teams:
        for m in t.members:
            from app.crud import send_notification
            send_notification(
                db, 
                m.student_id, 
                "Nominations Finalized", 
                f"The final selections for your event '{event.name}' have been approved and published by the SPOC!"
            )
            
    log_action(db, spoc.user_id, "spoc", "NOMINATIONS_APPROVE", "Event", event.id, "Approved coordinator shortlist nominations and published results", college=spoc.college)
    return {"detail": "Coordinator nominations successfully approved. Selection results are now published to students."}

@router.post("/shortlisting/return")
def return_nominations(req: dict, spoc: SpocProfile = Depends(get_current_spoc), db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.college_name == spoc.college).order_by(Event.id.desc()).first()
    if not event:
        raise HTTPException(status_code=404, detail="No active event found")
        
    reason = req.get("reason", "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="A reason is required to return nominations to the coordinator")
        
    event.nominations_submitted = False
    event.nominations_approved = False
    event.nominations_return_reason = reason
    db.commit()
    
    log_action(db, spoc.user_id, "spoc", "NOMINATIONS_RETURN", "Event", event.id, reason=reason, college=spoc.college)
    return {"detail": "Nominations returned to coordinator for modification with the specified reason."}
