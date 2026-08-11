from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime

# Auth
class LoginRequest(BaseModel):
    email: str
    password: str

class InvitationActivateRequest(BaseModel):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None

# Users
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str

class UserOut(BaseModel):
    id: int
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Profiles
class StudentProfileCreate(BaseModel):
    student_id: str
    full_name: str
    gender: str
    phone: Optional[str] = None
    department: str
    branch: str
    year: int
    college: str

class StudentRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    student_id: str
    full_name: str
    gender: str
    phone: Optional[str] = None
    department: str
    branch: str
    year: int
    college: str

class StudentProfileOut(BaseModel):
    id: int
    user_id: int
    student_id: str
    full_name: str
    gender: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department: str
    branch: str
    year: int
    college: str
    approved_by_coordinator: bool

    class Config:
        from_attributes = True

class CoordinatorProfileOut(BaseModel):
    id: int
    user_id: int
    staff_id: str
    full_name: str
    department: str
    designation: Optional[str] = None
    phone: Optional[str] = None
    college: str

    class Config:
        from_attributes = True

class SpocProfileOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    phone: Optional[str] = None
    college: str

    class Config:
        from_attributes = True

class JudgeProfileCreate(BaseModel):
    full_name: str
    email: EmailStr
    organization: str
    designation: str
    password: str

class JudgeProfileOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    organization: str
    designation: str
    email: str
    phone: Optional[str] = None
    expertise: Optional[str] = None
    college: str

    class Config:
        from_attributes = True

# Event & Settings
class EventSettingsCreate(BaseModel):
    team_size: int = 6
    min_female_members: int = 1
    same_college: bool = True
    multi_team_membership_allowed: bool = False
    team_leader_required: bool = True
    team_name_unique: bool = True
    team_name_no_institute: bool = True
    problem_statements_limit: int = 2
    shortlist_size: int = 25
    waitlist_size: int = 5
    evaluation_method: str = "judge_average"
    spoc_approval_required: bool = True

class EventSettingsOut(BaseModel):
    id: int
    event_id: int
    team_size: int
    min_female_members: int
    same_college: bool
    multi_team_membership_allowed: bool
    team_leader_required: bool
    team_name_unique: bool
    team_name_no_institute: bool
    problem_statements_limit: int
    shortlist_size: int
    waitlist_size: int
    evaluation_method: str
    spoc_approval_required: bool

    class Config:
        from_attributes = True

class EventCreate(BaseModel):
    name: str
    academic_year: str
    college_name: str
    description: Optional[str] = None
    registration_start: datetime
    registration_end: datetime
    team_finalization_deadline: datetime
    problem_selection_deadline: datetime
    submission_deadline: datetime
    evaluation_start: datetime
    evaluation_end: datetime
    shortlisting_date: datetime
    settings: EventSettingsCreate

class EventOut(BaseModel):
    id: int
    name: str
    academic_year: str
    college_name: str
    description: Optional[str] = None
    registration_start: datetime
    registration_end: datetime
    team_finalization_deadline: datetime
    problem_selection_deadline: datetime
    submission_deadline: datetime
    evaluation_start: datetime
    evaluation_end: datetime
    shortlisting_date: datetime
    status: str
    created_at: datetime
    nominations_submitted: bool
    nominations_approved: bool
    nominations_return_reason: Optional[str] = None
    settings: Optional[EventSettingsOut] = None

    class Config:
        from_attributes = True

# Teams
class TeamCreate(BaseModel):
    name: str
    event_id: int

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    leader_id: Optional[int] = None

class TeamMemberOut(BaseModel):
    team_id: int
    student_id: int
    student: StudentProfileOut

    class Config:
        from_attributes = True

class TeamMemberAddRequest(BaseModel):
    student_id: int

class TeamMemberCreateAndAddRequest(BaseModel):
    student_id: str  # Roll Number / Student ID
    full_name: str
    gender: str      # M, F, Other
    email: str
    phone: Optional[str] = None
    department: str
    branch: str
    year: int

class TeamUnlockRequest(BaseModel):
    reason: str

class TeamOut(BaseModel):
    id: int
    event_id: int
    name: str
    leader_id: Optional[int] = None
    status: str
    average_score: float
    selection_status: str
    selection_reason: Optional[str] = None
    created_at: datetime
    finalized_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Problem Statements
class ProblemStatementCreate(BaseModel):
    problem_id: str
    title: str
    organization: str
    theme: str
    category: str
    description: str
    expected_solution: Optional[str] = None
    technology_area: Optional[str] = None
    active_status: bool = True

class ProblemStatementOut(BaseModel):
    id: int
    problem_id: str
    title: str
    organization: str
    theme: str
    category: str
    description: str
    expected_solution: Optional[str] = None
    technology_area: Optional[str] = None
    active_status: bool

    class Config:
        from_attributes = True

