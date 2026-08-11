import time
from sqlalchemy.orm import Session
from app.models import ProblemStatement, Team, StudentProfile, TeamMember, IntelligenceResult
from app.intelligence.orchestrator import ai_provider
from app.intelligence.prompts import (
    PROBLEM_REC_SYSTEM, ProblemRecommendationsResponse,
    PROBLEM_EXPLAINER_SYSTEM, ProblemExplainerResponse,
    TeamProblemCompatibilityResponse
)
from app.intelligence.rag import match_problem_statements
from app.intelligence.confidence import determine_matching_confidence
from app.intelligence.audit import log_ai_call

def get_problem_recommendations(db: Session, college: str, event_id: int, idea: str, actor_id: int, actor_role: str) -> dict:
    start_time = time.time()
    
    # 1. semantic search via embeddings
    top_matches = match_problem_statements(db, college, event_id, idea, limit=3)
    
    if not top_matches:
        return {
            "analysis": "No problem statements found in cache.",
            "confidence": 0.0,
            "confidence_level": "LOW",
            "recommendations": [],
            "evidence": [],
            "warnings": ["Active problems list is empty"]
        }
        
    confidence_level, confidence_score, conf_reason = determine_matching_confidence(idea)
    
    # Format matches context for LLM explanation
    matches_context = ""
    for idx, m in enumerate(top_matches):
        p = db.query(ProblemStatement).filter(ProblemStatement.id == m["problem_statement_id"]).first()
        matches_context += (
            f"[{idx+1}] ID: {p.problem_id} (Internal ID: {p.id})\n"
            f"Title: {p.title}\n"
            f"Description: {p.description}\n\n"
        )
        
    prompt = (
        f"Student proposed solution idea: '{idea}'\n\n"
        f"List of potential matched problems:\n{matches_context}\n"
        f"Generate a ranked recommendation list explaining why each matches, identifying evidence, and warnings."
    )
    
    status = "SUCCESS"
    err_msg = None
    structured_res = None
    
    try:
        structured_res = ai_provider.generate_structured(
            prompt,
            response_schema=ProblemRecommendationsResponse,
            system_instruction=PROBLEM_REC_SYSTEM
        )
        # Enforce our computed confidence
        structured_res.confidence = confidence_score
        structured_res.confidence_level = confidence_level
        
        result_payload = structured_res.model_dump()
        
    except Exception as e:
        status = "FAILED"
        err_msg = str(e)
        # Graceful fallback so the student can still see the semantic vector matches
        recs = []
        for m in top_matches:
            recs.append({
                "problem_statement_id": m["problem_statement_id"],
                "problem_id": m["problem_id"],
                "match_score": m["score"],
                "explanation": "Matched semantically via vector cosine similarity search.",
                "evidence": [m["theme"], m["category"]],
                "warnings": []
            })
            
        result_payload = {
            "analysis": f"Vector RAG list (fallback triggered: {err_msg})",
            "confidence": 0.50,
            "confidence_level": "MEDIUM",
            "recommendations": recs,
            "evidence": ["Cosine similarity"],
            "warnings": ["LLM explanation failed, showing vector similarity indices"]
        }
        
    finally:
        latency = time.time() - start_time
        log_ai_call(
            db, college, event_id, actor_id, actor_role, "PROBLEM_RECS",
            latency, status, confidence_level, f"IdeaLen:{len(idea)}", None, err_msg
        )
        
    return result_payload

