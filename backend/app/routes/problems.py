from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_user, get_current_student
from app.models import ProblemStatement, EventProblemStatement, Event, StudentProfile
from app.schemas import ProblemStatementOut

router = APIRouter(prefix="", tags=["problems"])

@router.get("/problems", response_model=List[ProblemStatementOut])
def get_problems(db: Session = Depends(get_db)):
    # Global active problem statements
    return db.query(ProblemStatement).filter(ProblemStatement.active_status == True).all()

@router.get("/problems/search", response_model=List[ProblemStatementOut])
def search_problems(q: str, db: Session = Depends(get_db)):
    return db.query(ProblemStatement).filter(
        ProblemStatement.active_status == True,
        (ProblemStatement.title.ilike(f"%{q}%") |
         ProblemStatement.description.ilike(f"%{q}%") |
         ProblemStatement.problem_id.ilike(f"%{q}%") |
         ProblemStatement.external_id.ilike(f"%{q}%"))
    ).all()

@router.get("/problems/{id}", response_model=ProblemStatementOut)
def get_problem_by_id(id: int, db: Session = Depends(get_db)):
    p = db.query(ProblemStatement).filter(ProblemStatement.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Problem statement not found")
    return p

@router.get("/problems/by-external-id/{external_id}", response_model=ProblemStatementOut)
def get_problem_by_external_id(external_id: str, db: Session = Depends(get_db)):
    p = db.query(ProblemStatement).filter(ProblemStatement.external_id == external_id.strip()).first()
    if not p:
        raise HTTPException(status_code=404, detail="Problem statement not found")
    return p

@router.get("/events/{event_id}/problems")
def get_event_problems(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Get all active problems
    problems = db.query(ProblemStatement).filter(ProblemStatement.active_status == True).all()
    res = []
    for p in problems:
        # Check enabled status
        ep = db.query(EventProblemStatement).filter(
            EventProblemStatement.event_id == event_id,
            EventProblemStatement.problem_statement_id == p.id
        ).first()
        enabled = ep.enabled if ep else True # Default to True
        res.append({
            "id": p.id,
            "problem_id": p.problem_id,
            "external_id": p.external_id,
            "title": p.title,
            "organization": p.organization,
            "theme": p.theme,
            "category": p.category,
            "description": p.description,
            "enabled": enabled,
            "version": p.version
        })
    return res

@router.post("/events/{event_id}/problems/{problem_id}/enable")
def enable_event_problem(event_id: int, problem_id: int, db: Session = Depends(get_db)):
    ep = db.query(EventProblemStatement).filter(
        EventProblemStatement.event_id == event_id,
        EventProblemStatement.problem_statement_id == problem_id
    ).first()
    if not ep:
        ep = EventProblemStatement(event_id=event_id, problem_statement_id=problem_id, enabled=True)
        db.add(ep)
    else:
        ep.enabled = True
    db.commit()
    return {"detail": "Problem statement enabled for event"}

@router.post("/events/{event_id}/problems/{problem_id}/disable")
def disable_event_problem(event_id: int, problem_id: int, db: Session = Depends(get_db)):
    ep = db.query(EventProblemStatement).filter(
        EventProblemStatement.event_id == event_id,
        EventProblemStatement.problem_statement_id == problem_id
    ).first()
    if not ep:
        ep = EventProblemStatement(event_id=event_id, problem_statement_id=problem_id, enabled=False)
        db.add(ep)
    else:
        ep.enabled = False
    db.commit()
    return {"detail": "Problem statement disabled for event"}
