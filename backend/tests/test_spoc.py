import pytest
from app.auth import get_password_hash
from app.models import User, SpocProfile, CoordinatorProfile, InvitationToken, ProblemStatement, ProblemStatementSyncLog
from datetime import datetime, timedelta

@pytest.fixture(scope="function")
def seed_spoc(db):
    # Create SPOC user
    spoc_user = User(
        email="spoc@sih.edu",
        hashed_password=get_password_hash("spocpass"),
        role="spoc",
        status="ACTIVE",
        college="NEC"
    )
    db.add(spoc_user)
    db.commit()
    db.refresh(spoc_user)
    
    spoc_profile = SpocProfile(
        user_id=spoc_user.id,
        full_name="Dr. SPOC Director",
        college="NEC",
        phone="9988776655"
    )
    db.add(spoc_profile)
    db.commit()
    
    return spoc_user

def test_spoc_login_and_dashboard(client, seed_spoc):
    # 1. Login
    login_payload = {
        "email": "spoc@sih.edu",
        "password": "spocpass"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == 200
    token = res.json()["access_token"]
    assert res.json()["role"] == "spoc"
    
    # 2. Get Dashboard
    headers = {"Authorization": f"Bearer {token}"}
    dashboard_res = client.get("/api/spoc/dashboard", headers=headers)
    assert dashboard_res.status_code == 200
    data = dashboard_res.json()
    assert data["college"] == "NEC"
    assert data["spoc_name"] == "Dr. SPOC Director"
    assert "students" in data

def test_spoc_provisioning_workflow(client, seed_spoc, db):
    # Login as SPOC
    login_payload = {"email": "spoc@sih.edu", "password": "spocpass"}
    token = client.post("/api/auth/login", json=login_payload).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Provision Coordinator
    payload = {
        "full_name": "Coordinator Rajesh",
        "email": "rajesh@sih.edu",
        "phone": "9876543210",
        "department": "CSE",
        "designation": "Associate Professor"
    }
    res = client.post("/api/spoc/coordinators", json=payload, headers=headers)
    assert res.status_code == 200
    token_str = res.json()["token"]
    assert res.json()["status"] == "INVITED"
    
    # Verify invitation token exists and is valid
    inv_res = client.get(f"/api/auth/invitation/{token_str}")
    assert inv_res.status_code == 200
    assert inv_res.json()["email"] == "rajesh@sih.edu"
    assert inv_res.json()["role"] == "coordinator"
    
    # 2. Activate Account with password
    activate_res = client.post(f"/api/auth/invitation/{token_str}/activate", json={"password": "rajeshpassword"})
    assert activate_res.status_code == 200
    
    # 3. Verify token is now invalid/used
    inv_res2 = client.get(f"/api/auth/invitation/{token_str}")
    assert inv_res2.status_code == 404 # Token already used/invalid
    
    # 4. Try logging in as new coordinator
    coord_login = client.post("/api/auth/login", json={"email": "rajesh@sih.edu", "password": "rajeshpassword"})
    assert coord_login.status_code == 200
    assert coord_login.json()["role"] == "coordinator"
    
    # 5. SPOC disables the coordinator account
    user_rec = db.query(User).filter(User.email == "rajesh@sih.edu").first()
    disable_res = client.patch(f"/api/spoc/users/{user_rec.id}/status", json={"status": "DISABLED"}, headers=headers)
    assert disable_res.status_code == 200
    
    # 6. Logging in as disabled coordinator should fail
    coord_login_fail = client.post("/api/auth/login", json={"email": "rajesh@sih.edu", "password": "rajeshpassword"})
    assert coord_login_fail.status_code == 400
    assert "disabled" in coord_login_fail.json()["detail"].lower()

def test_spoc_reissue_invitation(client, seed_spoc, db):
    login_payload = {"email": "spoc@sih.edu", "password": "spocpass"}
    token = client.post("/api/auth/login", json=login_payload).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Invite coordinator
    payload = {
        "full_name": "Coordinator Suresh",
        "email": "suresh@sih.edu",
        "phone": "9876543211",
        "department": "ECE",
        "designation": "Professor"
    }
    client.post("/api/spoc/coordinators", json=payload, headers=headers)
    user_rec = db.query(User).filter(User.email == "suresh@sih.edu").first()
    
    # Reissue invitation token
    reissue_res = client.post(f"/api/spoc/users/{user_rec.id}/invitation", headers=headers)
    assert reissue_res.status_code == 200
    new_token = reissue_res.json()["token"]
    assert new_token is not None

def test_problem_statements_sync(client, seed_spoc, db):
    login_payload = {"email": "spoc@sih.edu", "password": "spocpass"}
    token = client.post("/api/auth/login", json=login_payload).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Trigger sync
    sync_res = client.post("/api/spoc/problem-statements/sync", headers=headers)
    assert sync_res.status_code == 200
    assert "started" in sync_res.json()["detail"]
