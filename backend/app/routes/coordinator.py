from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List, Optional
import io
import pandas as pd
import json

from app.database import get_db
from app.auth import get_current_coordinator, get_password_hash, get_current_user
from app.models import (
    User, StudentProfile, CoordinatorProfile, JudgeProfile, Event, EventSettings,
    Team, TeamMember, ProblemStatement, TeamProblemStatement, Submission,
    Evaluation, EvaluationCriteria, EvaluationScore, Announcement, Notification, AuditLog
)
from app.schemas import (
    CoordinatorProfileOut, EventOut, EventCreate, EventSettingsCreate,
    TeamDetailOut, TeamOut, ProblemStatementCreate, ProblemStatementOut,
    JudgeProfileCreate, JudgeProfileOut, EvaluationOut, AnnouncementCreate,
    AnnouncementOut, AuditLogOut, CoordinatorStatsOut, ShortlistSubmitRequest,
    EvaluationCriteriaCreate, EvaluationCriteriaOut, StudentProfileOut
)
from app.crud import log_action, send_notification
from app.routes.intelligence import get_user_college

router = APIRouter(prefix="/coordinator", tags=["coordinator"])

@router.get("/profile", response_model=CoordinatorProfileOut)
def get_profile(coordinator: CoordinatorProfile = Depends(get_current_coordinator)):
    return coordinator

