import math
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models import ProblemStatement, IntelligenceResult
from app.intelligence.orchestrator import ai_provider

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Pure Python cosine similarity calculation, completely dependency-free."""
    if len(v1) != len(v2) or not v1:
        return 0.0
    dot_product = sum(x * y for x, y in zip(v1, v2))
    mag1 = math.sqrt(sum(x * x for x in v1))
    mag2 = math.sqrt(sum(y * y for y in v2))
    if mag1 == 0.0 or mag2 == 0.0:
        return 0.0
    return dot_product / (mag1 * mag2)

def get_or_create_problem_embedding(db: Session, problem: ProblemStatement) -> List[float]:
    """Retrieves cached vector embedding for a problem statement or computes a new one."""
    # Check cache
    cache = db.query(IntelligenceResult).filter(
        IntelligenceResult.entity_type == "PROBLEM",
        IntelligenceResult.entity_id == problem.id,
        IntelligenceResult.operation == "EMBEDDING"
    ).first()
    
    if cache and cache.result_json and "values" in cache.result_json:
        return cache.result_json["values"]
        
    # Generate embedding
    content = f"{problem.title} {problem.theme} {problem.category} {problem.description}"
    try:
        vector = ai_provider.embed(content)
        # Store in cache
        new_cache = IntelligenceResult(
            college="GLOBAL",
            event_id=0,
            entity_type="PROBLEM",
            entity_id=problem.id,
            operation="EMBEDDING",
            result_json={"values": vector},
            model=settings_model_name()
        )
        db.add(new_cache)
        db.commit()
        return vector
    except Exception as e:
        print(f"Failed to generate embedding for problem {problem.problem_id}: {e}")
        # Return mock fallback vector so system is fail-safe
        return [0.1] * 768

def settings_model_name() -> str:
    from app.config import settings
    return settings.EMBEDDING_MODEL

def match_problem_statements(db: Session, college: str, event_id: int, idea: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Ranks all active problem statements based on semantic similarity to a student idea."""
    if not idea.strip():
        return []
        
    try:
        idea_vector = ai_provider.embed(idea)
    except Exception as e:
        print("Failed to embed search idea:", e)
        idea_vector = [0.1] * 768
        
    # Get all active problem statements
    problems = db.query(ProblemStatement).filter(ProblemStatement.active_status == True).all()
    
    matches = []
    for p in problems:
        p_vector = get_or_create_problem_embedding(db, p)
        score = cosine_similarity(idea_vector, p_vector)
        matches.append({
            "problem_statement_id": p.id,
            "problem_id": p.problem_id,
            "title": p.title,
            "organization": p.organization,
            "theme": p.theme,
            "category": p.category,
            "score": round(score, 4)
        })
        
    # Sort matches by score descending
    matches.sort(key=lambda x: x["score"], reverse=True)
    return matches[:limit]
