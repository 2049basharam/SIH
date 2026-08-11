import pytest

def test_team_flow(client, seed_test_data):
    # 1. Login as Student 1 (Male)
    login_res = client.post("/api/auth/login", json={"email": "stud1@sih.edu", "password": "pass"})
    s1_token = login_res.json()["access_token"]
    s1_headers = {"Authorization": f"Bearer {s1_token}"}
    
    # 2. Login as Coordinator
    coord_login = client.post("/api/auth/login", json={"email": "coord@sih.edu", "password": "pass"})
    coord_token = coord_login.json()["access_token"]
    coord_headers = {"Authorization": f"Bearer {coord_token}"}
    
    # 3. Create Team
    event_id = seed_test_data["event"].id
    create_res = client.post("/api/student/teams", json={"name": "Alpha Team", "event_id": event_id}, headers=s1_headers)
    assert create_res.status_code == 200
    team_id = create_res.json()["id"]
    
    # Verify leader ID is set to student 1 (the first profile in seed data is stud1, which has student profile ID 1)
    # Let's get student 1 profile ID
    s1_profile_id = seed_test_data["students"][0].id
    assert create_res.json()["leader_id"] == s1_profile_id
    
    # 4. Attempt to finalize with only 1 member (fails team size validation)
    fin_res = client.post("/api/student/team/finalize", headers=s1_headers)
    assert fin_res.status_code == 400
    assert "Team size requirement not met" in fin_res.json()["detail"]
    
    # 5. Add members. We need 6 total.
    # Currently has Student 1.
    # Let's add Students 2, 3 (Female), 4, 5, 6.
    # That gives 5 Males, 1 Female.
    for i in range(1, 6): # index 1 to 5 corresponds to Students 2 to 6
        stud_id = seed_test_data["students"][i].id
        add_res = client.post("/api/student/team/members", json={"student_id": stud_id}, headers=s1_headers)
        assert add_res.status_code == 200
        
    # Check duplicate membership: Attempt to add Student 2 to same team again (fails since student 2 already in team)
    duplicate_add = client.post("/api/student/team/members", json={"student_id": seed_test_data["students"][1].id}, headers=s1_headers)
    assert duplicate_add.status_code == 400
    
    # 6. Finalize team (should succeed since we have 6 members and student 3 is female)
    fin_res2 = client.post("/api/student/team/finalize", headers=s1_headers)
    assert fin_res2.status_code == 200
    assert fin_res2.json()["status"] == "FINALIZED"
    
    # 7. Verify lock: Attempt to add Student 7 (Female) after finalization (should fail since team is locked)
    post_fin_add = client.post("/api/student/team/members", json={"student_id": seed_test_data["students"][6].id}, headers=s1_headers)
    assert post_fin_add.status_code == 400
    assert "locked" in post_fin_add.json()["detail"].lower()
    
    # 8. Unlock by Coordinator
    unlock_res = client.post(f"/api/coordinator/teams/{team_id}/unlock", json={"reason": "Incorrect team structure"}, headers=coord_headers)
    assert unlock_res.status_code == 200
    assert unlock_res.json()["status"] == "ADMIN_UNLOCKED"
    
    # 9. Verify unlocked editing: Add Student 7 (should succeed now)
    # Wait, we first have to remove a member because team size is max 6.
    # Let's remove Student 6 first.
    s6_id = seed_test_data["students"][5].id
    rem_res = client.delete(f"/api/student/team/members/{s6_id}", headers=s1_headers)
    assert rem_res.status_code == 200
    
    # Now add Student 7 (Female)
    s7_id = seed_test_data["students"][6].id
    add_res2 = client.post("/api/student/team/members", json={"student_id": s7_id}, headers=s1_headers)
    assert add_res2.status_code == 200
    
    # Finalize again
    fin_res3 = client.post("/api/student/team/finalize", headers=s1_headers)
    assert fin_res3.status_code == 200
    assert fin_res3.json()["status"] == "FINALIZED"
