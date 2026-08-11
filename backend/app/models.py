import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Float,
    UniqueConstraint,
    ForeignKeyConstraint,
    JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'student', 'coordinator', 'judge', 'spoc'
    status = Column(String, default="ACTIVE", nullable=False)  # 'INVITED', 'ACTIVE', 'DISABLED', 'SUSPENDED'
    college = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    coordinator_profile = relationship("CoordinatorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    judge_profile = relationship("JudgeProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    spoc_profile = relationship("SpocProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="actor")


class SpocProfile(Base):
    __tablename__ = "spoc_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    college = Column(String, nullable=False)
    
    user = relationship("User", back_populates="spoc_profile")


class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)  # e.g., "Internal SIH 2026"
    academic_year = Column(String, nullable=False)  # e.g., "2025-2026"
    college_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    registration_start = Column(DateTime, nullable=False)
    registration_end = Column(DateTime, nullable=False)
    team_finalization_deadline = Column(DateTime, nullable=False)
    problem_selection_deadline = Column(DateTime, nullable=False)
    submission_deadline = Column(DateTime, nullable=False)
    evaluation_start = Column(DateTime, nullable=False)
    evaluation_end = Column(DateTime, nullable=False)
    shortlisting_date = Column(DateTime, nullable=False)
    
    status = Column(String, default="DRAFT", nullable=False)  # DRAFT, REGISTRATION_OPEN, REGISTRATION_CLOSED, SUBMISSION_OPEN, SUBMISSION_CLOSED, INTERNAL_HACKATHON, EVALUATION, SHORTLISTING, COMPLETED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Workflow fields
    nominations_submitted = Column(Boolean, default=False, nullable=False)
    nominations_approved = Column(Boolean, default=False, nullable=False)
    nominations_return_reason = Column(Text, nullable=True)
    
    # Relationships
    settings = relationship("EventSettings", back_populates="event", uselist=False, cascade="all, delete-orphan")
    teams = relationship("Team", back_populates="event", cascade="all, delete-orphan")
    criteria = relationship("EvaluationCriteria", back_populates="event", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="event", cascade="all, delete-orphan")


class EventSettings(Base):
    __tablename__ = "event_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    team_size = Column(Integer, default=6, nullable=False)
    min_female_members = Column(Integer, default=1, nullable=False)
    same_college = Column(Boolean, default=True, nullable=False)
    multi_team_membership_allowed = Column(Boolean, default=False, nullable=False)
    team_leader_required = Column(Boolean, default=True, nullable=False)
    team_name_unique = Column(Boolean, default=True, nullable=False)
    team_name_no_institute = Column(Boolean, default=True, nullable=False)
    problem_statements_limit = Column(Integer, default=2, nullable=False)
    shortlist_size = Column(Integer, default=25, nullable=False)
    waitlist_size = Column(Integer, default=5, nullable=False)
    evaluation_method = Column(String, default="judge_average", nullable=False)  # judge_average, threshold, manual, hybrid
    spoc_approval_required = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    event = relationship("Event", back_populates="settings")


class StudentProfile(Base):
    __tablename__ = "student_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_id = Column(String, unique=True, index=True, nullable=False)  # Roll number
    full_name = Column(String, nullable=False)
    gender = Column(String, nullable=False)  # 'M', 'F', 'Other'
    phone = Column(String, nullable=True)
    department = Column(String, nullable=False)
    branch = Column(String, nullable=False)
    year = Column(Integer, nullable=False)  # 1, 2, 3, 4
    college = Column(String, nullable=False)
    approved_by_coordinator = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="student_profile")
    memberships = relationship("TeamMember", back_populates="student", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="student", cascade="all, delete-orphan")
    team_leader_of = relationship("Team", back_populates="leader")

    @property
    def email(self):
        return self.user.email if self.user else None



class CoordinatorProfile(Base):
    __tablename__ = "coordinator_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    staff_id = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    designation = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    college = Column(String, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="coordinator_profile")


class JudgeProfile(Base):
    __tablename__ = "judge_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    organization = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    expertise = Column(String, nullable=True)
    college = Column(String, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="judge_profile")
    evaluations = relationship("Evaluation", back_populates="judge", cascade="all, delete-orphan")


class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    leader_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="DRAFT", nullable=False)  # DRAFT, READY_TO_FINALIZE, FINALIZED, ADMIN_UNLOCKED, SUBMITTED, SHORTLISTED, WAITLISTED, NOT_SELECTED
    
    # Scoring/Selection
    average_score = Column(Float, default=0.0, nullable=False)
    selection_status = Column(String, default="PENDING", nullable=False)  # PENDING, SHORTLISTED, WAITLISTED, NOT_SELECTED
    selection_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    finalized_at = Column(DateTime, nullable=True)
    
    # Relationships
    event = relationship("Event", back_populates="teams")
    leader = relationship("StudentProfile", back_populates="team_leader_of")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    selected_problems = relationship("TeamProblemStatement", back_populates="team", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="team", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="team", cascade="all, delete-orphan")
    
    # Ensure team name is unique per event
    __table_args__ = (
        UniqueConstraint("event_id", "name", name="uq_event_team_name"),
    )