@router.get("/settings", response_model=EventOut)
def get_settings(db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    event = db.query(Event).filter(Event.college_name == coord.college).order_by(Event.id.desc()).first()
    if not event:
        raise HTTPException(status_code=404, detail="No event configured. Please create one.")
    return event

@router.put("/settings", response_model=EventOut)
def update_settings(req: EventCreate, db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    event = db.query(Event).filter(Event.college_name == coord.college).order_by(Event.id.desc()).first()
    if not event:
        # Create new event
        event = Event(
            name=req.name,
            academic_year=req.academic_year,
            college_name=coord.college,
            description=req.description,
            registration_start=req.registration_start,
            registration_end=req.registration_end,
            team_finalization_deadline=req.team_finalization_deadline,
            problem_selection_deadline=req.problem_selection_deadline,
            submission_deadline=req.submission_deadline,
            evaluation_start=req.evaluation_start,
            evaluation_end=req.evaluation_end,
            shortlisting_date=req.shortlisting_date,
            status="DRAFT"
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        
        settings = EventSettings(
            event_id=event.id,
            team_size=req.settings.team_size,
            min_female_members=req.settings.min_female_members,
            same_college=req.settings.same_college,
            multi_team_membership_allowed=req.settings.multi_team_membership_allowed,
            team_leader_required=req.settings.team_leader_required,
            team_name_unique=req.settings.team_name_unique,
            team_name_no_institute=req.settings.team_name_no_institute,
            problem_statements_limit=req.settings.problem_statements_limit,
            shortlist_size=req.settings.shortlist_size,
            waitlist_size=req.settings.waitlist_size,
            evaluation_method=req.settings.evaluation_method
        )
        db.add(settings)
        db.commit()
    else:
        # Update existing
        event.name = req.name
        event.academic_year = req.academic_year
        event.college_name = coord.college
        event.description = req.description
        event.registration_start = req.registration_start
        event.registration_end = req.registration_end
        event.team_finalization_deadline = req.team_finalization_deadline
        event.problem_selection_deadline = req.problem_selection_deadline
        event.submission_deadline = req.submission_deadline
        event.evaluation_start = req.evaluation_start
        event.evaluation_end = req.evaluation_end
        event.shortlisting_date = req.shortlisting_date
        
        # update settings
        if event.settings:
            event.settings.team_size = req.settings.team_size
            event.settings.min_female_members = req.settings.min_female_members
            event.settings.same_college = req.settings.same_college
            event.settings.multi_team_membership_allowed = req.settings.multi_team_membership_allowed
            event.settings.team_leader_required = req.settings.team_leader_required
            event.settings.team_name_unique = req.settings.team_name_unique
            event.settings.team_name_no_institute = req.settings.team_name_no_institute
            event.settings.problem_statements_limit = req.settings.problem_statements_limit
            event.settings.shortlist_size = req.settings.shortlist_size
            event.settings.waitlist_size = req.settings.waitlist_size
            event.settings.evaluation_method = req.settings.evaluation_method
            
        db.commit()
        db.refresh(event)
        
    log_action(db, coord.user_id, "coordinator", "SETTINGS_CHANGE", "Event", event.id, "Updated event settings", college=coord.college)
    return event

@router.put("/settings/status", response_model=EventOut)
def update_event_status(status_str: str, db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    event = db.query(Event).filter(Event.college_name == coord.college).order_by(Event.id.desc()).first()
    if not event:
        raise HTTPException(status_code=404, detail="No event configured")
        
    valid_statuses = [
        "DRAFT", "REGISTRATION_OPEN", "TEAM_FORMATION", "TEAM_FINALIZATION", 
        "PROBLEM_SELECTION", "SUBMISSION_OPEN", "SUBMISSION_CLOSED", 
        "EVALUATION", "SHORTLISTING", "RESULTS_PUBLISHED", "COMPLETED"
    ]
    if status_str not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid event status. Must be one of {valid_statuses}")
        
    STATE_TRANSITIONS = {
        "DRAFT": ["REGISTRATION_OPEN"],
        "REGISTRATION_OPEN": ["REGISTRATION_CLOSED", "TEAM_FORMATION", "TEAM_FINALIZATION"],
        "TEAM_FORMATION": ["TEAM_FINALIZATION"],
        "TEAM_FINALIZATION": ["PROBLEM_SELECTION", "REGISTRATION_OPEN"],
        "PROBLEM_SELECTION": ["SUBMISSION_OPEN", "TEAM_FINALIZATION"],
        "SUBMISSION_OPEN": ["SUBMISSION_CLOSED"],
        "SUBMISSION_CLOSED": ["EVALUATION", "SUBMISSION_OPEN"],
        "EVALUATION": ["SHORTLISTING", "SUBMISSION_CLOSED"],
        "SHORTLISTING": ["RESULTS_PUBLISHED", "EVALUATION"],
        "RESULTS_PUBLISHED": ["COMPLETED", "SHORTLISTING"],
        "COMPLETED": []
    }
    
    current_status = event.status
    if status_str != current_status and current_status in STATE_TRANSITIONS:
        allowed_next = STATE_TRANSITIONS[current_status]
        if status_str not in allowed_next and status_str != "DRAFT":
            # Prevent skipping forward states
            try:
                curr_idx = valid_statuses.index(current_status)
                target_idx = valid_statuses.index(status_str)
                if target_idx > curr_idx + 1:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Invalid workflow state jump from '{current_status}' to '{status_str}'. Skipping required stages is blocked."
                    )
            except ValueError:
                pass

    event.status = status_str
    db.commit()
    db.refresh(event)
    
    log_action(db, coord.user_id, "coordinator", "STATUS_CHANGE", "Event", event.id, f"Changed event status from {current_status} to {status_str}", college=coord.college)
    return event

@router.get("/dashboard", response_model=CoordinatorStatsOut)
def get_dashboard_stats(db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    # Calculate counts
    total_students = db.query(StudentProfile).filter(StudentProfile.college == coord.college).count()
    teams_created = db.query(Team).join(Event).filter(Event.college_name == coord.college).count()
    teams_finalized = db.query(Team).join(Event).filter(Event.college_name == coord.college, Team.status == "FINALIZED").count()
    incomplete_teams = db.query(Team).join(Event).filter(Event.college_name == coord.college, Team.status == "DRAFT").count()
    
    # Teams with selected problems
    teams_with_problems = db.query(TeamProblemStatement.team_id).join(Team).join(Event).filter(Event.college_name == coord.college).distinct().count()
    
    # Submissions completed/pending
    submissions_completed = db.query(Submission).join(Team).join(Event).filter(Event.college_name == coord.college, Submission.status == "FINAL").count()
    submissions_pending = teams_created - submissions_completed
    if submissions_pending < 0:
        submissions_pending = 0
        
    # Hackathon and judging statistics
    participating_teams = db.query(Team).join(Event).filter(Event.college_name == coord.college, Team.status.in_(["FINALIZED", "SUBMITTED", "SHORTLISTED", "WAITLISTED", "NOT_SELECTED"])).count()
    evaluated_teams = db.query(Evaluation).join(Team).join(Event).filter(Event.college_name == coord.college, Evaluation.submitted == True).distinct(Evaluation.team_id).count()
    pending_evaluations = participating_teams - evaluated_teams
    if pending_evaluations < 0:
        pending_evaluations = 0
        
    # Shortlisting statistics
    shortlisted_teams = db.query(Team).join(Event).filter(Event.college_name == coord.college, Team.selection_status == "SHORTLISTED").count()
    waitlisted_teams = db.query(Team).join(Event).filter(Event.college_name == coord.college, Team.selection_status == "WAITLISTED").count()
    not_selected_teams = db.query(Team).join(Event).filter(Event.college_name == coord.college, Team.selection_status == "NOT_SELECTED").count()
    
    return CoordinatorStatsOut(
        total_students=total_students,
        teams_created=teams_created,
        teams_finalized=teams_finalized,
        incomplete_teams=incomplete_teams,
        teams_with_problems=teams_with_problems,
        submissions_completed=submissions_completed,
        submissions_pending=submissions_pending,
        participating_teams=participating_teams,
        evaluated_teams=evaluated_teams,
        pending_evaluations=pending_evaluations,
        shortlisted_teams=shortlisted_teams,
        waitlisted_teams=waitlisted_teams,
        not_selected_teams=not_selected_teams
    )

@router.get("/students", response_model=List[StudentProfileOut])
def list_students(
    department: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    coord: CoordinatorProfile = Depends(get_current_coordinator)
):
    query = db.query(StudentProfile).filter(StudentProfile.college == coord.college)
    if department:
        query = query.filter(StudentProfile.department == department)
    if branch:
        query = query.filter(StudentProfile.branch == branch)
    if year:
        query = query.filter(StudentProfile.year == year)
    return query.all()

@router.get("/teams")
def list_teams(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    selection_filter: Optional[str] = Query(None, alias="selection_status"),
    department: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    db: Session = Depends(get_db),
    coord: CoordinatorProfile = Depends(get_current_coordinator)
):
    query = db.query(Team).join(Event).filter(Event.college_name == coord.college)
    
    # Search filter
    if search:
        query = query.join(Team.leader, isouter=True).filter(
            (Team.name.ilike(f"%{search}%")) |
            (Team.status.ilike(f"%{search}%")) |
            (StudentProfile.full_name.ilike(f"%{search}%")) |
            (StudentProfile.student_id.ilike(f"%{search}%"))
        )
        
    if status_filter:
        query = query.filter(Team.status == status_filter)
        
    if selection_filter:
        query = query.filter(Team.selection_status == selection_filter)
        
    if department:
        query = query.join(Team.leader).filter(StudentProfile.department == department)
        
    total_count = query.count()
    
    # Pagination
    offset = (page - 1) * limit
    teams = query.offset(offset).limit(limit).all()
    
    team_list = []
    for t in teams:
        members_count = db.query(TeamMember).filter(TeamMember.team_id == t.id).count()
        
        # Count female members
        female_count = db.query(TeamMember).join(StudentProfile).filter(
            TeamMember.team_id == t.id,
            StudentProfile.gender == "F"
        ).count()
        
        # Selected problem
        probs = db.query(TeamProblemStatement).filter(TeamProblemStatement.team_id == t.id).all()
        prob_codes = [p.problem_statement.problem_id for p in probs]
        
        team_list.append({
            "id": t.id,
            "name": t.name,
            "leader_name": t.leader.full_name if t.leader else "N/A",
            "leader_roll": t.leader.student_id if t.leader else "N/A",
            "members_count": members_count,
            "female_count": female_count,
            "department": t.leader.department if t.leader else "N/A",
            "problems": prob_codes,
            "status": t.status,
            "average_score": t.average_score,
            "selection_status": t.selection_status
        })
        
    return {
        "teams": team_list,
        "total": total_count,
        "page": page,
        "limit": limit
    }

@router.get("/teams/{id}", response_model=TeamDetailOut)
def get_team_detail(id: int, db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    team = db.query(Team).join(Event).filter(Team.id == id, Event.college_name == coord.college).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found or unauthorized")
    return team

@router.post("/teams/{id}/unlock", response_model=TeamDetailOut)
def unlock_team(id: int, req: dict, db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    team = db.query(Team).join(Event).filter(Team.id == id, Event.college_name == coord.college).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found or unauthorized")
        
    reason = req.get("reason", "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="A reason is required to unlock a team")
        
    previous_status = team.status
    team.status = "ADMIN_UNLOCKED"
    db.commit()
    db.refresh(team)
    
    # Audit log
    log_action(
        db,
        coord.user_id,
        "coordinator",
        "TEAM_UNLOCK",
        "Team",
        team.id,
        reason=reason,
        metadata_json={"previous_status": previous_status, "new_status": "ADMIN_UNLOCKED"}
    )
    
    # Notify leader and members
    members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
    for m in members:
        send_notification(
            db,
            m.student_id,
            "Team Unlocked by Admin",
            f"Your team '{team.name}' has been unlocked by coordinator {coord.full_name}. Reason: {reason}. Please re-verify and finalize details."
        )
        
    return team

# Problem Statements
@router.post("/problems", response_model=ProblemStatementOut)
def create_problem(req: ProblemStatementCreate, db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    existing = db.query(ProblemStatement).filter(ProblemStatement.problem_id == req.problem_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Problem statement ID {req.problem_id} already exists")
        
    prob = ProblemStatement(
        problem_id=req.problem_id,
        title=req.title,
        organization=req.organization,
        theme=req.theme,
        category=req.category,
        description=req.description,
        expected_solution=req.expected_solution,
        technology_area=req.technology_area,
        active_status=req.active_status
    )
    db.add(prob)
    db.commit()
    db.refresh(prob)
    
    log_action(db, coord.user_id, "coordinator", "PROBLEM_CREATE", "ProblemStatement", prob.id, f"Created problem {prob.problem_id}")
    return prob

@router.put("/problems/{id}", response_model=ProblemStatementOut)
def update_problem(id: int, req: ProblemStatementCreate, db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    prob = db.query(ProblemStatement).filter(ProblemStatement.id == id).first()
    if not prob:
        raise HTTPException(status_code=404, detail="Problem statement not found")
        
    prob.problem_id = req.problem_id
    prob.title = req.title
    prob.organization = req.organization
    prob.theme = req.theme
    prob.category = req.category
    prob.description = req.description
    prob.expected_solution = req.expected_solution
    prob.technology_area = req.technology_area
    prob.active_status = req.active_status
    
    db.commit()
    db.refresh(prob)
    
    log_action(db, coord.user_id, "coordinator", "PROBLEM_UPDATE", "ProblemStatement", prob.id, f"Updated problem {prob.problem_id}")
    return prob

# Judge Management
@router.get("/judges", response_model=List[JudgeProfileOut])
def list_judges(db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    return db.query(JudgeProfile).filter(JudgeProfile.college == coord.college).all()

@router.post("/judges", response_model=JudgeProfileOut)
def create_judge(req: JudgeProfileCreate, db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only the college SPOC is authorized to create judge accounts."
    )

# Rubrics/Evaluation Criteria
@router.get("/criteria", response_model=List[EvaluationCriteriaOut])
def get_criteria(db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    event = db.query(Event).filter(Event.college_name == coord.college).order_by(Event.id.desc()).first()
    if not event:
        return []
    return db.query(EvaluationCriteria).filter(EvaluationCriteria.event_id == event.id).order_by(EvaluationCriteria.order_num).all()

@router.post("/criteria", response_model=EvaluationCriteriaOut)
def create_criterion(req: EvaluationCriteriaCreate, db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    event = db.query(Event).filter(Event.college_name == coord.college).order_by(Event.id.desc()).first()
    if not event:
        raise HTTPException(status_code=400, detail="Create an event settings configuration first")
        
    crit = EvaluationCriteria(
        event_id=event.id,
        name=req.name,
        description=req.description,
        max_score=req.max_score,
        weight=req.weight,
        order_num=req.order_num
    )
    db.add(crit)
    db.commit()
    db.refresh(crit)
    
    log_action(db, coord.user_id, "coordinator", "CRITERIA_CREATE", "EvaluationCriteria", crit.id, f"Created evaluation criterion {crit.name}")
    return crit

# Shortlisting workflow
@router.get("/shortlisting")
def get_proposed_ranking(db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    event = db.query(Event).filter(Event.college_name == coord.college).order_by(Event.id.desc()).first()
    if not event:
        raise HTTPException(status_code=404, detail="No active event found")
        
    # Query all participating teams under this college
    teams = db.query(Team).join(Event).filter(
        Event.college_name == coord.college,
        Team.status.in_(["FINALIZED", "SUBMITTED", "SHORTLISTED", "WAITLISTED", "NOT_SELECTED"])
    ).all()
    
    ranking = []
    for t in teams:
        # Calculate average score across all judges' submitted evaluations
        evals = db.query(Evaluation).filter(
            Evaluation.team_id == t.id,
            Evaluation.submitted == True
        ).all()
        
        avg_score = 0.0
        if evals:
            avg_score = sum(e.total_score for e in evals) / len(evals)
            # Cache average score on team model
            t.average_score = round(avg_score, 2)
            db.commit()
            
        probs = db.query(TeamProblemStatement).filter(TeamProblemStatement.team_id == t.id).all()
        prob_ids = [p.problem_statement.problem_id for p in probs]
        
        ranking.append({
            "team_id": t.id,
            "name": t.name,
            "problems": prob_ids,
            "average_score": t.average_score,
            "selection_status": t.selection_status,
            "status": t.status,
            "eval_count": len(evals)
        })
        
    # Sort ranking list by score descending
    ranking.sort(key=lambda x: x["average_score"], reverse=True)
    
    # Add Rank numbering
    for idx, item in enumerate(ranking):
        item["rank"] = idx + 1
        
    return {
        "event_id": event.id,
        "event_status": event.status,
        "ranking": ranking
    }

@router.post("/shortlisting")
def submit_shortlist_decisions(req: ShortlistSubmitRequest, db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    event = db.query(Event).filter(Event.college_name == coord.college).order_by(Event.id.desc()).first()
    if not event:
        raise HTTPException(status_code=404, detail="No active event found")
        
    for act in req.actions:
        team = db.query(Team).join(Event).filter(Team.id == act.team_id, Event.college_name == coord.college).first()
        if not team:
            continue
            
        previous_sel = team.selection_status
        team.selection_status = act.selection_status
        team.selection_reason = act.reason
        
        # Map team states based on shortlisting
        if act.selection_status == "SHORTLISTED":
            team.status = "SHORTLISTED"
        elif act.selection_status == "WAITLISTED":
            team.status = "WAITLISTED"
        elif act.selection_status == "NOT_SELECTED":
            team.status = "NOT_SELECTED"
            
        db.commit()
        
        log_action(
            db,
            coord.user_id,
            "coordinator",
            "TEAM_SELECTION",
            "Team",
            team.id,
            reason=act.reason,
            metadata_json={"previous_status": previous_sel, "new_status": act.selection_status}
        )
        
        # Notify team members
        members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
        for m in members:
            send_notification(
                db,
                m.student_id,
                f"SIH Selection Status Updated",
                f"Your team '{team.name}' selection status is now: {act.selection_status}."
            )
            
    return {"detail": "Shortlisting and waitlisting decisions updated successfully"}

# Announcements
@router.post("/announcements", response_model=AnnouncementOut)
def create_announcement(req: AnnouncementCreate, db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    event = db.query(Event).filter(Event.college_name == coord.college).order_by(Event.id.desc()).first()
    if not event:
        raise HTTPException(status_code=400, detail="Create an event first")
        
    ann = Announcement(
        event_id=event.id,
        title=req.title,
        message=req.message,
        priority=req.priority,
        audience=req.audience,
        audience_metadata=req.audience_metadata,
        college=coord.college,
        publish_time=datetime.utcnow(),
        expiry_time=req.expiry_time
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    
    log_action(db, coord.user_id, "coordinator", "ANNOUNCEMENT_PUBLISH", "Announcement", ann.id, f"Published: {ann.title}", college=coord.college)
    return ann

@router.get("/announcements", response_model=List[AnnouncementOut])
def list_announcements(db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    event = db.query(Event).filter(Event.college_name == coord.college).order_by(Event.id.desc()).first()
    if not event:
        return []
    return db.query(Announcement).filter(
        Announcement.event_id == event.id,
        (Announcement.college == None) | (Announcement.college == coord.college)
    ).order_by(Announcement.id.desc()).all()

# Audit logs
@router.get("/audit-logs", response_model=List[AuditLogOut])
def list_audit_logs(db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    return db.query(AuditLog).filter(AuditLog.college == coord.college).order_by(AuditLog.id.desc()).all()

# Reports exporter
@router.get("/reports")
def download_reports(
    type: str = "all-teams",
    db: Session = Depends(get_db),
    coord: CoordinatorProfile = Depends(get_current_coordinator)
):
    output = io.BytesIO()
    
    if type == "all-teams":
        teams = db.query(Team).join(Event).filter(Event.college_name == coord.college).all()
        data = []
        for t in teams:
            members = db.query(TeamMember).filter(TeamMember.team_id == t.id).all()
            mem_names = ", ".join([m.student.full_name for m in members])
            probs = db.query(TeamProblemStatement).filter(TeamProblemStatement.team_id == t.id).all()
            prob_ids = ", ".join([p.problem_statement.problem_id for p in probs])
            
            data.append({
                "Team ID": t.id,
                "Team Name": t.name,
                "Leader": t.leader.full_name if t.leader else "",
                "Department": t.leader.department if t.leader else "",
                "Member Count": len(members),
                "Members": mem_names,
                "Selected Problems": prob_ids,
                "Status": t.status,
                "Average Score": t.average_score,
                "Selection": t.selection_status
            })
        df = pd.DataFrame(data)
        
    elif type == "students":
        students = db.query(StudentProfile).filter(StudentProfile.college == coord.college).all()
        data = []
        for s in students:
            # Check if student is in a team
            mem = db.query(TeamMember).filter(TeamMember.student_id == s.id).first()
            team_name = mem.team.name if mem else "No Team"
            
            data.append({
                "Student ID": s.student_id,
                "Full Name": s.full_name,
                "Gender": s.gender,
                "Email": s.user.email,
                "Phone": s.phone,
                "Department": s.department,
                "Branch": s.branch,
                "Year": s.year,
                "Team": team_name
            })
        df = pd.DataFrame(data)
        
    elif type == "shortlisted":
        teams = db.query(Team).join(Event).filter(Event.college_name == coord.college, Team.selection_status == "SHORTLISTED").all()
        data = []
        for t in teams:
            members = db.query(TeamMember).filter(TeamMember.team_id == t.id).all()
            mem_names = ", ".join([m.student.full_name for m in members])
            data.append({
                "Team ID": t.id,
                "Team Name": t.name,
                "Leader": t.leader.full_name if t.leader else "",
                "Department": t.leader.department if t.leader else "",
                "Average Score": t.average_score,
                "Members": mem_names
            })
        df = pd.DataFrame(data)
    elif type == "final-report":
        event = db.query(Event).filter(Event.college_name == coord.college).order_by(Event.id.desc()).first()
        if not event:
            df = pd.DataFrame([{"Error": "No active event found"}])
        else:
            summary_data = [
                {"Section": "EVENT INFO", "Metric": "Event Name", "Value": event.name},
                {"Section": "EVENT INFO", "Metric": "Academic Year", "Value": event.academic_year},
                {"Section": "EVENT INFO", "Metric": "College", "Value": event.college_name},
                {"Section": "EVENT INFO", "Metric": "Status", "Value": event.status},
                {"Section": "EVENT INFO", "Metric": "Nominations Approved", "Value": str(event.nominations_approved)},
                {"Section": "PARTICIPATION", "Metric": "Total Students Registered", "Value": str(db.query(StudentProfile).filter(StudentProfile.college == coord.college).count())},
                {"Section": "PARTICIPATION", "Metric": "Total Teams Created", "Value": str(db.query(Team).filter(Team.event_id == event.id).count())},
                {"Section": "PARTICIPATION", "Metric": "Teams Finalized", "Value": str(db.query(Team).filter(Team.event_id == event.id, Team.status.in_(["FINALIZED", "SUBMITTED", "SHORTLISTED", "WAITLISTED"])).count())},
                {"Section": "PARTICIPATION", "Metric": "Submissions", "Value": str(db.query(Submission).join(Team).filter(Team.event_id == event.id).count())},
                {"Section": "PARTICIPATION", "Metric": "Judges Assigned", "Value": str(db.query(JudgeProfile).filter(JudgeProfile.college == coord.college).count())},
            ]
            students = db.query(StudentProfile).filter(StudentProfile.college == coord.college).all()
            depts = sorted(list(set(s.department for s in students if s.department)))
            for dept in depts:
                t_count = db.query(Team).join(StudentProfile, Team.leader_id == StudentProfile.id).filter(Team.event_id == event.id, StudentProfile.department == dept).count()
                s_count = db.query(StudentProfile).filter(StudentProfile.college == coord.college, StudentProfile.department == dept).count()
                summary_data.append({"Section": f"DEPARTMENT - {dept}", "Metric": "Students Count", "Value": str(s_count)})
                summary_data.append({"Section": f"DEPARTMENT - {dept}", "Metric": "Teams Count", "Value": str(t_count)})
            shortlisted = db.query(Team).filter(Team.event_id == event.id, Team.selection_status == "SHORTLISTED").all()
            for idx, t in enumerate(shortlisted):
                summary_data.append({"Section": "SHORTLISTED NOMINATIONS", "Metric": f"Nomination #{idx+1}", "Value": f"{t.name} (Score: {t.average_score})"})
            df = pd.DataFrame(summary_data)
    else:
        df = pd.DataFrame([{"Message": "Invalid report type requested"}])
        
    # Write to CSV
    csv_str = df.to_csv(index=False)
    
    # Return as StreamingResponse
    response = StreamingResponse(
        iter([csv_str]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=sih_report_{type}_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )
    return response

@router.post("/shortlisting/submit")
def submit_nominations_to_spoc(db: Session = Depends(get_db), coord: CoordinatorProfile = Depends(get_current_coordinator)):
    event = db.query(Event).filter(Event.college_name == coord.college).order_by(Event.id.desc()).first()
    if not event:
        raise HTTPException(status_code=404, detail="No active event found")
        
    event.nominations_submitted = True
    event.nominations_return_reason = None
    db.commit()
    
    log_action(db, coord.user_id, "coordinator", "NOMINATIONS_SUBMIT", "Event", event.id, "Submitted shortlisted nominations to SPOC", college=coord.college)
    return {"detail": "Nominations successfully submitted to the college SPOC for review."}

@router.post("/evaluations/{evaluation_id}/unlock")
def unlock_evaluation(evaluation_id: int, req: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["coordinator", "spoc"]:
        raise HTTPException(status_code=403, detail="Unprivileged access role.")
        
    user_college = get_user_college(db, current_user)
    eval_rec = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not eval_rec:
        raise HTTPException(status_code=404, detail="Evaluation scorecard not found")
        
    if eval_rec.judge.college != user_college:
        raise HTTPException(status_code=403, detail="Access denied. Different college context.")
        
    reason = req.get("reason", "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="A reason is required to unlock an evaluation scorecard")
        
    eval_rec.submitted = False
    db.commit()
    
    log_action(db, current_user.id, current_user.role, "EVALUATION_UNLOCK", "Evaluation", eval_rec.id, reason=reason, college=user_college)
    return {"detail": "Evaluation scorecard successfully unlocked for the judge to re-score."}

@router.post("/evaluations/{evaluation_id}/correct")
def correct_evaluation_scores(evaluation_id: int, req: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["coordinator", "spoc"]:
        raise HTTPException(status_code=403, detail="Unprivileged access role.")
        
    user_college = get_user_college(db, current_user)
    eval_rec = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not eval_rec:
        raise HTTPException(status_code=404, detail="Evaluation scorecard not found")
        
    if eval_rec.judge.college != user_college:
        raise HTTPException(status_code=403, detail="Access denied. Different college.")
        
    reason = req.get("reason", "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="A reason is required to correct evaluation scores")
        
    scores_req = req.get("scores", [])
    overall_comments = req.get("overall_comments", eval_rec.overall_comments)
    
    if not scores_req:
        raise HTTPException(status_code=400, detail="Scores details are required for correction")
        
    total_score = 0.0
    scores_to_add = []
    
    for s in scores_req:
        crit_id = s.get("criteria_id")
        score_val = s.get("score")
        crit = db.query(EvaluationCriteria).filter(EvaluationCriteria.id == crit_id).first()
        if not crit:
            raise HTTPException(status_code=404, detail=f"Criteria ID {crit_id} not found")
            
        if score_val < 0 or score_val > crit.max_score:
            raise HTTPException(status_code=400, detail=f"Score for criteria '{crit.name}' must be between 0 and {crit.max_score}")
            
        weighted = score_val * crit.weight
        total_score += weighted
        scores_to_add.append((crit_id, score_val))
        
    old_total = eval_rec.total_score
    eval_rec.overall_comments = overall_comments
    eval_rec.total_score = total_score
    eval_rec.submitted = True
    eval_rec.updated_at = datetime.utcnow()
    
    db.query(EvaluationScore).filter(EvaluationScore.evaluation_id == eval_rec.id).delete()
    for cid, sc in scores_to_add:
        score_rec = EvaluationScore(evaluation_id=eval_rec.id, criteria_id=cid, score=sc)
        db.add(score_rec)
        
    db.commit()
    
    all_evals = db.query(Evaluation).filter(Evaluation.team_id == eval_rec.team_id, Evaluation.submitted == True).all()
    if all_evals:
        eval_rec.team.average_score = round(sum(e.total_score for e in all_evals) / len(all_evals), 2)
        db.commit()
        
    log_action(db, current_user.id, current_user.role, "EVALUATION_CORRECT", "Evaluation", eval_rec.id, reason=reason, metadata_json={"old_total_score": old_total, "new_total_score": total_score}, college=user_college)
    return {"detail": "Evaluation scorecard scores corrected successfully."}

@router.get("/analytics/departments")
def get_department_analytics(event_id: Optional[int] = Query(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["coordinator", "spoc"]:
        raise HTTPException(status_code=403, detail="Access denied. Unprivileged role.")
        
    user_college = get_user_college(db, current_user)
    if event_id:
        event = db.query(Event).filter(Event.id == event_id, Event.college_name == user_college).first()
    else:
        event = db.query(Event).filter(Event.college_name == user_college).order_by(Event.id.desc()).first()
        
    if not event:
        return []
        
    students = db.query(StudentProfile).filter(StudentProfile.college == user_college).all()
    departments = sorted(list(set(s.department for s in students if s.department)))
    
    res = []
    for dept in departments:
        student_count = db.query(StudentProfile).filter(
            StudentProfile.college == user_college,
            StudentProfile.department == dept
        ).count()
        
        teams = db.query(Team).join(StudentProfile, Team.leader_id == StudentProfile.id).filter(
            Team.event_id == event.id,
            StudentProfile.department == dept
        ).all()
        
        team_ids = [t.id for t in teams]
        teams_count = len(teams)
        
        finalized_count = sum(1 for t in teams if t.status in ["FINALIZED", "SUBMITTED", "SHORTLISTED", "WAITLISTED"])
        submitted_count = sum(1 for t in teams if t.status == "SUBMITTED" or t.submissions)
        evaluated_count = db.query(Evaluation).filter(
            Evaluation.team_id.in_(team_ids) if team_ids else False,
            Evaluation.submitted == True
        ).distinct(Evaluation.team_id).count()
        
        shortlisted_count = sum(1 for t in teams if t.selection_status == "SHORTLISTED")
        
        res.append({
            "department": dept,
            "students": student_count,
            "teams": teams_count,
            "finalized": finalized_count,
            "submitted": submitted_count,
            "evaluated": evaluated_count,
            "shortlisted": shortlisted_count
        })
        
    return res
