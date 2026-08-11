from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_student, get_password_hash
from app.models import (
    User, StudentProfile, Event, EventSettings, Team, TeamMember,
    ProblemStatement, TeamProblemStatement, Submission, SubmissionHistory,
    Announcement, Notification, AuditLog, EventProblemStatement, Evaluation
)
from app.schemas import (
    StudentProfileOut, EventOut, TeamCreate, TeamOut, TeamDetailOut,
    TeamMemberAddRequest, TeamMemberCreateAndAddRequest, TeamUpdate, ProblemStatementOut, SubmissionCreate,
    SubmissionOut, AnnouncementOut, NotificationOut
)
from app.crud import log_action, send_notification

router = APIRouter(prefix="/student", tags=["student"])

def validate_secure_url(url: str, allowed_extensions: List[str]) -> bool:
    if not url or not url.strip():
        return True
    url_lower = url.lower().strip()
    if not url_lower.startswith("https://"):
        return False
    if ".." in url_lower or "/etc/" in url_lower:
        return False
    blocked_extensions = [".exe", ".bat", ".sh", ".cmd", ".msi", ".scr", ".pif", ".vbs", ".bin"]
    for ext in blocked_extensions:
        if ext in url_lower:
            return False
    has_allowed = False
    for ext in allowed_extensions:
        if ext in url_lower:
            has_allowed = True
            break
    cloud_domains = ["drive.google.com", "dropbox.com", "onedrive.live.com", "github.com", "gitlab.com", "figma.com", "sih.gov"]
    for domain in cloud_domains:
        if domain in url_lower:
            has_allowed = True
            break
    return has_allowed

def validate_team_name(name: str, event: Event, settings: EventSettings, db: Session, team_id: Optional[int] = None) -> str:
    name = name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Team name cannot be empty")
    if len(name) < 3 or len(name) > 50:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Team name must be between 3 and 50 characters")
    
    # Check duplicate
    query = db.query(Team).filter(Team.event_id == event.id, Team.name == name)
    if team_id:
        query = query.filter(Team.id != team_id)
    if query.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team name already exists. Please choose another name."
        )
    
    # Check institute name restriction
    if settings.team_name_no_institute and event.college_name:
        college_parts = [p.lower() for p in event.college_name.split() if len(p) > 2]
        name_lower = name.lower()
        for part in college_parts:
            # Skip very common words like "of", "and", "the"
            if part in ["institute", "college", "university", "technology", "science", "engineering"]:
                continue
            if part in name_lower:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Team name cannot contain part of college name ('{part}')"
                )
    return name

@router.get("/profile", response_model=StudentProfileOut)
def get_profile(student: StudentProfile = Depends(get_current_student)):
    return student