# Team Detail (includes everything: members, problems, submissions)
class TeamProblemOut(BaseModel):
    problem_statement: ProblemStatementOut

    class Config:
        from_attributes = True

class SubmissionOut(BaseModel):
    id: int
    team_id: int
    problem_statement_id: int
    project_title: str
    problem_understanding: str
    current_situation: str
    proposed_solution: str
    innovation: str
    target_users: str
    technical_approach: str
    technology_stack: str
    implementation_plan: str
    expected_impact: str
    scalability: str
    future_scope: str
    pdf_url: Optional[str] = None
    ppt_url: Optional[str] = None
    images_url: Optional[str] = None
    demo_video_url: Optional[str] = None
    github_url: Optional[str] = None
    prototype_url: Optional[str] = None
    version: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    problem_statement_id: int
    project_title: str
    problem_understanding: str
    current_situation: str
    proposed_solution: str
    innovation: str
    target_users: str
    technical_approach: str
    technology_stack: str
    implementation_plan: str
    expected_impact: str
    scalability: str
    future_scope: str
    pdf_url: Optional[str] = None
    ppt_url: Optional[str] = None
    images_url: Optional[str] = None
    demo_video_url: Optional[str] = None
    github_url: Optional[str] = None
    prototype_url: Optional[str] = None

class TeamDetailOut(TeamOut):
    leader: Optional[StudentProfileOut] = None
    members: List[TeamMemberOut] = []
    selected_problems: List[TeamProblemOut] = []
    submissions: List[SubmissionOut] = []

    class Config:
        from_attributes = True

# Evaluation Rubric & Scores
class EvaluationCriteriaCreate(BaseModel):
    name: str
    description: Optional[str] = None
    max_score: int = 10
    weight: float = 1.0
    order_num: int = 0

class EvaluationCriteriaOut(BaseModel):
    id: int
    event_id: int
    name: str
    description: Optional[str] = None
    max_score: int
    weight: float
    order_num: int

    class Config:
        from_attributes = True

class ScoreCreate(BaseModel):
    criteria_id: int
    score: float

class EvaluationCreate(BaseModel):
    team_id: int
    overall_comments: Optional[str] = None
    scores: List[ScoreCreate]

class EvaluationScoreOut(BaseModel):
    criteria_id: int
    score: float
    criteria: EvaluationCriteriaOut

    class Config:
        from_attributes = True

class EvaluationOut(BaseModel):
    id: int
    team_id: int
    judge_id: int
    overall_comments: Optional[str] = None
    total_score: float
    submitted: bool
    created_at: datetime
    submission_version: Optional[int] = None
    scores: List[EvaluationScoreOut] = []
    judge: Optional[JudgeProfileOut] = None

    class Config:
        from_attributes = True

# Announcements & Notifications
class AnnouncementCreate(BaseModel):
    title: str
    message: str
    priority: str = "MEDIUM"
    audience: str = "ALL"
    audience_metadata: Optional[str] = None
    college: Optional[str] = None
    expiry_time: Optional[datetime] = None

class AnnouncementOut(BaseModel):
    id: int
    event_id: int
    title: str
    message: str
    priority: str
    audience: str
    audience_metadata: Optional[str] = None
    college: Optional[str] = None
    publish_time: datetime
    expiry_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: int
    student_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Audit log
class AuditLogOut(BaseModel):
    id: int
    actor_id: Optional[int]
    actor_role: str
    action: str
    entity: str
    entity_id: Optional[int]
    timestamp: datetime
    reason: Optional[str]
    metadata_json: Optional[Any] = None

    class Config:
        from_attributes = True

# Dashboard/Stats
class CoordinatorStatsOut(BaseModel):
    total_students: int
    teams_created: int
    teams_finalized: int
    incomplete_teams: int
    teams_with_problems: int
    submissions_completed: int
    submissions_pending: int
    participating_teams: int
    evaluated_teams: int
    pending_evaluations: int
    shortlisted_teams: int
    waitlisted_teams: int
    not_selected_teams: int

class ShortlistAction(BaseModel):
    team_id: int
    selection_status: str  # SHORTLISTED, WAITLISTED, NOT_SELECTED
    reason: Optional[str] = None

class ShortlistSubmitRequest(BaseModel):
    actions: List[ShortlistAction]

class CoordinatorCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    department: str
    designation: Optional[str] = None

class JudgeCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    designation: str
    organization: str
    expertise: Optional[str] = None
    department: Optional[str] = None

class UserStatusUpdateRequest(BaseModel):
    status: str  # ACTIVE, DISABLED, SUSPENDED
