def test_register_student(client):
    register_payload = {
        "email": "newstudent@sih.edu",
        "password": "mypassword",
        "student_id": "ROLL100",
        "full_name": "New Student",
        "gender": "F",
        "phone": "9999999999",
        "department": "CSE",
        "branch": "CSE",
        "year": 2,
        "college": "NEC"
    }
    response = client.post("/api/auth/register/student", json=register_payload)
    assert response.status_code == 200
    assert response.json()["student_id"] == "ROLL100"
    assert response.json()["full_name"] == "New Student"

def test_login_and_get_me(client, seed_test_data):
    # Try to login with correct credentials
    login_payload = {
        "email": "stud1@sih.edu",
        "password": "pass"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    token_data = response.json()
    assert token_data["role"] == "student"
    assert "access_token" in token_data
    
    # Try to get me profile
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_response = client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "stud1@sih.edu"
    assert me_response.json()["role"] == "student"

def test_login_failed(client, seed_test_data):
    login_payload = {
        "email": "stud1@sih.edu",
        "password": "wrongpassword"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 401
