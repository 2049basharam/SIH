import time
import math
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.models import Team, Submission, Evaluation, EvaluationScore, JudgeProfile, Event, IntelligenceResult
from app.intelligence.orchestrator import ai_provider
from app.intelligence.prompts import JUDGE_ASSIST_SYSTEM, JudgeAssistantResponse, EvaluationAnomalyResponse
from app.intelligence.audit import log_ai_call

def get_judge_evidence_assistance(db: Session, team_id: int, actor_id: int, actor_role: str) -> dict:
    start_time = time.time()
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        return {"error": "Team not found"}
        
    submission = db.query(Submission).filter(Submission.team_id == team_id, Submission.status == "FINAL").first()
    if not submission:
        return {
            "summary": "No finalized submission found for this team.",
            "evidence_found": {},
            "concerns": ["Team has not finalized their project proposal template yet."],
            "confidence": 0.0,
            "confidence_level": "LOW"
        }
        
    college = team.event.college_name
    event_id = team.event_id
    
    prompt = (
        f"Analyze this proposal for evidence of SIH Rubric criteria:\n"
        f"Project Title: {submission.project_title}\n"
        f"Proposed Solution: {submission.proposed_solution[:1000]}\n"
        f"Technical Approach: {submission.technical_approach[:1000]}\n"
        f"Innovation Description: {submission.innovation[:1000]}\n"
        f"Expected Impact: {submission.expected_impact[:1000]}\n"
        f"Target Users: {submission.target_users[:500]}\n"
        f"Read through the text and extract supporting evidence blocks. List technical concerns."
    )
    
    status = "SUCCESS"
    err_msg = None
    structured_res = None
    
    try:
        structured_res = ai_provider.generate_structured(
            prompt,
            response_schema=JudgeAssistantResponse,
            system_instruction=JUDGE_ASSIST_SYSTEM
        )
        result_payload = structured_res.model_dump()
    except Exception as e:
        status = "FAILED"
        err_msg = str(e)
        result_payload = {
            "summary": "AI Evidence Assistant failed.",
            "evidence_found": {
                "technical_feasibility": "Read full proposal to verify.",
                "innovation": "Refer to Innovation description text."
            },
            "concerns": [f"AI error: {err_msg}"],
            "confidence": 0.1,
            "confidence_level": "LOW"
        }
        
    finally:
        latency = time.time() - start_time
        log_ai_call(
            db, college, event_id, actor_id, actor_role, "JUDGE_ASSISTANCE",
            latency, status, "MEDIUM", f"Team:{team_id}", None, err_msg
        )
        
    return result_payload

def detect_evaluation_anomalies(db: Session, event_id: int, actor_id: int, actor_role: str) -> dict:
    start_time = time.time()
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return {"error": "Event not found"}
        
    college = event.college_name
    
    # 1. Deterministic Checks (Variance & outliers)
    anomalies = []
    
    # Get all evaluations in this event
    evals = db.query(Evaluation).join(Team).filter(Team.event_id == event_id, Evaluation.submitted == True).all()
    
    # Variance check per team
    teams = db.query(Team).filter(Team.event_id == event_id).all()
    for t in teams:
        team_evals = [e for e in evals if e.team_id == t.id]
        if len(team_evals) >= 2:
            scores = [e.total_score for e in team_evals]
            mean = sum(scores) / len(scores)
            variance = sum((s - mean) ** 2 for s in scores) / len(scores)
            std_dev = math.sqrt(variance)
            
            # High standard deviation indicates judge disagreement (unusual variance)
            if std_dev > 15.0 or (max(scores) - min(scores)) > 20.0:
                anomalies.append({
                    "severity": "HIGH",
                    "type": "EVALUATION_VARIANCE",
                    "description": f"Team '{t.name}' has unusually high score variance ({round(std_dev, 2)} std dev). Max score: {max(scores)}, Min score: {min(scores)}. Coordinator review suggested.",
                    "metadata": {"team_id": t.id, "std_dev": std_dev, "scores": scores}
                })
                
    # Judge pattern check
    judges = db.query(JudgeProfile).filter(JudgeProfile.college == college).all()
    all_scores = [e.total_score for e in evals]
    
    if len(all_scores) >= 5 and judges:
        overall_mean = sum(all_scores) / len(all_scores)
        
        for j in judges:
            j_evals = [e for e in evals if e.judge_id == j.id]
            if len(j_evals) >= 3:
                j_scores = [e.total_score for e in j_evals]
                j_mean = sum(j_scores) / len(j_scores)
                
                # Check for deviation from panel average
                deviation = j_mean - overall_mean
                if abs(deviation) > 15.0:
                    anomalies.append({
                        "severity": "MEDIUM",
                        "type": "OUTLIER_JUDGE",
                        "description": f"Judge '{j.full_name}' average score ({round(j_mean, 1)}) deviates significantly from panel average ({round(overall_mean, 1)}). Deviation: {round(deviation, 1)}.",
                        "metadata": {"judge_id": j.id, "judge_mean": j_mean, "overall_mean": overall_mean}
                    })
                    
                # Check for identical scores (potential flat scoring)
                unique_scores = set(j_scores)
                if len(j_scores) >= 4 and len(unique_scores) == 1:
                    anomalies.append({
                        "severity": "MEDIUM",
                        "type": "OUTLIER_JUDGE",
                        "description": f"Judge '{j.full_name}' gave identical scores ({list(unique_scores)[0]}) to all {len(j_scores)} evaluated teams.",
                        "metadata": {"judge_id": j.id, "identical_score": list(unique_scores)[0]}
                    })

    # 2. Invoke LLM to summarize findings and calculate risk index
    risk_index = 0.0
    if anomalies:
        high_risk_count = sum(1 for a in anomalies if a["severity"] == "HIGH")
        medium_risk_count = sum(1 for a in anomalies if a["severity"] == "MEDIUM")
        risk_index = min(100.0, (high_risk_count * 30.0) + (medium_risk_count * 15.0))
        
    anomalies_summary = f"Detected {len(anomalies)} selection anomalies."
    
    prompt = (
        f"Summarize these selection anomalies for the Hackathon Coordinator:\n"
        f"{json_dump(anomalies)}\n"
        f"Provide a brief, objective administrative summary."
    )
    
    status = "SUCCESS"
    err_msg = None
    
    try:
        res = ai_provider.generate_structured(
            prompt,
            response_schema=EvaluationAnomalyResponse,
            system_instruction="You are a data validation checker flagging scoring discrepancies."
        )
        # Override the calculated fields
        res.anomalies_detected = [
            AnomalyItem(
                severity=a["severity"],
                type=a["type"],
                description=a["description"],
                metadata={str(k): v for k, v in a["metadata"].items()}
            ) for a in anomalies
        ]
        res.risk_index = risk_index
        result_payload = res.model_dump()
        
    except Exception as e:
        status = "FAILED"
        err_msg = str(e)
        result_payload = {
            "anomalies_detected": anomalies,
            "risk_index": risk_index,
            "summary": anomalies_summary + f" (Summary explanation offline: {err_msg})"
        }
        
    finally:
        latency = time.time() - start_time
        log_ai_call(
            db, college, event_id, actor_id, actor_role, "EVALUATION_ANOMALIES",
            latency, status, "HIGH", f"Event:{event_id}", None, err_msg
        )
        
    return result_payload

def json_dump(obj) -> str:
    import json
    return json.dumps(obj)

class AnomalyItem(BaseModel):
    severity: str
    type: str
    description: str
    metadata: Dict[str, Any]