@router.get("/search-student", response_model=StudentProfileOut)
def search_student(roll_number: str, student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    candidate = db.query(StudentProfile).filter(StudentProfile.student_id == roll_number.strip()).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Student not found with this roll number")
    return candidate


@router.get("/event", response_model=EventOut)
def get_active_event(db: Session = Depends(get_db)):
    # Returns the active event (e.g. not DRAFT, or most recently updated open event)
    event = db.query(Event).filter(Event.status != "DRAFT").order_by(Event.id.desc()).first()
    if not event:
        # Fallback to any event
        event = db.query(Event).order_by(Event.id.desc()).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No SIH events active")
    return event

@router.post("/teams", response_model=TeamDetailOut)
def create_team(req: TeamCreate, student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == req.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if event.status not in ["REGISTRATION_OPEN", "DRAFT"]:
        raise HTTPException(status_code=400, detail="Registration is closed for this event")
        
    # Check registration deadline
    if datetime.utcnow() > event.registration_end:
        raise HTTPException(status_code=400, detail="Registration deadline has passed")
        
    settings = event.settings
    if not settings:
         raise HTTPException(status_code=400, detail="Event settings not initialized")
         
    # Check if student is already in a team for this event
    existing_membership = db.query(TeamMember).filter(
        TeamMember.student_id == student.id,
        TeamMember.event_id == event.id
    ).first()
    if existing_membership:
        raise HTTPException(status_code=400, detail="You are already assigned to another team in this event")

    # Validate team name
    clean_name = validate_team_name(req.name, event, settings, db)

    # Create team
    team = Team(
        event_id=event.id,
        name=clean_name,
        leader_id=student.id,
        status="DRAFT"
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    
    # Add leader as first member
    member = TeamMember(
        team_id=team.id,
        student_id=student.id,
        event_id=event.id
    )
    db.add(member)
    db.commit()
    db.refresh(team)
    
    log_action(db, student.user_id, "student", "TEAM_CREATE", "Team", team.id, "Created team")
    
    return team

@router.get("/team", response_model=TeamDetailOut)
def get_my_team(student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    # Find student's membership
    membership = db.query(TeamMember).filter(TeamMember.student_id == student.id).order_by(TeamMember.team_id.desc()).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You are not part of any team")
        
    team = db.query(Team).filter(Team.id == membership.team_id).first()
    return team

@router.put("/team", response_model=TeamDetailOut)
def update_team(req: TeamUpdate, student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    membership = db.query(TeamMember).filter(TeamMember.student_id == student.id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="You are not in a team")
        
    team = db.query(Team).filter(Team.id == membership.team_id).first()
    if team.leader_id != student.id:
        raise HTTPException(status_code=403, detail="Only the team leader can modify team settings")
        
    if team.status in ["FINALIZED", "SUBMITTED", "SHORTLISTED", "WAITLISTED"]:
        raise HTTPException(status_code=400, detail="Team details are locked and cannot be modified")
        
    event = team.event
    settings = event.settings
    
    if req.name and req.name != team.name:
        clean_name = validate_team_name(req.name, event, settings, db, team.id)
        team.name = clean_name
        log_action(db, student.user_id, "student", "TEAM_NAME_CHANGE", "Team", team.id, f"Changed name to {clean_name}")
        
    if req.leader_id and req.leader_id != team.leader_id:
        # Verify leader is a team member
        is_member = db.query(TeamMember).filter(
            TeamMember.team_id == team.id,
            TeamMember.student_id == req.leader_id
        ).first()
        if not is_member:
            raise HTTPException(status_code=400, detail="Leader must be an existing team member")
        team.leader_id = req.leader_id
        log_action(db, student.user_id, "student", "LEADER_CHANGE", "Team", team.id, f"Changed leader ID to {req.leader_id}")
        
    db.commit()
    db.refresh(team)
    return team

@router.post("/team/members", response_model=TeamDetailOut)
def add_team_member(req: TeamMemberAddRequest, student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    # Get current student's team
    membership = db.query(TeamMember).filter(TeamMember.student_id == student.id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="You are not in a team")
        
    team = db.query(Team).filter(Team.id == membership.team_id).first()
    if team.leader_id != student.id:
        raise HTTPException(status_code=403, detail="Only the team leader can manage members")
        
    if team.status in ["FINALIZED", "SUBMITTED", "SHORTLISTED", "WAITLISTED"]:
        raise HTTPException(status_code=400, detail="Team details are locked and cannot be modified")
        
    event = team.event
    if event.status not in ["REGISTRATION_OPEN", "TEAM_FORMATION", "DRAFT"]:
        raise HTTPException(status_code=400, detail="Team member additions are closed for this event stage")
        
    settings = event.settings
    
    # Check max size
    current_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    if current_count >= settings.team_size:
        raise HTTPException(status_code=400, detail=f"Team is already at its configured capacity of {settings.team_size} members")
        
    # Check if candidate student exists
    new_member_student = db.query(StudentProfile).filter(StudentProfile.id == req.student_id).first()
    if not new_member_student:
        raise HTTPException(status_code=404, detail="Student not found in registry")
        
    # Check college rule
    if settings.same_college and new_member_student.college != student.college:
        raise HTTPException(status_code=400, detail="All members must belong to the same college")
        
    # Check if student already in another team
    candidate_existing_membership = db.query(TeamMember).filter(
        TeamMember.student_id == req.student_id,
        TeamMember.event_id == event.id
    ).first()
    if candidate_existing_membership:
        raise HTTPException(status_code=400, detail="This student is already assigned to another team")
        
    # Add member
    new_member = TeamMember(
        team_id=team.id,
        student_id=new_member_student.id,
        event_id=event.id
    )
    db.add(new_member)
    db.commit()
    db.refresh(team)
    
    log_action(db, student.user_id, "student", "MEMBER_ADD", "Team", team.id, f"Added student {new_member_student.full_name}")
    send_notification(db, new_member_student.id, "Joined Team", f"You have been added to team '{team.name}' by the team leader.")
    
    return team

@router.post("/team/members/custom", response_model=TeamDetailOut)
def create_and_add_team_member(req: TeamMemberCreateAndAddRequest, student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    membership = db.query(TeamMember).filter(TeamMember.student_id == student.id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="You are not in a team")
        
    team = db.query(Team).filter(Team.id == membership.team_id).first()
    if team.leader_id != student.id:
        raise HTTPException(status_code=403, detail="Only the team leader can manage members")
        
    if team.status in ["FINALIZED", "SUBMITTED", "SHORTLISTED", "WAITLISTED"]:
        raise HTTPException(status_code=400, detail="Team details are locked and cannot be modified")
        
    event = team.event
    if event.status not in ["REGISTRATION_OPEN", "TEAM_FORMATION", "DRAFT"]:
        raise HTTPException(status_code=400, detail="Team member additions are closed for this event stage")
        
    settings = event.settings
    
    # Check max size
    current_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    if current_count >= settings.team_size:
        raise HTTPException(status_code=400, detail=f"Team is already at its configured capacity of {settings.team_size} members")
        
    # Check if student with this email already exists
    existing_user = db.query(User).filter(User.email == req.email.strip()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A student with this email address is already registered")
        
    # Check if student with this roll number already exists
    existing_profile = db.query(StudentProfile).filter(StudentProfile.student_id == req.student_id.strip()).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="A student with this Roll Number / Student ID is already registered")
        
    # Create User
    new_user = User(
        email=req.email.strip(),
        hashed_password=get_password_hash("password123"),
        role="student"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create StudentProfile
    new_profile = StudentProfile(
        user_id=new_user.id,
        student_id=req.student_id.strip(),
        full_name=req.full_name.strip(),
        gender=req.gender,
        phone=req.phone,
        department=req.department,
        branch=req.branch,
        year=req.year,
        college=student.college,
        approved_by_coordinator=True
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    
    # Add to team
    new_member = TeamMember(
        team_id=team.id,
        student_id=new_profile.id,
        event_id=event.id
    )
    db.add(new_member)
    db.commit()
    db.refresh(team)
    
    log_action(db, student.user_id, "student", "MEMBER_ADD", "Team", team.id, f"Registered & added member {new_profile.full_name}")
    return team

@router.delete("/team/members/{student_id}", response_model=TeamDetailOut)
def remove_team_member(student_id: int, student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    membership = db.query(TeamMember).filter(TeamMember.student_id == student.id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="You are not in a team")
        
    team = db.query(Team).filter(Team.id == membership.team_id).first()
    if team.leader_id != student.id:
        raise HTTPException(status_code=403, detail="Only the team leader can manage members")
        
    event = team.event
    if event.status not in ["REGISTRATION_OPEN", "TEAM_FORMATION", "DRAFT"]:
        raise HTTPException(status_code=400, detail="Team modifications are closed for this event stage")
        
    if team.status in ["FINALIZED", "SUBMITTED", "SHORTLISTED", "WAITLISTED"]:
        raise HTTPException(status_code=400, detail="Team details are locked and cannot be modified")
        
    if student_id == team.leader_id:
        raise HTTPException(status_code=400, detail="Cannot remove the team leader. Change the team leader first.")
        
    member = db.query(TeamMember).filter(
        TeamMember.team_id == team.id,
        TeamMember.student_id == student_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Student is not a member of this team")
        
    db.delete(member)
    db.commit()
    db.refresh(team)
    
    log_action(db, student.user_id, "student", "MEMBER_REMOVE", "Team", team.id, f"Removed student ID {student_id}")
    send_notification(db, student_id, "Removed from Team", f"You have been removed from team '{team.name}'.")
    
    return team

@router.post("/team/finalize", response_model=TeamDetailOut)
def finalize_team(student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    membership = db.query(TeamMember).filter(TeamMember.student_id == student.id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="You are not in a team")
        
    team = db.query(Team).filter(Team.id == membership.team_id).first()
    if team.leader_id != student.id:
        raise HTTPException(status_code=403, detail="Only the team leader can finalize the team")
        
    if team.status == "FINALIZED":
        return team
        
    event = team.event
    if event.status not in ["REGISTRATION_OPEN", "TEAM_FORMATION", "TEAM_FINALIZATION", "DRAFT"]:
        raise HTTPException(status_code=400, detail="Team finalization is closed for this event stage")
        
    settings = event.settings
    
    # Check deadline
    if datetime.utcnow() > event.team_finalization_deadline:
        raise HTTPException(status_code=400, detail="Team finalization deadline has passed")
        
    # Get all members details
    members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
    
    # Check size constraint
    if len(members) != settings.team_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team size requirement not met. Must have exactly {settings.team_size} members. Current: {len(members)}"
        )
        
    # Check female count constraint
    female_count = 0
    for m in members:
        if m.student.gender == "F":
            female_count += 1
            
    if female_count < settings.min_female_members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"At least {settings.min_female_members} female team member(s) required. Current: {female_count}"
        )
        
    # 1. Check duplicate finalized members in the same event
    for m in members:
        other_membership = db.query(TeamMember).join(Team).filter(
            TeamMember.student_id == m.student_id,
            TeamMember.event_id == event.id,
            TeamMember.team_id != team.id,
            Team.status.in_(["FINALIZED", "SUBMITTED", "SHORTLISTED", "WAITLISTED"])
        ).first()
        if other_membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Member '{m.student.full_name}' is already part of another finalized team '{other_membership.team.name}'."
            )
            
    # 2. Check student account validity (ACTIVE)
    for m in members:
        if m.student.user.status in ["DISABLED", "SUSPENDED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Member '{m.student.full_name}' has an inactive or suspended student account."
            )
            
    # 3. Check student belongs to correct college/event
    for m in members:
        if m.student.college != event.college_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Member '{m.student.full_name}' does not belong to college '{event.college_name}'."
            )
            
    # 4. Check team leader validity
    leader_in_team = any(m.student_id == team.leader_id for m in members)
    if not leader_in_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The team leader must be one of the team members."
        )
        
    # 5. Check required contact information
    for m in members:
        if not m.student.phone or not m.student.phone.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Contact phone number is missing for member '{m.student.full_name}'."
            )
        if not m.student.user.email or not m.student.user.email.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email address is missing for member '{m.student.full_name}'."
            )
            
    # 6. Check team name uniqueness
    validate_team_name(team.name, event, settings, db, team_id=team.id)
        
    # Set status to FINALIZED
    team.status = "FINALIZED"
    team.finalized_at = datetime.utcnow()
    db.commit()
    db.refresh(team)
    
    log_action(db, student.user_id, "student", "TEAM_FINALIZE", "Team", team.id, "Finalized team selection")
    for m in members:
        send_notification(db, m.student_id, "Team Finalized", f"Your team '{team.name}' has been finalized and locked.")
        
    return team

@router.get("/problems", response_model=List[ProblemStatementOut])
def get_problems(search: Optional[str] = None, category: Optional[str] = None, student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    # Find student's active event
    event = db.query(Event).filter(Event.college_name == student.college).order_by(Event.created_at.desc()).first()
    if not event:
        return []
        
    query = db.query(ProblemStatement).join(EventProblemStatement).filter(
        EventProblemStatement.event_id == event.id,
        EventProblemStatement.enabled == True,
        ProblemStatement.active_status == True
    )
    if search:
        query = query.filter(
            (ProblemStatement.title.ilike(f"%{search}%")) |
            (ProblemStatement.description.ilike(f"%{search}%")) |
            (ProblemStatement.problem_id.ilike(f"%{search}%")) |
            (ProblemStatement.external_id.ilike(f"%{search}%"))
        )
    if category:
        query = query.filter(ProblemStatement.category == category)
    return query.all()

@router.post("/team/problems", response_model=TeamDetailOut)
def select_problems(problem_ids: List[int], student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    membership = db.query(TeamMember).filter(TeamMember.student_id == student.id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="You are not in a team")
        
    team = db.query(Team).filter(Team.id == membership.team_id).first()
    if team.leader_id != student.id:
        raise HTTPException(status_code=403, detail="Only the team leader can select problem statements")
        
    # Team must be finalized or admin unlocked
    if team.status not in ["FINALIZED", "ADMIN_UNLOCKED", "SUBMITTED"]:
        raise HTTPException(status_code=400, detail="Team must be finalized before selecting problem statements")
        
    event = team.event
    settings = event.settings
    
    # Check deadline
    if datetime.utcnow() > event.problem_selection_deadline:
        raise HTTPException(status_code=400, detail="Problem statement selection deadline has passed")
        
    # Check selection size
    if len(problem_ids) > settings.problem_statements_limit:
        raise HTTPException(
            status_code=400,
            detail=f"You can select a maximum of {settings.problem_statements_limit} problem statements"
        )
        
    # Verify all problems exist and are active
    problems = db.query(ProblemStatement).filter(
        ProblemStatement.id.in_(problem_ids),
        ProblemStatement.active_status == True
    ).all()
    if len(problems) != len(problem_ids):
        raise HTTPException(status_code=400, detail="One or more selected problem statements are invalid or inactive")
        
    # Delete old selections
    db.query(TeamProblemStatement).filter(TeamProblemStatement.team_id == team.id).delete()
    
    # Add new selections
    for pid in problem_ids:
        tps = TeamProblemStatement(team_id=team.id, problem_statement_id=pid)
        db.add(tps)
        
    db.commit()
    db.refresh(team)
    log_action(db, student.user_id, "student", "PROBLEM_SELECT", "Team", team.id, f"Selected problems: {[p.problem_id for p in problems]}")
    return team

@router.get("/submissions", response_model=List[SubmissionOut])
def get_submissions(student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    membership = db.query(TeamMember).filter(TeamMember.student_id == student.id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="You are not in a team")
    return db.query(Submission).filter(Submission.team_id == membership.team_id).all()

@router.post("/submissions", response_model=SubmissionOut)
def create_or_update_submission(req: SubmissionCreate, student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    membership = db.query(TeamMember).filter(TeamMember.student_id == student.id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="You are not in a team")
        
    team = db.query(Team).filter(Team.id == membership.team_id).first()
    if team.leader_id != student.id:
        raise HTTPException(status_code=403, detail="Only the team leader can submit solutions")
        
    # Must select problem statement first
    is_selected = db.query(TeamProblemStatement).filter(
        TeamProblemStatement.team_id == team.id,
        TeamProblemStatement.problem_statement_id == req.problem_statement_id
    ).first()
    if not is_selected:
        raise HTTPException(status_code=400, detail="This problem statement must be selected by your team first")
        
    event = team.event
    
    if event.status != "SUBMISSION_OPEN":
        raise HTTPException(status_code=400, detail="Submissions are not open for this event stage")
        
    # Check deadline
    if datetime.utcnow() > event.submission_deadline:
        raise HTTPException(status_code=400, detail="Submission deadline has passed")
        
    # Check if grading/evaluation has already started
    eval_count = db.query(Evaluation).filter(Evaluation.team_id == team.id).count()
    if eval_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Submissions are locked because grading/evaluation has already started for your team."
        )
        
    # Validate secure URLs
    if req.pdf_url and not validate_secure_url(req.pdf_url, [".pdf"]):
        raise HTTPException(status_code=400, detail="Invalid or unsafe PDF link. Must be a secure HTTPS link.")
    if req.ppt_url and not validate_secure_url(req.ppt_url, [".ppt", ".pptx", ".pdf"]):
        raise HTTPException(status_code=400, detail="Invalid or unsafe PPT link. Must be a secure HTTPS link.")
    if req.github_url and not validate_secure_url(req.github_url, []):
        raise HTTPException(status_code=400, detail="Invalid or unsafe GitHub URL. Must be a secure HTTPS link.")
        
    # Check if submission already exists
    sub = db.query(Submission).filter(
        Submission.team_id == team.id,
        Submission.problem_statement_id == req.problem_statement_id
    ).first()
    
    if sub:
        # Create history entry
        hist = SubmissionHistory(
            submission_id=sub.id,
            version=sub.version,
            project_title=sub.project_title,
            proposed_solution=sub.proposed_solution,
            pdf_url=sub.pdf_url,
            ppt_url=sub.ppt_url,
            github_url=sub.github_url
        )
        db.add(hist)
        
        # Update submission fields
        sub.version += 1
        sub.project_title = req.project_title
        sub.problem_understanding = req.problem_understanding
        sub.current_situation = req.current_situation
        sub.proposed_solution = req.proposed_solution
        sub.innovation = req.innovation
        sub.target_users = req.target_users
        sub.technical_approach = req.technical_approach
        sub.technology_stack = req.technology_stack
        sub.implementation_plan = req.implementation_plan
        sub.expected_impact = req.expected_impact
        sub.scalability = req.scalability
        sub.future_scope = req.future_scope
        sub.pdf_url = req.pdf_url
        sub.ppt_url = req.ppt_url
        sub.images_url = req.images_url
        sub.demo_video_url = req.demo_video_url
        sub.github_url = req.github_url
        sub.prototype_url = req.prototype_url
        sub.status = "FINAL"
    else:
        # Create new submission
        sub = Submission(
            team_id=team.id,
            problem_statement_id=req.problem_statement_id,
            project_title=req.project_title,
            problem_understanding=req.problem_understanding,
            current_situation=req.current_situation,
            proposed_solution=req.proposed_solution,
            innovation=req.innovation,
            target_users=req.target_users,
            technical_approach=req.technical_approach,
            technology_stack=req.technology_stack,
            implementation_plan=req.implementation_plan,
            expected_impact=req.expected_impact,
            scalability=req.scalability,
            future_scope=req.future_scope,
            pdf_url=req.pdf_url,
            ppt_url=req.ppt_url,
            images_url=req.images_url,
            demo_video_url=req.demo_video_url,
            github_url=req.github_url,
            prototype_url=req.prototype_url,
            version=1,
            status="FINAL"
        )
        db.add(sub)
        
    # Mark team status as SUBMITTED
    team.status = "SUBMITTED"
    db.commit()
    db.refresh(sub)
    
    log_action(db, student.user_id, "student", "SUBMISSION_CREATE", "Submission", sub.id, f"Submitted version {sub.version}")
    return sub

@router.get("/announcements", response_model=List[AnnouncementOut])
def get_announcements(student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    membership = db.query(TeamMember).filter(TeamMember.student_id == student.id).first()
    team_status = "DRAFT"
    team_id = None
    if membership:
        team = db.query(Team).filter(Team.id == membership.team_id).first()
        team_status = team.status
        team_id = team.id
        
    now = datetime.utcnow()
    query = db.query(Announcement).filter(
        Announcement.publish_time <= now,
        (Announcement.expiry_time == None) | (Announcement.expiry_time > now),
        (Announcement.college == None) | (Announcement.college == student.college)
    )
    
    # Filter announcement targeting this audience
    # Audiences: ALL, NO_TEAM, DRAFT_TEAMS, FINALIZED_TEAMS, SUBMITTED_TEAMS, SHORTLISTED_TEAMS, WAITLISTED_TEAMS, DEPARTMENT, TEAM
    results = []
    for ann in query.all():
        if ann.audience == "ALL":
            results.append(ann)
        elif ann.audience == "NO_TEAM" and not membership:
            results.append(ann)
        elif ann.audience == "DRAFT_TEAMS" and team_status == "DRAFT":
            results.append(ann)
        elif ann.audience == "FINALIZED_TEAMS" and team_status == "FINALIZED":
            results.append(ann)
        elif ann.audience == "SUBMITTED_TEAMS" and team_status == "SUBMITTED":
            results.append(ann)
        elif ann.audience == "SHORTLISTED_TEAMS" and team_status == "SHORTLISTED":
            results.append(ann)
        elif ann.audience == "WAITLISTED_TEAMS" and team_status == "WAITLISTED":
            results.append(ann)
        elif ann.audience == "DEPARTMENT" and ann.audience_metadata == student.department:
            results.append(ann)
        elif ann.audience == "TEAM" and str(team_id) == ann.audience_metadata:
            results.append(ann)
            
    return results

@router.get("/notifications", response_model=List[NotificationOut])
def get_notifications(student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    return db.query(Notification).filter(Notification.student_id == student.id).order_by(Notification.id.desc()).all()

@router.put("/notifications/{id}/read")
def read_notification(id: int, student: StudentProfile = Depends(get_current_student), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.student_id == student.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"detail": "Notification marked as read"}
