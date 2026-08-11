import pytest
from datetime import datetime, timedelta
from app.models import User, StudentProfile, Event, EventSettings, Team, TeamMember, ProblemStatement, TeamProblemStatement, Submission, Evaluation, EvaluationCriteria, EvaluationScore, InvitationToken, SpocProfile, CoordinatorProfile, JudgeProfile
from app.auth import get_password_hash

def test_complete_sih_workflow_e2e(client, db):
    # ==========================================
    # 1. SETUP SPOC COLLEGE AND EVENT
    # ==========================================
    spoc_user = User(email="spoc_e2e@sih.edu", hashed_password=get_password_hash("spocpass"), role="spoc", status="ACTIVE", college="NEC")
    db.add(spoc_user)
    db.commit()
    db.refresh(spoc_user)
    
    spoc_prof = SpocProfile(user_id=spoc_user.id, full_name="SPOC E2E", college="NEC", phone="9988776655")
    db.add(spoc_prof)
    db.commit()
    
    # Login as SPOC
    spoc_token = client.post("/api/auth/login", json={"email": "spoc_e2e@sih.edu", "password": "spocpass"}).json()["access_token"]
    spoc_headers = {"Authorization": f"Bearer {spoc_token}"}
    
    # Create Event in DRAFT state
    now = datetime.utcnow()
    event_payload = {
        "name": "E2E Internal SIH 2026",
        "academic_year": "2025-2026",
        "college_name": "NEC",
        "description": "Hardened E2E Life Cycle Test Event",
        "registration_start": now - timedelta(days=1),
        "registration_end": now + timedelta(days=5),
        "team_finalization_deadline": now + timedelta(days=5),
        "problem_selection_deadline": now + timedelta(days=5),
        "submission_deadline": now + timedelta(days=5),
        "evaluation_start": now + timedelta(days=5),
        "evaluation_end": now + timedelta(days=5),
        "shortlisting_date": now + timedelta(days=5),
        "settings": {
            "team_size": 6,
            "min_female_members": 1,
            "same_college": True,
            "multi_team_membership_allowed": False,
            "team_leader_required": True,
            "team_name_unique": True,
            "team_name_no_institute": True,
            "problem_statements_limit": 2,
            "shortlist_size": 2,
            "waitlist_size": 1,
            "evaluation_method": "judge_average",
            "spoc_approval_required": True
        }
    }
    # Create event settings as SPOC using Coordinator mock (or Spoc settings routes)
    # The settings are updated via coord PUT /api/coordinator/settings
    # Let's seed the Event directly in DB to have full control
    event = Event(
        name="E2E Internal SIH 2026",
        academic_year="2025-2026",
        college_name="NEC",
        registration_start=now - timedelta(days=1),
        registration_end=now + timedelta(days=5),
        team_finalization_deadline=now + timedelta(days=5),
        problem_selection_deadline=now + timedelta(days=5),
        submission_deadline=now + timedelta(days=5),
        evaluation_start=now + timedelta(days=5),
        evaluation_end=now + timedelta(days=5),
        shortlisting_date=now + timedelta(days=5),
        status="DRAFT"
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    settings = EventSettings(
        event_id=event.id,
        team_size=6,
        min_female_members=1,
        same_college=True,
        multi_team_membership_allowed=False,
        problem_statements_limit=2,
        shortlist_size=2,
        waitlist_size=1,
        spoc_approval_required=True
    )
    db.add(settings)
    db.commit()
    
    # ==========================================
    # 2. PROVISION STAFF (COORDINATOR & JUDGES)
    # ==========================================
    # SPOC invites coordinator
    coord_invite_res = client.post("/api/spoc/coordinators", json={
        "email": "coord_e2e@sih.edu",
        "full_name": "Coord E2E",
        "department": "CSE",
        "designation": "HOD",
        "phone": "9998887776"
    }, headers=spoc_headers)
    assert coord_invite_res.status_code == 200
    coord_token_str = coord_invite_res.json()["token"]
    
    # Activate coordinator
    coord_act_res = client.post(f"/api/auth/invitation/{coord_token_str}/activate", json={
        "password": "coordpassword"
    })
    assert coord_act_res.status_code == 200
    
    # SPOC invites judge
    judge_invite_res = client.post("/api/spoc/judges", json={
        "email": "judge_e2e@sih.edu",
        "full_name": "Judge E2E",
        "organization": "IIT Madras",
        "designation": "Professor",
        "phone": "9998887777",
        "expertise": "AI/ML"
    }, headers=spoc_headers)
    assert judge_invite_res.status_code == 200
    judge_token_str = judge_invite_res.json()["token"]
    
    # Activate judge
    judge_act_res = client.post(f"/api/auth/invitation/{judge_token_str}/activate", json={
        "password": "judgepassword"
    })
    assert judge_act_res.status_code == 200
    
    # Login Coordinator
    coord_login_res = client.post("/api/auth/login", json={"email": "coord_e2e@sih.edu", "password": "coordpassword"})
    assert coord_login_res.status_code == 200
    coord_auth_token = coord_login_res.json()["access_token"]
    coord_headers = {"Authorization": f"Bearer {coord_auth_token}"}
    
    # ==========================================
    # 3. SET WORKFLOW STATE: DRAFT -> REGISTRATION_OPEN
    # ==========================================
    # Try invalid forward state jump (DRAFT -> EVALUATION should fail)
    bad_jump = client.put("/api/coordinator/settings/status?status_str=EVALUATION", headers=coord_headers)
    assert bad_jump.status_code == 400
    assert "workflow state jump" in bad_jump.json()["detail"]
    
    # Valid transition: DRAFT -> REGISTRATION_OPEN
    state_open_res = client.put("/api/coordinator/settings/status?status_str=REGISTRATION_OPEN", headers=coord_headers)
    assert state_open_res.status_code == 200
    
    # ==========================================
    # 4. REGISTER STUDENTS AND REGISTER TEAM
    # ==========================================
    # Create 6 students (1 female)
    student_headers = []
    student_profiles = []
    for i in range(1, 7):
        gender = "F" if i == 3 else "M"
        reg_res = client.post("/api/auth/register/student", json={
            "email": f"student_e2e_{i}@sih.edu",
            "password": "studentpassword",
            "student_id": f"E2EROLL{i}",
            "full_name": f"Student E2E {i}",
            "gender": gender,
            "phone": "9998887771",
            "department": "CSE",
            "branch": "CSE",
            "year": 3,
            "college": "NEC"
        })
        assert reg_res.status_code == 200
        student_profiles.append(reg_res.json())
        
        # Login student
        stud_token = client.post("/api/auth/login", json={"email": f"student_e2e_{i}@sih.edu", "password": "studentpassword"}).json()["access_token"]
        student_headers.append({"Authorization": f"Bearer {stud_token}"})
        
    # Student 1 creates Team
    leader_headers = student_headers[0]
    team_res = client.post("/api/student/teams", json={
        "name": "E2E Team Alpha",
        "event_id": event.id
    }, headers=leader_headers)
    assert team_res.status_code == 200
    team_id = team_res.json()["id"]
    
    # Add members (Students 2 to 6)
    for i in range(1, 6):
        add_res = client.post("/api/student/team/members", json={
            "student_id": student_profiles[i]["id"]
        }, headers=leader_headers)
        assert add_res.status_code == 200
        
    # ==========================================
    # 5. TEAM FINALIZATION VALIDATIONS
    # ==========================================
    # Finalize team (succeeds, all constraints satisfied)
    fin_res = client.post("/api/student/team/finalize", headers=leader_headers)
    assert fin_res.status_code == 200
    assert fin_res.json()["status"] == "FINALIZED"
    
    # ==========================================
    # 6. PROBLEM SELECTION
    # ==========================================
    # Sync Problem Statements
    prob = ProblemStatement(
        problem_id="E2E-SIH-99",
        title="IoT Smart Agriculture Drone System",
        description="Build an autonomous IoT drone tracking agricultural fields.",
        category="Software",
        theme="Agriculture",
        organization="Ministry of Science",
        technology_area="IoT, Python, Drone",
        active_status=True
    )
    db.add(prob)
    db.commit()
    db.refresh(prob)
    
    # Select problem statement
    sel_res = client.post("/api/student/team/problems", json=[prob.id], headers=leader_headers)
    assert sel_res.status_code == 200
    
    # ==========================================
    # 7. PROPOSAL SUBMISSION & VERSION LOCK
    # ==========================================
    sub_payload = {
        "problem_statement_id": prob.id,
        "project_title": "AgriDrone E2E",
        "problem_understanding": "Understanding crop health automatically.",
        "current_situation": "Manual scouting is tedious.",
        "proposed_solution": "IoT drone scanner.",
        "innovation": "Offline-first drone tracking.",
        "target_users": "Farms.",
        "technical_approach": "Drone + Pi.",
        "technology_stack": "Python, React, Flask",
        "implementation_plan": "Phase 1: Build, Phase 2: Test",
        "expected_impact": "Fast assessment.",
        "scalability": "Cloud syncing.",
        "future_scope": "Drone tracking.",
        "github_url": "https://github.com/Basharameez/AgriDrone",
        "prototype_url": "https://agridrone.demo",
        "pdf_url": "https://sih.gov/AgriDrone.pdf",
        "ppt_url": "https://sih.gov/AgriDrone.ppt"
    }
    
    # Submission is blocked while event is in REGISTRATION_OPEN status
    bad_sub_res = client.post("/api/student/submissions", json=sub_payload, headers=leader_headers)
    assert bad_sub_res.status_code == 400
    
    # Change event status to SUBMISSION_OPEN
    client.put("/api/coordinator/settings/status?status_str=TEAM_FORMATION", headers=coord_headers)
    client.put("/api/coordinator/settings/status?status_str=TEAM_FINALIZATION", headers=coord_headers)
    client.put("/api/coordinator/settings/status?status_str=PROBLEM_SELECTION", headers=coord_headers)
    client.put("/api/coordinator/settings/status?status_str=SUBMISSION_OPEN", headers=coord_headers)
    
    # Submit proposal (succeeds)
    sub_res = client.post("/api/student/submissions", json=sub_payload, headers=leader_headers)
    assert sub_res.status_code == 200
    assert sub_res.json()["version"] == 1
    
    # Update proposal (succeeds, creates version history)
    sub_payload["project_title"] = "AgriDrone E2E v2"
    sub_res2 = client.post("/api/student/submissions", json=sub_payload, headers=leader_headers)
    assert sub_res2.status_code == 200
    assert sub_res2.json()["version"] == 2
    
    # ==========================================
    # 8. JUDGE EVALUATION & SCORE LOCK
    # ==========================================
    # Create criteria
    crit = EvaluationCriteria(event_id=event.id, name="Drone Feasibility", max_score=10, weight=2.0, order_num=1)
    db.add(crit)
    db.commit()
    db.refresh(crit)
    
    # Login Judge
    judge_login_res = client.post("/api/auth/login", json={"email": "judge_e2e@sih.edu", "password": "judgepassword"})
    judge_headers = {"Authorization": f"Bearer {judge_login_res.json()['access_token']}"}
    
    # Evaluation is blocked in SUBMISSION_OPEN status
    bad_eval_res = client.post("/api/judge/evaluations", json={
        "team_id": team_id,
        "overall_comments": "Looks neat",
        "scores": [{"criteria_id": crit.id, "score": 9.0}]
    }, headers=judge_headers)
    assert bad_eval_res.status_code == 400
    
    # Change event status to SUBMISSION_CLOSED then EVALUATION
    client.put("/api/coordinator/settings/status?status_str=SUBMISSION_CLOSED", headers=coord_headers)
    client.put("/api/coordinator/settings/status?status_str=EVALUATION", headers=coord_headers)
    
    # Submission editing is now blocked for students because event is in EVALUATION status
    student_lock_res = client.post("/api/student/submissions", json=sub_payload, headers=leader_headers)
    assert student_lock_res.status_code == 400
    
    # Submit judge scorecard (succeeds)
    eval_res = client.post("/api/judge/evaluations", json={
        "team_id": team_id,
        "overall_comments": "Great project!",
        "scores": [{"criteria_id": crit.id, "score": 9.5}]
    }, headers=judge_headers)
    assert eval_res.status_code == 200
    assert eval_res.json()["total_score"] == 19.0 # 9.5 * weight 2.0
    assert eval_res.json()["submission_version"] == 2 # verify associated with correct version!
    
    # Try modifying evaluation scorecard (fails because locked)
    bad_score_edit = client.post("/api/judge/evaluations", json={
        "team_id": team_id,
        "overall_comments": "Actually bad",
        "scores": [{"criteria_id": crit.id, "score": 2.0}]
    }, headers=judge_headers)
    assert bad_score_edit.status_code == 400
    
    # ==========================================
    # 9. EVALUATION UNLOCK CORRECTION
    # ==========================================
    # Unlock scorecard for judge to update
    unlock_res = client.post(f"/api/coordinator/evaluations/{eval_res.json()['id']}/unlock", json={
        "reason": "Mistake corrected"
    }, headers=coord_headers)
    assert unlock_res.status_code == 200
    
    # Scorecard is now unlocked, judge can re-score
    eval_res_updated = client.post("/api/judge/evaluations", json={
        "team_id": team_id,
        "overall_comments": "Updated review!",
        "scores": [{"criteria_id": crit.id, "score": 8.0}]
    }, headers=judge_headers)
    assert eval_res_updated.status_code == 200
    assert eval_res_updated.json()["total_score"] == 16.0
    
    # Direct scorecard correction by administrator
    correct_res = client.post(f"/api/coordinator/evaluations/{eval_res_updated.json()['id']}/correct", json={
        "reason": "Direct score adjustment",
        "overall_comments": "Override comments",
        "scores": [{"criteria_id": crit.id, "score": 10.0}]
    }, headers=coord_headers)
    assert correct_res.status_code == 200
    
    # ==========================================
    # 10. SHORTLISTING NOMINATIONS & SPOC APPROVAL
    # ==========================================
    # Change event status to SHORTLISTING
    client.put("/api/coordinator/settings/status?status_str=SHORTLISTING", headers=coord_headers)
    
    # Students cannot see selection status yet (results are not published, returns PENDING)
    team_view_res = client.get("/api/student/team", headers=leader_headers)
    assert team_view_res.json()["selection_status"] == "PENDING"
    
    # Coordinator shortlists team
    coord_shortlist = client.post("/api/coordinator/shortlisting", json={
        "actions": [
            {
                "team_id": team_id,
                "selection_status": "SHORTLISTED",
                "reason": "Highest scoring team in department"
            }
        ]
    }, headers=coord_headers)
    assert coord_shortlist.status_code == 200
    
    # Coordinator submits proposed nominations to SPOC
    coord_submit_res = client.post("/api/coordinator/shortlisting/submit", headers=coord_headers)
    assert coord_submit_res.status_code == 200
    
    # SPOC returns nominations to coordinator (fails with return reason)
    return_res = client.post("/api/spoc/shortlisting/return", json={"reason": "Check departmental distribution"}, headers=spoc_headers)
    assert return_res.status_code == 200
    
    # Coordinator resubmits
    coord_submit_res2 = client.post("/api/coordinator/shortlisting/submit", headers=coord_headers)
    assert coord_submit_res2.status_code == 200
    
    # SPOC approves nominations (results are published, status shifts to RESULTS_PUBLISHED)
    approve_res = client.post("/api/spoc/shortlisting/approve", headers=spoc_headers)
    assert approve_res.status_code == 200
    
    # Student checks selections now (since results published, shows SHORTLISTED)
    team_view_published = client.get("/api/student/team", headers=leader_headers)
    assert team_view_published.json()["selection_status"] == "SHORTLISTED"
    
    # ==========================================
    # 11. ARCHIVE / COMPLETE EVENT
    # ==========================================
    # Transition to COMPLETED
    client.put("/api/coordinator/settings/status?status_str=COMPLETED", headers=coord_headers)
    
    # Verify final event status is COMPLETED
    event_final = db.query(Event).filter(Event.id == event.id).first()
    assert event_final.status == "COMPLETED"