class TeamMember(Base):
    __tablename__ = "team_members"
    
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), primary_key=True)
    event_id = Column(Integer, nullable=False)  # Copy of event ID to enforce single-team constraints
    
    # Relationships
    team = relationship("Team", back_populates="members")
    student = relationship("StudentProfile", back_populates="memberships")
    
    # Constraint to prevent a student from joining multiple teams in the same event
    __table_args__ = (
        UniqueConstraint("event_id", "student_id", name="uq_event_student_member"),
    )


class ProblemStatement(Base):
    __tablename__ = "problem_statements"
    
    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(String, unique=True, index=True, nullable=False)  # e.g., "SIH-1234"
    external_id = Column(String, unique=True, index=True, nullable=True)  # Official SIH ID
    title = Column(String, nullable=False)
    organization = Column(String, nullable=False)
    theme = Column(String, nullable=False)
    category = Column(String, nullable=False)  # AI/ML, Agriculture, etc.
    description = Column(Text, nullable=False)
    expected_solution = Column(Text, nullable=True)
    technology_area = Column(String, nullable=True)
    active_status = Column(Boolean, default=True, nullable=False)
    
    # Sync & Versioning Fields
    type = Column(String, nullable=True)  # SOFTWARE, HARDWARE
    technology = Column(String, nullable=True)
    source = Column(String, default="Official SIH", nullable=True)
    source_url = Column(String, nullable=True)
    source_edition = Column(String, default="2026", nullable=True)
    status = Column(String, default="ACTIVE", nullable=False)  # ACTIVE, UNAVAILABLE
    version = Column(Integer, default=1, nullable=False)
    first_seen_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    team_selections = relationship("TeamProblemStatement", back_populates="problem_statement", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="problem_statement", cascade="all, delete-orphan")


class TeamProblemStatement(Base):
    __tablename__ = "team_problem_statements"
    
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True)
    problem_statement_id = Column(Integer, ForeignKey("problem_statements.id", ondelete="CASCADE"), primary_key=True)
    
    # Relationships
    team = relationship("Team", back_populates="selected_problems")
    problem_statement = relationship("ProblemStatement", back_populates="team_selections")


class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    problem_statement_id = Column(Integer, ForeignKey("problem_statements.id", ondelete="CASCADE"), nullable=False)
    problem_statement_version_id = Column(Integer, ForeignKey("problem_statement_versions.id", ondelete="SET NULL"), nullable=True)
    
    project_title = Column(String, nullable=False)
    problem_understanding = Column(Text, nullable=False)
    current_situation = Column(Text, nullable=False)
    proposed_solution = Column(Text, nullable=False)
    innovation = Column(Text, nullable=False)
    target_users = Column(Text, nullable=False)
    technical_approach = Column(Text, nullable=False)
    technology_stack = Column(String, nullable=False)
    implementation_plan = Column(Text, nullable=False)
    expected_impact = Column(Text, nullable=False)
    scalability = Column(Text, nullable=False)
    future_scope = Column(Text, nullable=False)
    
    pdf_url = Column(String, nullable=True)
    ppt_url = Column(String, nullable=True)
    images_url = Column(String, nullable=True)
    demo_video_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    prototype_url = Column(String, nullable=True)
    
    version = Column(Integer, default=1, nullable=False)
    status = Column(String, default="DRAFT", nullable=False)  # DRAFT, FINAL
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    team = relationship("Team", back_populates="submissions")
    problem_statement = relationship("ProblemStatement", back_populates="submissions")
    problem_statement_version = relationship("ProblemStatementVersion")
    history = relationship("SubmissionHistory", back_populates="submission", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint("team_id", "problem_statement_id", name="uq_team_problem_submission"),
    )


class SubmissionHistory(Base):
    __tablename__ = "submission_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    project_title = Column(String, nullable=False)
    proposed_solution = Column(Text, nullable=False)
    pdf_url = Column(String, nullable=True)
    ppt_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    submission = relationship("Submission", back_populates="history")


class EvaluationCriteria(Base):
    __tablename__ = "evaluation_criteria"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)  # e.g., "Problem Understanding"
    description = Column(Text, nullable=True)
    max_score = Column(Integer, default=10, nullable=False)
    weight = Column(Float, default=1.0, nullable=False)
    order_num = Column(Integer, default=0, nullable=False)
    
    # Relationships
    event = relationship("Event", back_populates="criteria")
    scores = relationship("EvaluationScore", back_populates="criteria", cascade="all, delete-orphan")


