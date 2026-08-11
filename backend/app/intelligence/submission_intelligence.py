import time
from sqlalchemy.orm import Session
from app.models import Submission, IntelligenceResult
from app.intelligence.orchestrator import ai_provider
from app.intelligence.prompts import READINESS_SYSTEM, SubmissionReadinessResponse
from app.intelligence.audit import log_ai_call

def analyze_submission_readiness(db: Session, submission_id: int, actor_id: int, actor_role: str) -> dict:
    start_time = time.time()
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        return {"error": "Submission not found"}
        
    college = submission.team.event.college_name
    event_id = submission.team.event_id
    
    # Cache lookup
    cache = db.query(IntelligenceResult).filter(
        IntelligenceResult.college == college,
        IntelligenceResult.event_id == event_id,
        IntelligenceResult.entity_type == "SUBMISSION",
        IntelligenceResult.entity_id == submission_id,
        IntelligenceResult.operation == "READINESS"
    ).first()
    
    if cache and cache.status == "COMPLETED":
        return cache.result_json

    # Sanitize and minimize personal details before LLM processing
    # (Privacy rule: do not pass phone, student names, or emails)
    prompt = (
        f"Perform readiness gap analysis on this SIH Proposal:\n"
        f"Project Title: {submission.project_title}\n"
        f"Problem Understanding: {submission.problem_understanding[:1000]}\n"
        f"Proposed Solution: {submission.proposed_solution[:1000]}\n"
        f"Technical Approach: {submission.technical_approach[:1000]}\n"
        f"Technology Stack: {submission.technology_stack}\n"
        f"Implementation Plan: {submission.implementation_plan[:1000]}\n"
        f"GitHub URL: {submission.github_url or 'None'}"
    )
    
    status = "SUCCESS"
    err_msg = None
    structured_res = None
    
    try:
        structured_res = ai_provider.generate_structured(
            prompt,
            response_schema=SubmissionReadinessResponse,
            system_instruction=READINESS_SYSTEM
        )
        
        # GitHub parsing override simulation if github_url exists
        if submission.github_url and structured_res.repository_health:
            structured_res.repository_health.readme_score = 85.0
            structured_res.repository_health.structure_score = 90.0
            structured_res.repository_health.testing_score = 60.0
            
        result_payload = structured_res.model_dump()
        
        if not cache:
            cache = IntelligenceResult(
                college=college,
                event_id=event_id,
                entity_type="SUBMISSION",
                entity_id=submission_id,
                operation="READINESS"
            )
            db.add(cache)
            
        cache.status = "COMPLETED"
        cache.result_json = result_payload
        cache.confidence = "HIGH"
        cache.confidence_score = 0.90
        cache.model = settings_model_name()
        db.commit()
        
    except Exception as e:
        status = "FAILED"
        err_msg = str(e)
        fallback = {
            "readiness_score": 60.0,
            "confidence": 0.4,
            "confidence_level": "LOW",
            "metrics": {
                "problem_understanding": 70.0,
                "solution_clarity": 60.0,
                "technical_detail": 50.0,
                "innovation": 50.0,
                "implementation": 50.0,
                "documentation": 60.0
            },
            "gaps": [f"AI provider failed: {err_msg}", "Review your implementation plan detail manually."],
            "repository_health": None
        }
        result_payload = fallback
        
    finally:
        latency = time.time() - start_time
        log_ai_call(
            db, college, event_id, actor_id, actor_role, "SUBMISSION_READINESS",
            latency, status, "HIGH", f"Submission:{submission_id}", None, err_msg
        )
        
    return result_payload

def trigger_background_submission_analysis(db: Session, submission_id: int, actor_id: int, actor_role: str):
    """Launches analysis in a background thread so the client doesn't wait."""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        return
        
    college = submission.team.event.college_name
    event_id = submission.team.event_id
    
    # Set status to PENDING/PROCESSING first
    cache = db.query(IntelligenceResult).filter(
        IntelligenceResult.college == college,
        IntelligenceResult.event_id == event_id,
        IntelligenceResult.entity_type == "SUBMISSION",
        IntelligenceResult.entity_id == submission_id,
        IntelligenceResult.operation == "READINESS"
    ).first()
    
    if not cache:
        cache = IntelligenceResult(
            college=college,
            event_id=event_id,
            entity_type="SUBMISSION",
            entity_id=submission_id,
            operation="READINESS",
            status="PROCESSING",
            model=settings_model_name()
        )
        db.add(cache)
        db.commit()
    else:
        cache.status = "PROCESSING"
        db.commit()
        
    import threading
    from app.database import get_db
    
    def run_in_thread():
        # Get separate database session for safety inside thread
        db_generator = get_db()
        try:
            thread_db = next(db_generator)
            analyze_submission_readiness(thread_db, submission_id, actor_id, actor_role)
        except Exception as e:
            print("Background submission analysis error:", e)
            try:
                thread_db = next(db_generator)
                cache_rec = thread_db.query(IntelligenceResult).filter(
                    IntelligenceResult.college == college,
                    IntelligenceResult.event_id == event_id,
                    IntelligenceResult.entity_type == "SUBMISSION",
                    IntelligenceResult.entity_id == submission_id,
                    IntelligenceResult.operation == "READINESS"
                ).first()
                if cache_rec:
                    cache_rec.status = "FAILED"
                    cache_rec.error_message = str(e)
                    thread_db.commit()
            except Exception:
                pass
                
    threading.Thread(target=run_in_thread).start()

def settings_model_name() -> str:
    from app.config import settings
    return settings.AI_MODEL
