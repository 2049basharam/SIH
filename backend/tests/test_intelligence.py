import pytest
from app.models import User, JudgeProfile, EvaluationCriteria, ProblemStatement, Submission, Team, SpocProfile
from app.auth import get_password_hash

def test_intelligence_suite(client, seed_test_data, db):
    # 1. Setup SPOC User & Profiles
    spoc_user = User(
        email="spoc_intel@sih.edu",
        hashed_password=get_password_hash("spocpass"),
        role="spoc",
        status="ACTIVE",
        college="NEC"
    )
    db.add(spoc_user)
    db.commit()
    db.refresh(spoc_user)
    
    spoc_prof = SpocProfile(
        user_id=spoc_user.id,
        full_name="Dr. AI SPOC",
        college="NEC",
        phone="9988776655"
    )
    db.add(spoc_prof)
    db.commit()

    # 2. Setup Judge User
    j_user = User(email="judge_intel@sih.edu", hashed_password=get_password_hash("pass"), role="judge")
    db.add(j_user)
    db.commit()
    db.refresh(j_user)
    j_profile = JudgeProfile(user_id=j_user.id, full_name="Judge Intel", organization="IIT", designation="Professor", email="judge_intel@sih.edu", college="NEC")
    db.add(j_profile)
    db.commit()

    # 3. Create a team and finalize it (using student1)
    event_id = seed_test_data["event"].id
    s1_token = client.post("/api/auth/login", json={"email": "stud1@sih.edu", "password": "pass"}).json()["access_token"]
    s1_headers = {"Authorization": f"Bearer {s1_token}"}
    
    create_res = client.post("/api/student/teams", json={"name": "Intelligence Team", "event_id": event_id}, headers=s1_headers)
    assert create_res.status_code == 200
    team_id = create_res.json()["id"]

    # Add members (including at least one female)
    for i in range(1, 6):
        stud_id = seed_test_data["students"][i].id
        client.post("/api/student/team/members", json={"student_id": stud_id}, headers=s1_headers)
    
    # Finalize the team
    fin_res = client.post("/api/student/team/finalize", headers=s1_headers)
    assert fin_res.status_code == 200

    # 4. Create seed Problem Statements
    prob = ProblemStatement(
        problem_id="SIH1600",
        title="Crop Disease AI Vision System",
        description="Build an AI vision model to detect leaf spot and other crop diseases from mobile images.",
        category="Software",
        theme="Agriculture",
        organization="Ministry of Agriculture",
        technology_area="AI/ML, Python, Flutter",
        active_status=True
    )
    db.add(prob)
    db.commit()
    db.refresh(prob)

    # Associate team with selected problem (body list of ints)
    select_res = client.post("/api/student/team/problems", json=[prob.id], headers=s1_headers)
    assert select_res.status_code == 200

    # 5. Create Draft Proposal Submission
    sub_payload = {
        "problem_statement_id": prob.id,
        "project_title": "AgriVision AI",
        "problem_understanding": "Early identification of crop disease prevents yield loss.",
        "current_situation": "Farmers must manually inspect fields and rely on experts.",
        "proposed_solution": "A mobile application powered by a CNN image classifier.",
        "innovation": "Offline-first inference on low-end devices.",
        "target_users": "Smallholder farmers in rural regions.",
        "technical_approach": "Train MobileNetV3 using PyTorch, deploy via TensorFlow Lite.",
        "technology_stack": "Flutter, PyTorch, FastAPI, Docker",
        "implementation_plan": "Phase 1: Dataset collection, Phase 2: Training, Phase 3: Deployment.",
        "expected_impact": "Reduce crop yield loss by up to 30%.",
        "scalability": "Horizontal scaling with cloud API sync.",
        "future_scope": "Support drone multi-spectral imaging.",
        "github_url": "https://github.com/Basharameez/AgriVision",
        "prototype_url": "https://agrivision.demo",
        "pdf_url": "https://sih.gov/AgriVision.pdf",
        "ppt_url": "https://sih.gov/AgriVision.ppt"
    }
    # Set event status to SUBMISSION_OPEN so students can submit
    event = seed_test_data["event"]
    event.status = "SUBMISSION_OPEN"
    db.commit()
    
    sub_res = client.post("/api/student/submissions", json=sub_payload, headers=s1_headers)
    assert sub_res.status_code == 200
    submission_id = sub_res.json()["id"]

    # ================= TEST AI ENDPOINTS =================

    # A. Problems Matching API
    match_res = client.post("/api/intelligence/problems/recommend", json={
        "idea": "We want to detect plant disease on mobile cameras.",
        "event_id": event_id
    }, headers=s1_headers)
    assert match_res.status_code == 200
    assert "recommendations" in match_res.json()
    assert match_res.json()["confidence_level"] in ["HIGH", "MEDIUM", "LOW"]

    # B. Problems Explainer API
    explain_res = client.get(f"/api/intelligence/problems/explain/{prob.id}", headers=s1_headers)
    assert explain_res.status_code == 200
    assert "summary" in explain_res.json()
    assert "constraints" in explain_res.json()

    # C. Compatibility API
    compat_res = client.get(f"/api/intelligence/problems/compatibility/{team_id}/{prob.id}", headers=s1_headers)
    assert compat_res.status_code == 200
    assert "match_percentage" in compat_res.json()

    # D. Team Composition Analysis API
    comp_res = client.get(f"/api/intelligence/team/{team_id}/composition", headers=s1_headers)
    assert comp_res.status_code == 200
    assert "technical_diversity" in comp_res.json()

    # E. Submission Analyze Trigger API
    an_res = client.post(f"/api/intelligence/submission/{submission_id}/analyze", headers=s1_headers)
    assert an_res.status_code == 200
    assert an_res.json()["status"] == "SUCCESS"

    # F. Submission Readiness API
    read_res = client.get(f"/api/intelligence/submission/{submission_id}/readiness", headers=s1_headers)
    assert read_res.status_code == 200
    assert "readiness_score" in read_res.json()
    assert "gaps" in read_res.json()

    # Set event status to EVALUATION so judges can evaluate
    event = seed_test_data["event"]
    event.status = "EVALUATION"
    db.commit()

    # G. Judge Evaluation Assistance API
    j_token = client.post("/api/auth/login", json={"email": "judge_intel@sih.edu", "password": "pass"}).json()["access_token"]
    j_headers = {"Authorization": f"Bearer {j_token}"}
    ast_res = client.get(f"/api/intelligence/evaluation/{team_id}/assistance", headers=j_headers)
    assert ast_res.status_code == 200
    assert "evidence_found" in ast_res.json()
    assert "summary" in ast_res.json()

    # H. SPOC Overview and Anomaly APIs
    sp_token = client.post("/api/auth/login", json={"email": "spoc_intel@sih.edu", "password": "spocpass"}).json()["access_token"]
    sp_headers = {"Authorization": f"Bearer {sp_token}"}
    
    anom_res = client.get(f"/api/intelligence/evaluation/{event_id}/anomalies", headers=sp_headers)
    assert anom_res.status_code == 200
    assert "anomalies_detected" in anom_res.json()

    overview_res = client.get("/api/intelligence/spoc/overview", headers=sp_headers)
    assert overview_res.status_code == 200
    assert "stats" in overview_res.json()
    assert "audit_logs" in overview_res.json()

    # I. AI Draft Announcement Broadcasting API
    draft_res = client.post("/api/intelligence/announcement/draft", json={
        "rough_text": "PPT due tomorrow. Make sure git links are public."
    }, headers=sp_headers)
    assert draft_res.status_code == 200
    assert "draft" in draft_res.json()
    assert "Review" in draft_res.json()["draft"] or "PPT" in draft_res.json()["draft"]
