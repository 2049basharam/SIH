export interface User {
  id: number;
  email: string;
  role: 'student' | 'coordinator' | 'judge';
}

export interface StudentProfile {
  id: number;
  user_id: number;
  student_id: string;
  full_name: string;
  gender: 'M' | 'F' | 'Other';
  email?: string;
  phone?: string;
  department: string;
  branch: string;
  year: number;
  college: string;
  approved_by_coordinator: boolean;
}

export interface CoordinatorProfile {
  id: number;
  user_id: number;
  staff_id: string;
  full_name: string;
  department: string;
  phone?: string;
}

export interface JudgeProfile {
  id: number;
  user_id: number;
  full_name: string;
  organization: string;
  designation: string;
  email: string;
}

export interface EventSettings {
  id: number;
  event_id: number;
  team_size: number;
  min_female_members: number;
  same_college: boolean;
  multi_team_membership_allowed: boolean;
  team_leader_required: boolean;
  team_name_unique: boolean;
  team_name_no_institute: boolean;
  problem_statements_limit: number;
  shortlist_size: number;
  waitlist_size: number;
  evaluation_method: string;
}

export interface Event {
  id: number;
  name: string;
  academic_year: string;
  college_name: string;
  description?: string;
  registration_start: string;
  registration_end: string;
  team_finalization_deadline: string;
  problem_selection_deadline: string;
  submission_deadline: string;
  evaluation_start: string;
  evaluation_end: string;
  shortlisting_date: string;
  status: 'DRAFT' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'SUBMISSION_OPEN' | 'SUBMISSION_CLOSED' | 'INTERNAL_HACKATHON' | 'EVALUATION' | 'SHORTLISTING' | 'COMPLETED';
  settings?: EventSettings;
}

export interface TeamMember {
  team_id: number;
  student_id: number;
  student: StudentProfile;
}

export interface ProblemStatement {
  id: number;
  problem_id: string;
  title: string;
  organization: string;
  theme: string;
  category: string;
  description: string;
  expected_solution?: string;
  technology_area?: string;
  active_status: boolean;
}

export interface TeamProblem {
  problem_statement: ProblemStatement;
}

export interface Submission {
  id: number;
  team_id: number;
  problem_statement_id: number;
  project_title: string;
  problem_understanding: string;
  current_situation: string;
  proposed_solution: string;
  innovation: string;
  target_users: string;
  technical_approach: string;
  technology_stack: string;
  implementation_plan: string;
  expected_impact: string;
  scalability: string;
  future_scope: string;
  pdf_url?: string;
  ppt_url?: string;
  images_url?: string;
  demo_video_url?: string;
  github_url?: string;
  prototype_url?: string;
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: number;
  event_id: number;
  name: string;
  leader_id?: number;
  status: 'DRAFT' | 'READY_TO_FINALIZE' | 'FINALIZED' | 'ADMIN_UNLOCKED' | 'SUBMITTED' | 'SHORTLISTED' | 'WAITLISTED' | 'NOT_SELECTED';
  average_score: number;
  selection_status: 'PENDING' | 'SHORTLISTED' | 'WAITLISTED' | 'NOT_SELECTED';
  selection_reason?: string;
  created_at: string;
  finalized_at?: string;
  leader?: StudentProfile;
  members?: TeamMember[];
  selected_problems?: TeamProblem[];
  submissions?: Submission[];
}

export interface EvaluationCriteria {
  id: number;
  event_id: number;
  name: string;
  description?: string;
  max_score: number;
  weight: number;
  order_num: number;
}

export interface EvaluationScore {
  criteria_id: number;
  score: number;
  criteria: EvaluationCriteria;
}

export interface Evaluation {
  id: number;
  team_id: number;
  judge_id: number;
  overall_comments?: string;
  total_score: number;
  submitted: boolean;
  created_at: string;
  scores?: EvaluationScore[];
  judge?: JudgeProfile;
}

export interface Announcement {
  id: number;
  event_id: number;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  audience: string;
  audience_metadata?: string;
  publish_time: string;
  expiry_time?: string;
}

export interface Notification {
  id: number;
  student_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_id?: number;
  actor_role: string;
  action: string;
  entity: string;
  entity_id?: number;
  timestamp: string;
  reason?: string;
  metadata_json?: any;
}

export interface CoordinatorStats {
  total_students: number;
  teams_created: number;
  teams_finalized: number;
  incomplete_teams: number;
  teams_with_problems: number;
  submissions_completed: number;
  submissions_pending: number;
  participating_teams: number;
  evaluated_teams: number;
  pending_evaluations: number;
  shortlisted_teams: number;
  waitlisted_teams: number;
  not_selected_teams: number;
}
