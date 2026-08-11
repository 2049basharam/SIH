from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.database import get_db
from app.auth import get_current_judge
from app.models import (
    JudgeProfile, Team, TeamMember, ProblemStatement, Submission,
    Evaluation, EvaluationCriteria, EvaluationScore, Event
)
from app.schemas import TeamDetailOut, EvaluationCreate, EvaluationOut, EvaluationCriteriaOut
from app.crud import log_action

router = APIRouter(prefix="/judge", tags=["judge"])

@router.get("/teams")
def list_teams_for_evaluation(judge: JudgeProfile = Depends(get_current_judge), db: Session = Depends(get_db)):
    teams = db.query(Team).join(Event).filter(
        Event.college_name == judge.college,
        Team.status.in_(["FINALIZED", "SUBMITTED", "SHORTLISTED", "WAITLISTED", "NOT_SELECTED"])
    ).all()
    
    assigned_teams = []
    for t in teams:
        # Check if this judge has evaluated the team
        eval_record = db.query(Evaluation).filter(
            Evaluation.team_id == t.id,
            Evaluation.judge_id == judge.id
        ).first()
        
        assigned_teams.append({
            "id": t.id,
            "name": t.name,
            "leader_name": t.leader.full_name if t.leader else "N/A",
            "department": t.leader.department if t.leader else "N/A",
            "status": t.status,
            "evaluated": eval_record.submitted if eval_record else False,
            "total_score": eval_record.total_score if eval_record else 0.0
        })
        
    return assigned_teams

@router.get("/teams/{id}", response_model=TeamDetailOut)
def get_team_for_evaluation(id: int, judge: JudgeProfile = Depends(get_current_judge), db: Session = Depends(get_db)):
    team = db.query(Team).join(Event).filter(Team.id == id, Event.college_name == judge.college).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found or unauthorized")
    return team

@router.post("/evaluations", response_model=EvaluationOut)
def submit_evaluation(req: EvaluationCreate, judge: JudgeProfile = Depends(get_current_judge), db: Session = Depends(get_db)):
    # Check if team exists
    team = db.query(Team).join(Event).filter(Team.id == req.team_id, Event.college_name == judge.college).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found or unauthorized")
        
    event = team.event
    if event.status != "EVALUATION":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Evaluation is closed or not open yet for this event stage"
        )
        
    # Get current submission version
    sub = db.query(Submission).filter(Submission.team_id == req.team_id).first()
    sub_version = sub.version if sub else None
        
    # Check if evaluation already exists and is locked
    existing_eval = db.query(Evaluation).filter(
        Evaluation.team_id == req.team_id,
        Evaluation.judge_id == judge.id
    ).first()
    
    if existing_eval and existing_eval.submitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Evaluation has already been submitted and is locked"
        )
        
    # Process scores and validate against max scores
    total_score = 0.0
    scores_to_add = []
    
    for s in req.scores:
        crit = db.query(EvaluationCriteria).filter(EvaluationCriteria.id == s.criteria_id).first()
        if not crit:
            raise HTTPException(status_code=404, detail=f"Criteria ID {s.criteria_id} not found")
            
        if s.score < 0 or s.score > crit.max_score:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Score for criteria '{crit.name}' must be between 0 and {crit.max_score}. Provided: {s.score}"
            )
            
        # Weighted score = score * weight
        weighted = s.score * crit.weight
        total_score += weighted
        scores_to_add.append((crit.id, s.score))
        
    if existing_eval:
        # Update existing
        existing_eval.overall_comments = req.overall_comments
        existing_eval.total_score = total_score
        existing_eval.submitted = True
        existing_eval.submission_version = sub_version
        existing_eval.updated_at = datetime.utcnow()
        
        # Delete old individual scores
        db.query(EvaluationScore).filter(EvaluationScore.evaluation_id == existing_eval.id).delete()
        
        # Add new individual scores
        for cid, sc in scores_to_add:
            score_rec = EvaluationScore(
                evaluation_id=existing_eval.id,
                criteria_id=cid,
                score=sc
            )
            db.add(score_rec)
        eval_record = existing_eval
    else:
        # Create new
        eval_record = Evaluation(
            team_id=req.team_id,
            judge_id=judge.id,
            overall_comments=req.overall_comments,
            total_score=total_score,
            submitted=True,
            submission_version=sub_version
        )
        db.add(eval_record)
        db.commit() # Save to get ID
        
        for cid, sc in scores_to_add:
            score_rec = EvaluationScore(
                evaluation_id=eval_record.id,
                criteria_id=cid,
                score=sc
            )
            db.add(score_rec)
            
    db.commit()
    db.refresh(eval_record)
    
    # Recalculate team's overall average score
    all_evals = db.query(Evaluation).filter(
        Evaluation.team_id == req.team_id,
        Evaluation.submitted == True
    ).all()
    if all_evals:
        team.average_score = round(sum(e.total_score for e in all_evals) / len(all_evals), 2)
        db.commit()
        
    log_action(db, judge.user_id, "judge", "TEAM_EVALUATED", "Team", team.id, f"Scored team {team.name} total: {total_score}")
    return eval_record

@router.get("/criteria", response_model=List[EvaluationCriteriaOut])
def get_evaluation_criteria(judge: JudgeProfile = Depends(get_current_judge), db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.college_name == judge.college).order_by(Event.id.desc()).first()
    if not event:
        return []
    return db.query(EvaluationCriteria).filter(EvaluationCriteria.event_id == event.id).order_by(EvaluationCriteria.order_num).all()

