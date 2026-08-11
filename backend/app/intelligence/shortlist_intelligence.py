import time
from sqlalchemy.orm import Session
from app.models import Team, Event, Evaluation, IntelligenceResult
from app.intelligence.orchestrator import ai_provider
from app.intelligence.audit import log_ai_call
from pydantic import BaseModel, Field
from typing import List

class ShortlistInsightsResponse(BaseModel):
    summary: str = Field(description="Objective analysis of the shortlisting ranking and consistency")
    observations: List[str] = Field(description="Advisory list of highlights (e.g. highest feasibility, outlier variance)")
    statistics: str = Field(description="Summary of evaluation metrics")

def get_shortlisting_insights(db: Session, event_id: int, actor_id: int, actor_role: str) -> dict:
    start_time = time.time()
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return {"error": "Event not found"}
        
    college = event.college_name
    
    # Query finalized/participating teams
    teams = db.query(Team).filter(
        Team.event_id == event_id,
        Team.status.in_(["FINALIZED", "SUBMITTED", "SHORTLISTED", "WAITLISTED", "NOT_SELECTED"])
    ).order_by(Team.average_score.desc()).all()
    
    if not teams:
        return {
            "summary": "No finalized teams available for shortlisting analysis.",
            "observations": ["Ensure teams are finalized and graded before generating insights."],
            "statistics": "0 teams graded."
        }
        
    # Format teams context for LLM
    teams_context = ""
    for idx, t in enumerate(teams):
        # count evals
        eval_count = db.query(Evaluation).filter(Evaluation.team_id == t.id, Evaluation.submitted == True).count()
        teams_context += (
            f"Rank {idx+1}: '{t.name}' | Score: {t.average_score} | "
            f"Status: {t.selection_status} | Evaluations: {eval_count}\n"
        )
        
    prompt = (
        f"Analyze these internal SIH hackathon team scores and standings:\n\n"
        f"{teams_context}\n"
        f"Provide shortlisting observations. Highlight score consistency, "
        f"and top performers. Do NOT suggest modifications to the scores."
    )
    
    status = "SUCCESS"
    err_msg = None
    structured_res = None
    
    try:
        structured_res = ai_provider.generate_structured(
            prompt,
            response_schema=ShortlistInsightsResponse,
            system_instruction="You are a data analyst summarizing selection results."
        )
        result_payload = structured_res.model_dump()
    except Exception as e:
        status = "FAILED"
        err_msg = str(e)
        result_payload = {
            "summary": "AI Shortlisting Insights temporarily offline.",
            "observations": [
                f"Rank 1 '{teams[0].name}' has score {teams[0].average_score}",
                f"Total teams evaluated: {len(teams)}"
            ],
            "statistics": f"{len(teams)} teams processed."
        }
        
    finally:
        latency = time.time() - start_time
        log_ai_call(
            db, college, event_id, actor_id, actor_role, "SHORTLIST_INSIGHTS",
            latency, status, "MEDIUM", f"Event:{event_id}", None, err_msg
        )
        
    return result_payload
