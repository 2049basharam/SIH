from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# ----------------- Structured JSON Schema Definitions -----------------

class TeamCompositionResponse(BaseModel):
    eligible: bool = Field(description="True if the team is legally eligible for the internal event")
    technical_diversity: str = Field(description="Diversity level: HIGH, MEDIUM, LOW")
    domain_diversity: str = Field(description="Diversity level: HIGH, MEDIUM, LOW")
    role_coverage: str = Field(description="Role coverage level: HIGH, MEDIUM, LOW")
    gaps: List[str] = Field(description="List of technical/skill gaps in the team")
    warnings: List[str] = Field(description="List of composition warnings (e.g. lack of female representation, too small)")
    confidence: str = Field(description="Confidence rating: HIGH, MEDIUM, LOW")
    confidence_score: float = Field(description="Numeric confidence value 0.0 - 1.0")

class SimilarTeamItem(BaseModel):
    team_id: int
    name: str
    similarity_score: float

class TeamNameSimilarityResponse(BaseModel):
    is_similar: bool = Field(description="True if a name with extremely high similarity or offensive/inappropriate character is found")
    similar_teams: List[SimilarTeamItem] = Field(description="List of matching similar team names and their score")
    warning_message: Optional[str] = Field(description="Advisory message for team leader to select distinctive names")

class RecommendationItem(BaseModel):
    problem_statement_id: int
    problem_id: str
    match_score: float
    explanation: str
    evidence: List[str]
    warnings: List[str]

class ProblemRecommendationsResponse(BaseModel):
    analysis: str = Field(description="Strategic summary of why these matches are returned")
    confidence: float = Field(description="Confidence score 0.0 to 1.0")
    confidence_level: str = Field(description="Confidence category: HIGH, MEDIUM, LOW")
    recommendations: List[RecommendationItem] = Field(description="Ranked list of recommended problem statement matches")
    evidence: List[str] = Field(description="List of semantic matches found")
    warnings: List[str] = Field(description="List of potential mismatch warnings")

class DifficultyAnalysis(BaseModel):
    technical_complexity: float = Field(description="Rating 1-10")
    data_complexity: float = Field(description="Rating 1-10")
    implementation_difficulty: float = Field(description="Rating 1-10")
    research_requirement: float = Field(description="Rating 1-10")
    hardware_requirement: float = Field(description="Rating 1-10")

class ProblemExplainerResponse(BaseModel):
    summary: str = Field(description="Clear explanation of the problem statement")
    target_users: str = Field(description="Description of the end users or ministry experiencing the problem")
    constraints: List[str] = Field(description="Technical and process constraints explicitly mentioned in description")
    approaches: List[str] = Field(description="Possible technical architectures and machine learning approaches")
    skills: List[str] = Field(description="List of recommended tech stack skills (e.g. PyTorch, Flutter)")
    difficulty_analysis: DifficultyAnalysis = Field(description="Technical complexity ratings")
    confidence: float
    confidence_level: str

class TeamProblemCompatibilityResponse(BaseModel):
    match_percentage: float = Field(description="Compatibility match percent 0.0 - 100.0")
    confidence: float
    confidence_level: str
    matching_skills: List[str] = Field(description="Skills that the team possesses that match the problem requirements")
    missing_skills: List[str] = Field(description="Required skills that the team currently lacks")
    advisory_summary: str = Field(description="Advisory statement on how the team can bridge gaps")

class SubmissionReadinessMetrics(BaseModel):
    problem_understanding: float = Field(description="Score 0.0 - 100.0")
    solution_clarity: float = Field(description="Score 0.0 - 100.0")
    technical_detail: float = Field(description="Score 0.0 - 100.0")
    innovation: float = Field(description="Score 0.0 - 100.0")
    implementation: float = Field(description="Score 0.0 - 100.0")
    documentation: float = Field(description="Score 0.0 - 100.0")

class GithubHealthMetrics(BaseModel):
    readme_score: float = Field(description="README completeness score")
    documentation_score: float = Field(description="Documentation files coverage")
    structure_score: float = Field(description="Clean folder hierarchy rating")
    testing_score: float = Field(description="Unit/Integration test files rating")
    recommendations: List[str] = Field(description="Advisory action items for repository improvement")

class SubmissionReadinessResponse(BaseModel):
    readiness_score: float = Field(description="Weighted total readiness percentage 0.0 - 100.0")
    confidence: float
    confidence_level: str
    metrics: SubmissionReadinessMetrics
    gaps: List[str] = Field(description="Critical missing fields or abstract gaps identified")
    repository_health: Optional[GithubHealthMetrics] = Field(description="GitHub repository analysis details if available")

class JudgeAssistantResponse(BaseModel):
    summary: str = Field(description="One-paragraph objective summary of the submission architecture")
    evidence_found: Dict[str, str] = Field(description="Criterion-specific supporting evidence found in submission text")
    concerns: List[str] = Field(description="Technological architecture gaps or unverified claims for the judge to inspect")
    confidence: float
    confidence_level: str

class AnomalyItem(BaseModel):
    severity: str = Field(description="Severity: HIGH, MEDIUM, LOW")
    type: str = Field(description="Type: EVALUATION_VARIANCE, OUTLIER_JUDGE, SCRIPT_ADMIN")
    description: str = Field(description="Detailed explanation of the variance or pattern anomaly")
    metadata: Dict[str, Any] = Field(description="Context variables (e.g. team_id, score_difference)")

class EvaluationAnomalyResponse(BaseModel):
    anomalies_detected: List[AnomalyItem] = Field(description="List of detected anomalies")
    risk_index: float = Field(description="Overall health threat metric 0.0 - 100.0")
    summary: str = Field(description="Statistical and pattern analysis summary of the event evaluations")

class AnnouncementDraftResponse(BaseModel):
    draft: str = Field(description="Drafted professional announcement text")

# ----------------- Prompt Templates -----------------

TEAM_COMPOSITION_SYSTEM = (
    "You are an expert Smart India Hackathon mentor. "
    "Analyze the team profiles, skillsets, and roles to provide advisory feedback."
)

TEAM_NAME_SYSTEM = (
    "You are a linguistic filter for team registration names. "
    "Check names for similarity to existing groups or inappropriate content."
)

PROBLEM_REC_SYSTEM = (
    "You are a semantic matcher for the Smart India Hackathon. "
    "Return the best official problem statement matches based on the student's solution idea description."
)

PROBLEM_EXPLAINER_SYSTEM = (
    "You are a technical analyst explaining official SIH problem statements. "
    "Highlight target users, constraints, and technologies, while remaining evidence-based. "
    "Do not invent new requirements that are not in the description."
)

READINESS_SYSTEM = (
    "You are an expert evaluator assessing the technical readiness of student solution proposals. "
    "Perform a detail-oriented gap analysis of the architecture and repository."
)

JUDGE_ASSIST_SYSTEM = (
    "You are a silent AI assistant helping judges examine hackathon project submissions. "
    "Find evidence supporting their rubrics, and highlight areas requiring checkup. "
    "Do NOT score the submission yourself."
)

ANNOUNCEMENT_SYSTEM = (
    "You are a copywriter drafting professional, concise announcements for college Selection events."
)