class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    judge_id = Column(Integer, ForeignKey("judge_profiles.id", ondelete="CASCADE"), nullable=False)
    overall_comments = Column(Text, nullable=True)
    total_score = Column(Float, default=0.0, nullable=False)
    submitted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    submission_version = Column(Integer, nullable=True)
    
    # Relationships
    team = relationship("Team", back_populates="evaluations")
    judge = relationship("JudgeProfile", back_populates="evaluations")
    scores = relationship("EvaluationScore", back_populates="evaluation", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint("team_id", "judge_id", name="uq_team_judge_evaluation"),
    )


class EvaluationScore(Base):
    __tablename__ = "evaluation_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False)
    criteria_id = Column(Integer, ForeignKey("evaluation_criteria.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    
    # Relationships
    evaluation = relationship("Evaluation", back_populates="scores")
    criteria = relationship("EvaluationCriteria", back_populates="scores")
    
    __table_args__ = (
        UniqueConstraint("evaluation_id", "criteria_id", name="uq_evaluation_criteria_score"),
    )


class Announcement(Base):
    __tablename__ = "announcements"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String, default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH
    audience = Column(String, default="ALL", nullable=False)  # ALL, NO_TEAM, DRAFT_TEAMS, FINALIZED_TEAMS, SUBMITTED_TEAMS, SHORTLISTED_TEAMS, WAITLISTED_TEAMS, DEPARTMENT, TEAM
    audience_metadata = Column(String, nullable=True)  # Store department name or team id as metadata
    college = Column(String, nullable=True)  # Target specific college if provided, otherwise all
    
    publish_time = Column(DateTime, default=datetime.datetime.utcnow)
    expiry_time = Column(DateTime, nullable=True)
    
    # Relationships
    event = relationship("Event", back_populates="announcements")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    student = relationship("StudentProfile", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_role = Column(String, nullable=False)  # student, coordinator, judge, spoc, system
    action = Column(String, nullable=False)  # e.g., "TEAM_UNLOCK", "MEMBER_ADD", etc.
    entity = Column(String, nullable=False)  # e.g., "Team", "Submission", "EventSettings"
    entity_id = Column(Integer, nullable=True)
    college = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    reason = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)  # Store details about what changed
    
    # Relationships
    actor = relationship("User", back_populates="audit_logs")


class InvitationToken(Base):
    __tablename__ = "invitation_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class EventProblemStatement(Base):
    __tablename__ = "event_problem_statements"
    
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True)
    problem_statement_id = Column(Integer, ForeignKey("problem_statements.id", ondelete="CASCADE"), primary_key=True)
    enabled = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    local_notes = Column(Text, nullable=True)
    added_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    event = relationship("Event")
    problem_statement = relationship("ProblemStatement")


class ProblemStatementSyncLog(Base):
    __tablename__ = "problem_statement_sync_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    sync_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    source = Column(String, nullable=False)
    status = Column(String, nullable=False)  # SUCCESS, FAILED
    fetched = Column(Integer, default=0, nullable=False)
    created = Column(Integer, default=0, nullable=False)
    updated = Column(Integer, default=0, nullable=False)
    unavailable = Column(Integer, default=0, nullable=False)
    duration = Column(Float, default=0.0, nullable=False)
    triggered_by = Column(String, nullable=False)
    error_message = Column(Text, nullable=True)


class ProblemStatementVersion(Base):
    __tablename__ = "problem_statement_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    problem_statement_id = Column(Integer, ForeignKey("problem_statements.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    organization = Column(String, nullable=False)
    theme = Column(String, nullable=False)
    category = Column(String, nullable=False)
    type = Column(String, nullable=True)
    technology = Column(String, nullable=True)
    expected_solution = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    problem_statement = relationship("ProblemStatement")


class IntelligenceResult(Base):
    __tablename__ = "intelligence_results"
    
    id = Column(Integer, primary_key=True, index=True)
    college = Column(String, index=True, nullable=False)
    event_id = Column(Integer, index=True, nullable=False)
    entity_type = Column(String, nullable=False)  # STUDENT, TEAM, PROBLEM, SUBMISSION, EVALUATION, EVENT
    entity_id = Column(Integer, nullable=False)
    operation = Column(String, nullable=False)  # TEAM_COMPOSITION, PROBLEM_RECS, READINESS, JUDGE_ASSIST
    status = Column(String, default="COMPLETED", nullable=False)  # PENDING, PROCESSING, COMPLETED, FAILED
    result_json = Column(JSON, nullable=True)
    confidence = Column(String, nullable=True)  # HIGH, MEDIUM, LOW
    confidence_score = Column(Float, nullable=True)
    model = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)


class IntelligenceAuditLog(Base):
    __tablename__ = "intelligence_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    college = Column(String, nullable=True)
    event_id = Column(Integer, nullable=True)
    actor_id = Column(Integer, nullable=True)
    actor_role = Column(String, nullable=False)  # student, coordinator, judge, spoc, system
    operation = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    input_reference = Column(String, nullable=True)
    output_reference = Column(String, nullable=True)
    confidence = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    latency = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # SUCCESS, FAILED
    error = Column(Text, nullable=True)
