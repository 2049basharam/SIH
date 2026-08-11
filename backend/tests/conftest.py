import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.auth import get_password_hash
from app.models import User, StudentProfile, CoordinatorProfile, Event, EventSettings

# Use a separate SQLite DB for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_sih.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Recreate tables for every test function to keep tests independent
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db_session = TestingSessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

@pytest.fixture(scope="function")
def client(db):
    # Override get_db dependency to point to the test session
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def seed_test_data(db):
    # 1. Create a Coordinator
    c_user = User(email="coord@sih.edu", hashed_password=get_password_hash("pass"), role="coordinator")
    db.add(c_user)
    db.commit()
    db.refresh(c_user)
    c_profile = CoordinatorProfile(user_id=c_user.id, staff_id="C01", full_name="Admin", department="CSE", college="NEC")
    db.add(c_profile)
    
    # 2. Create Students (6 males, 2 females)
    students = []
    for i in range(1, 9):
        gender = "F" if i in [3, 7] else "M"
        s_user = User(email=f"stud{i}@sih.edu", hashed_password=get_password_hash("pass"), role="student")
        db.add(s_user)
        db.commit()
        db.refresh(s_user)
        s_profile = StudentProfile(
            user_id=s_user.id,
            student_id=f"ROLL{i}",
            full_name=f"Student {i}",
            gender=gender,
            phone="9988776655",
            department="CSE",
            branch="CSE",
            year=3,
            college="NEC",
            approved_by_coordinator=True
        )
        db.add(s_profile)
        students.append(s_profile)
        
    # 3. Create Event & Settings
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    event = Event(
        name="NEC SIH Test",
        academic_year="2026",
        college_name="NEC",
        registration_start=now - timedelta(days=1),
        registration_end=now + timedelta(days=5),
        team_finalization_deadline=now + timedelta(days=5),
        problem_selection_deadline=now + timedelta(days=5),
        submission_deadline=now + timedelta(days=5),
        evaluation_start=now + timedelta(days=5),
        evaluation_end=now + timedelta(days=5),
        shortlisting_date=now + timedelta(days=5),
        status="REGISTRATION_OPEN"
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
        waitlist_size=1
    )
    db.add(settings)
    db.commit()
    
    return {
        "coordinator": c_user,
        "students": students,
        "event": event
    }
