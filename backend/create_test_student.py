from app.database import SessionLocal
from app.models import User, StudentProfile
from app.auth import get_password_hash

def create_student():
    db = SessionLocal()
    try:
        # Check if user already exists
        existing = db.query(User).filter(User.email == "teststudent@sih.edu").first()
        if existing:
            print("Test student already exists: teststudent@sih.edu / password123")
            return
        
        # Create User
        user = User(
            email="teststudent@sih.edu",
            hashed_password=get_password_hash("password123"),
            role="student"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create Profile
        profile = StudentProfile(
            user_id=user.id,
            student_id="2026SIH999",
            full_name="Test Student NEC",
            gender="M",
            phone="9988776655",
            department="Computer Science & Engineering (CSE)",
            branch="CSE",
            year=3,
            college="Narasaraopeta Engineering College (Autonomous), Narasaraopeta",
            approved_by_coordinator=True
        )
        db.add(profile)
        db.commit()
        print("Successfully created test student profile:")
        print("----------------------------------------")
        print("Email:       teststudent@sih.edu")
        print("Password:    password123")
        print("Roll Number: 2026SIH999")
        print("College:     Narasaraopeta Engineering College")
        print("Department:  Computer Science & Engineering")
        print("----------------------------------------")
    except Exception as e:
        print("Error creating student:", e)
    finally:
        db.close()

if __name__ == "__main__":
    create_student()
