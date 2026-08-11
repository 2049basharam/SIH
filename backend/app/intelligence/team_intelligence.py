import time
from sqlalchemy.orm import Session
from app.models import Team, TeamMember, StudentProfile, Event, IntelligenceResult
from app.intelligence.orchestrator import ai_provider
from app.intelligence.prompts import (
    TEAM_COMPOSITION_SYSTEM, TeamCompositionResponse,
    TEAM_NAME_SYSTEM, TeamNameSimilarityResponse
)
from app.intelligence.confidence import determine_team_confidence
from app.intelligence.audit import log_ai_call

def analyze_team_composition(db: Session, team_id: int, actor_id: int, actor_role: str) -> dict:
    start_time = time.time()
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        return {"error": "Team not found"}
        
    college = team.event.college_name
    event_id = team.event_id
    
    # Cache lookup
    cache = db.query(IntelligenceResult).filter(
        IntelligenceResult.college == college,
        IntelligenceResult.event_id == event_id,
        IntelligenceResult.entity_type == "TEAM",
        IntelligenceResult.entity_id == team_id,
        IntelligenceResult.operation == "TEAM_COMPOSITION"
    ).first()
    
    if cache and cache.status == "COMPLETED":
        return cache.result_json

    # Deterministic checks (Cost Control & Safety rule: do not call LLM for simple rules)
    members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    members_count = len(members)
    
    female_count = db.query(TeamMember).join(StudentProfile).filter(
        TeamMember.team_id == team_id,
        StudentProfile.gender == "F"
    ).count()
    
    departments = [m.student.department for m in members]
    dept_str = ", ".join(departments)
    
    # Check if we have enough details to score high confidence
    confidence_level, confidence_score, conf_reason = determine_team_confidence(
        members_count, skills_listed=bool(members_count > 0)
    )
    
    # Prompt building
    prompt = (
        f"Analyze this Smart India Hackathon team composition:\n"
        f"Team Name: {team.name}\n"
        f"Member Count: {members_count} members (target: 6)\n"
        f"Female Members: {female_count} (target: at least 1)\n"
        f"Departments represented: {dept_str}\n"
        f"Review eligibility, technical diversity, and provide constructive advice."
    )
    
    status = "SUCCESS"
    err_msg = None
    structured_res = None
    
    try:
        structured_res = ai_provider.generate_structured(
            prompt, 
            response_schema=TeamCompositionResponse,
            system_instruction=TEAM_COMPOSITION_SYSTEM
        )
        
        # Override confidence dynamically based on input analysis
        structured_res.confidence = confidence_level
        structured_res.confidence_score = confidence_score
        
        result_payload = structured_res.model_dump()
        
        # Update or create cache
        if not cache:
            cache = IntelligenceResult(
                college=college,
                event_id=event_id,
                entity_type="TEAM",
                entity_id=team_id,
                operation="TEAM_COMPOSITION"
            )
            db.add(cache)
            
        cache.status = "COMPLETED"
        cache.result_json = result_payload
        cache.confidence = confidence_level
        cache.confidence_score = confidence_score
        cache.model = settings_model_name()
        db.commit()
        
    except Exception as e:
        status = "FAILED"
        err_msg = str(e)
        # Create a graceful fallback response so the portal doesn't break
        fallback = {
            "eligible": bool(members_count <= 6 and female_count >= 1),
            "technical_diversity": "MEDIUM",
            "domain_diversity": "MEDIUM",
            "role_coverage": "MEDIUM",
            "gaps": ["AI insights temporarily unavailable. Core eligibility remains active."],
            "warnings": [f"Fail-safe fallback activated: {err_msg}"],
            "confidence": "LOW",
            "confidence_score": 0.0
        }
        result_payload = fallback
        
    finally:
        latency = time.time() - start_time
        log_ai_call(
            db, college, event_id, actor_id, actor_role, "TEAM_COMPOSITION",
            latency, status, confidence_level, f"Team:{team_id}", None, err_msg
        )
        
    return result_payload

def check_name_similarity(db: Session, event_id: int, name: str) -> dict:
    """Checks proposed team name for similarities with already registered ones, in an advisory capacity."""
    # Find active event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return {"error": "Event not found"}
        
    college = event.college_name
    
    # Get other teams in event
    other_teams = db.query(Team).filter(Team.event_id == event_id, Team.name != name).all()
    other_names = [t.name for t in other_teams]
    
    if not other_names:
        return {"is_similar": False, "similar_teams": [], "warning_message": None}
        
    other_names_str = ", ".join(other_names)
    prompt = (
        f"Proposed Team Name: '{name}'\n"
        f"List of existing registered team names: {other_names_str}\n"
        f"Perform similarity checking. Report matches with score > 0.85."
    )
    
    try:
        res = ai_provider.generate_structured(
            prompt,
            response_schema=TeamNameSimilarityResponse,
            system_instruction=TEAM_NAME_SYSTEM
        )
        return res.model_dump()
    except Exception as e:
        print("Name similarity service error:", e)
        # Graceful fallback: do not block registration
        return {"is_similar": False, "similar_teams": [], "warning_message": "AI name check temporarily offline."}

def settings_model_name() -> str:
    from app.config import settings
    return settings.AI_MODEL