def explain_problem_statement(db: Session, problem_id: int, actor_id: int, actor_role: str) -> dict:
    start_time = time.time()
    problem = db.query(ProblemStatement).filter(ProblemStatement.id == problem_id).first()
    if not problem:
        return {"error": "Problem statement not found"}
        
    # Cache check
    cache = db.query(IntelligenceResult).filter(
        IntelligenceResult.entity_type == "PROBLEM",
        IntelligenceResult.entity_id == problem_id,
        IntelligenceResult.operation == "EXPLAIN"
    ).first()
    
    if cache and cache.status == "COMPLETED":
        return cache.result_json
        
    prompt = (
        f"Explain this official SIH Problem Statement:\n"
        f"ID: {problem.problem_id}\n"
        f"Title: {problem.title}\n"
        f"Organization: {problem.organization}\n"
        f"Theme: {problem.theme}\n"
        f"Category: {problem.category}\n"
        f"Description: {problem.description}\n"
        f"Expected Solution: {problem.expected_solution or 'N/A'}\n"
        f"Technology Area: {problem.technology_area or 'N/A'}"
    )
    
    status = "SUCCESS"
    err_msg = None
    structured_res = None
    
    try:
        structured_res = ai_provider.generate_structured(
            prompt,
            response_schema=ProblemExplainerResponse,
            system_instruction=PROBLEM_EXPLAINER_SYSTEM
        )
        
        result_payload = structured_res.model_dump()
        
        if not cache:
            cache = IntelligenceResult(
                college="GLOBAL",
                event_id=0,
                entity_type="PROBLEM",
                entity_id=problem_id,
                operation="EXPLAIN"
            )
            db.add(cache)
            
        cache.status = "COMPLETED"
        cache.result_json = result_payload
        cache.confidence = "HIGH"
        cache.confidence_score = 0.95
        cache.model = settings_model_name()
        db.commit()
        
    except Exception as e:
        status = "FAILED"
        err_msg = str(e)
        fallback = {
            "summary": problem.description,
            "target_users": "Mentioned in description.",
            "constraints": ["Please refer to the official statement text."],
            "approaches": ["Custom software stack depending on category."],
            "skills": [problem.category],
            "difficulty_analysis": {
                "technical_complexity": 5.0,
                "data_complexity": 5.0,
                "implementation_difficulty": 5.0,
                "research_requirement": 5.0,
                "hardware_requirement": 5.0
            },
            "confidence": 0.4,
            "confidence_level": "LOW"
        }
        result_payload = fallback
        
    finally:
        latency = time.time() - start_time
        log_ai_call(
            db, "GLOBAL", 0, actor_id, actor_role, "PROBLEM_EXPLAIN",
            latency, status, "HIGH", f"Problem:{problem_id}", None, err_msg
        )
        
    return result_payload

def get_team_problem_compatibility(db: Session, team_id: int, problem_id: int, actor_id: int, actor_role: str) -> dict:
    start_time = time.time()
    team = db.query(Team).filter(Team.id == team_id).first()
    problem = db.query(ProblemStatement).filter(ProblemStatement.id == problem_id).first()
    
    if not team or not problem:
        return {"error": "Team or Problem not found"}
        
    college = team.event.college_name
    event_id = team.event_id
    
    members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    departments = ", ".join(list(set(m.student.department for m in members)))
    
    prompt = (
        f"Assess compatibility between this Team and Problem Statement:\n"
        f"Team Name: {team.name}\n"
        f"Member Departments: {departments}\n\n"
        f"Problem Statement Title: {problem.title}\n"
        f"Description: {problem.description}\n"
        f"Category: {problem.category}\n"
        f"Expected Solution: {problem.expected_solution or 'N/A'}\n"
        f"Technology: {problem.technology_area or 'N/A'}"
    )
    
    status = "SUCCESS"
    err_msg = None
    structured_res = None
    
    try:
        structured_res = ai_provider.generate_structured(
            prompt,
            response_schema=TeamProblemCompatibilityResponse,
            system_instruction="You are a compatibility scorer comparing team capabilities to hackathon requirements."
        )
        result_payload = structured_res.model_dump()
    except Exception as e:
        status = "FAILED"
        err_msg = str(e)
        result_payload = {
            "match_percentage": 50.0,
            "confidence": 0.3,
            "confidence_level": "LOW",
            "matching_skills": [],
            "missing_skills": [],
            "advisory_summary": "AI Compatibility Analysis temporarily offline."
        }
        
    finally:
        latency = time.time() - start_time
        log_ai_call(
            db, college, event_id, actor_id, actor_role, "TEAM_PROBLEM_COMPAT",
            latency, status, "MEDIUM", f"Team:{team_id}-Prob:{problem_id}", None, err_msg
        )
        
    return result_payload

def settings_model_name() -> str:
    from app.config import settings
    return settings.AI_MODEL
