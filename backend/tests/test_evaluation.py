import pytest
from app.models import EvaluationCriteria, User, JudgeProfile
from app.auth import get_password_hash

def test_evaluation_and_scores(client, seed_test_data, db):
    # 1. Create a Judge User
    j_user = User(email="judge@sih.edu", hashed_password=get_password_hash("pass"), role="judge")
    db.add(j_user)
    db.commit()
    db.refresh(j_user)
    j_profile = JudgeProfile(user_id=j_user.id, full_name="Judge One", organization="IIT", designation="Professor", email="judge@sih.edu", college="NEC")
    db.add(j_profile)
    db.commit()
    
    # 2. Add Evaluation Criteria to Event
    event_id = seed_test_data["event"].id
    c1 = EvaluationCriteria(event_id=event_id, name="Innovation", max_score=10, weight=2.0, order_num=1)
    c2 = EvaluationCriteria(event_id=event_id, name="Feasibility", max_score=10, weight=1.0, order_num=2)
    db.add(c1)
    db.add(c2)
    db.commit()
    db.refresh(c1)
    db.refresh(c2)
    
    # 3. Create and finalize a team
    s1_token = client.post("/api/auth/login", json={"email": "stud1@sih.edu", "password": "pass"}).json()["access_token"]
    s1_headers = {"Authorization": f"Bearer {s1_token}"}
    create_res = client.post("/api/student/teams", json={"name": "Beta Team", "event_id": event_id}, headers=s1_headers)
    team_id = create_res.json()["id"]
    
    # Add 5 more members (at least one female)
    for i in range(1, 6):
        stud_id = seed_test_data["students"][i].id
        client.post("/api/student/team/members", json={"student_id": stud_id}, headers=s1_headers)
    client.post("/api/student/team/finalize", headers=s1_headers)
    
    # Set event status to EVALUATION
    event = seed_test_data["event"]
    event.status = "EVALUATION"
    db.commit()
    
    # 4. Login as Judge
    j_token = client.post("/api/auth/login", json={"email": "judge@sih.edu", "password": "pass"}).json()["access_token"]
    j_headers = {"Authorization": f"Bearer {j_token}"}
    
    # 5. Submit evaluation score
    eval_payload = {
        "team_id": team_id,
        "overall_comments": "Good approach",
        "scores": [
            {"criteria_id": c1.id, "score": 8.0}, # Weight 2.0 -> 16.0
            {"criteria_id": c2.id, "score": 9.0}  # Weight 1.0 -> 9.0
        ]                                         # Total = 25.0
    }
    eval_res = client.post("/api/judge/evaluations", json=eval_payload, headers=j_headers)
    assert eval_res.status_code == 200
    assert eval_res.json()["total_score"] == 25.0
    
    # 6. Verify duplicate evaluation locking: attempt to submit again should fail
    eval_res2 = client.post("/api/judge/evaluations", json=eval_payload, headers=j_headers)
    assert eval_res2.status_code == 400
