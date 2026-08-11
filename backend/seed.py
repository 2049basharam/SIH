from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import sys

from app.database import SessionLocal, engine, Base
from app.models import (
    User, StudentProfile, CoordinatorProfile, JudgeProfile, Event, EventSettings,
    Team, TeamMember, ProblemStatement, TeamProblemStatement, Submission,
    Evaluation, EvaluationCriteria, EvaluationScore, Announcement, Notification
)
from app.auth import get_password_hash

def seed_db():
    print("Initializing database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding system data...")
        
        # 1. Create Coordinator User
        coord_user = User(
            email="coordinator@sih.edu",
            hashed_password=get_password_hash("password123"),
            role="coordinator"
        )
        db.add(coord_user)
        db.commit()
        db.refresh(coord_user)
        
        coord_profile = CoordinatorProfile(
            user_id=coord_user.id,
            staff_id="COORD001",
            full_name="Dr. Aris Sudharma",
            department="Computer Science & Engineering",
            phone="9876543210"
        )
        db.add(coord_profile)
        
        # 2. Create Judges
        judges = []
        judge_data = [
            ("Dr. Rajesh Kumar", "rajesh.judge@sih.edu", "IIT Madras", "Professor"),
            ("Mrs. Priya Sharma", "priya.judge@sih.edu", "Microsoft", "Principal Engineer"),
            ("Mr. Amit Patel", "amit.judge@sih.edu", "TCS Research", "Lead Scientist")
        ]
        for name, email, org, desig in judge_data:
            j_user = User(
                email=email,
                hashed_password=get_password_hash("password123"),
                role="judge"
            )
            db.add(j_user)
            db.commit()
            db.refresh(j_user)
            
            j_profile = JudgeProfile(
                user_id=j_user.id,
                full_name=name,
                organization=org,
                designation=desig,
                email=email
            )
            db.add(j_profile)
            judges.append(j_profile)
        
        # 3. Create Students
        # We need 20 students. Let's make some male (M) and some female (F).
        students = []
        depts = ["Computer Science", "Information Technology", "Electronics"]
        branches = ["CSE", "IT", "ECE"]
        
        for i in range(1, 21):
            gender = "F" if i % 3 == 0 else "M"  # Generates ~7 females, ~13 males
            dept_idx = i % 3
            year = (i % 4) + 1  # Years 1 to 4
            
            s_user = User(
                email=f"student{i}@sih.edu",
                hashed_password=get_password_hash("password123"),
                role="student"
            )
            db.add(s_user)
            db.commit()
            db.refresh(s_user)
            
            s_profile = StudentProfile(
                user_id=s_user.id,
                student_id=f"2026SIH{i:03d}",
                full_name=f"Student Name {i}",
                gender=gender,
                phone=f"90000000{i:02d}",
                department=depts[dept_idx],
                branch=branches[dept_idx],
                year=year,
                college="National Engineering College",
                approved_by_coordinator=True
            )
            db.add(s_profile)
            students.append(s_profile)
            
        db.commit()
        # Refresh student profiles to get IDs
        for s in students:
            db.refresh(s)
            
        # 4. Create Event and EventSettings
        now = datetime.utcnow()
        event = Event(
            name="Internal SIH 2026",
            academic_year="2025-2026",
            college_name="National Engineering College",
            description="College Internal selection round for Smart India Hackathon 2026.",
            registration_start=now - timedelta(days=10),
            registration_end=now + timedelta(days=10),
            team_finalization_deadline=now + timedelta(days=12),
            problem_selection_deadline=now + timedelta(days=15),
            submission_deadline=now + timedelta(days=20),
            evaluation_start=now + timedelta(days=21),
            evaluation_end=now + timedelta(days=25),
            shortlisting_date=now + timedelta(days=27),
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
            team_leader_required=True,
            team_name_unique=True,
            team_name_no_institute=True,
            problem_statements_limit=2,
            shortlist_size=3,
            waitlist_size=1,
            evaluation_method="judge_average"
        )
        db.add(settings)
        db.commit()
        
        # 5. Create Rubric (Evaluation Criteria)
        criteria = [
            EvaluationCriteria(event_id=event.id, name="Problem Understanding", description="Clarity in understanding problem statement.", max_score=10, weight=1.0, order_num=1),
            EvaluationCriteria(event_id=event.id, name="Innovation", description="Novelty and creativity of the idea.", max_score=10, weight=2.0, order_num=2),
            EvaluationCriteria(event_id=event.id, name="Technical Feasibility", description="Complexity and architecture viability.", max_score=10, weight=2.0, order_num=3),
            EvaluationCriteria(event_id=event.id, name="Social Impact", description="Value and benefit to users/society.", max_score=10, weight=1.5, order_num=4),
            EvaluationCriteria(event_id=event.id, name="Presentation", description="Quality of PPT and delivery.", max_score=10, weight=1.0, order_num=5)
        ]
        for c in criteria:
            db.add(c)
        db.commit()
        
        # 6. Create Problem Statements
        problems = [
            ProblemStatement(
                problem_id="SIH1601",
                title="Smart Water Management System",
                organization="Ministry of Jal Shakti",
                theme="Smart Cities / IoT",
                category="IoT",
                description="Develop a sensor-based real-time water monitoring system to measure flow rates, detect leakages, and predict consumption demands in urban areas.",
                expected_solution="IoT dashboard, analytics engine, alerts",
                technology_area="IoT, Cloud Computing, ML",
                active_status=True
            ),
            ProblemStatement(
                problem_id="SIH1602",
                title="AI Enabled Crop Disease Detection",
                organization="Ministry of Agriculture & Farmers Welfare",
                theme="Agriculture & Rural Development",
                category="Agriculture",
                description="Build a mobile application that uses image classification models to diagnose crop foliage diseases offline and suggest localized bio-remedies.",
                expected_solution="Offline React Native / Flutter App with TensorFlow Lite model",
                technology_area="AI/ML, Mobile App Development",
                active_status=True
            ),
            ProblemStatement(
                problem_id="SIH1603",
                title="Blockchain Based Patient EHR Exchange",
                organization="Ministry of Health & Family Welfare",
                theme="Healthcare & MedTech",
                category="Healthcare",
                description="Secure sharing of Electronic Health Records (EHR) across diagnostic clinics and multi-speciality hospitals preserving patient consent control.",
                expected_solution="Hyperledger or Ethereum smart contracts with decentralized storage",
                technology_area="Blockchain, Cryptography",
                active_status=True
            ),
            ProblemStatement(
                problem_id="SIH1604",
                title="Decentralized Energy Grid Allocation",
                organization="Ministry of Power",
                theme="Renewable Energy",
                category="IoT",
                description="Optimize localized solar energy grid sharing among neighboring households using automated micro-transactions.",
                expected_solution="Smart meters simulating energy transfer paired with Solidity blockchain ledger",
                technology_area="Smart Grid, IoT, Web3",
                active_status=True
            ),
            ProblemStatement(
                problem_id="SIH1605",
                title="Fake News Detection System",
                organization="Ministry of Information & Broadcasting",
                theme="Cybersecurity & Social Media",
                category="Cybersecurity",
                description="Real-time extension or utility to track sources of media files and texts on social channels, grading credibility indicators.",
                expected_solution="NLP classifier API + Chrome Extension mockup",
                technology_area="Natural Language Processing",
                active_status=True
            )
        ]
        for p in problems:
            db.add(p)
        db.commit()
        # Refresh to get IDs
        for p in problems:
            db.refresh(p)
            
        # 7. Create Teams
        # Team 1: Tech Titans - DRAFT (4 members, 1 female. Students: 1, 2, 3 (F), 4)
        t1 = Team(event_id=event.id, name="Tech Titans", leader_id=students[0].id, status="DRAFT")
        db.add(t1)
        db.commit()
        db.refresh(t1)
        for i in [0, 1, 2, 3]:
            m = TeamMember(team_id=t1.id, student_id=students[i].id, event_id=event.id)
            db.add(m)
            
        # Team 2: Byte Busters - FINALIZED (6 members, 1 female. Students: 5, 6, 7, 8, 9 (F), 10. Leader: student 5)
        t2 = Team(event_id=event.id, name="Byte Busters", leader_id=students[4].id, status="FINALIZED")
        db.add(t2)
        db.commit()
        db.refresh(t2)
        for i in [4, 5, 6, 7, 8, 9]:
            m = TeamMember(team_id=t2.id, student_id=students[i].id, event_id=event.id)
            db.add(m)
            
        # Team 3: Dev Innovators - SUBMITTED (6 members, 2 females. Students: 11, 12 (F), 13, 14, 15 (F), 16. Leader: student 11)
        t3 = Team(event_id=event.id, name="Dev Innovators", leader_id=students[10].id, status="SUBMITTED")
        db.add(t3)
        db.commit()
        db.refresh(t3)
        for i in [10, 11, 12, 13, 14, 15]:
            m = TeamMember(team_id=t3.id, student_id=students[i].id, event_id=event.id)
            db.add(m)
            
        # Team 4: AI Avengers - DRAFT (2 members, 0 females. Students: 17, 18)
        t4 = Team(event_id=event.id, name="AI Avengers", leader_id=students[16].id, status="DRAFT")
        db.add(t4)
        db.commit()
        db.refresh(t4)
        for i in [16, 17]:
            m = TeamMember(team_id=t4.id, student_id=students[i].id, event_id=event.id)
            db.add(m)
            
        db.commit()
        
        # 8. Team Problem selections & submissions
        # Team 3 selects problem SIH1602 and SIH1605
        t3_p1 = TeamProblemStatement(team_id=t3.id, problem_statement_id=problems[1].id) # Disease detection
        t3_p2 = TeamProblemStatement(team_id=t3.id, problem_statement_id=problems[4].id) # Fake News detection
        db.add(t3_p1)
        db.add(t3_p2)
        db.commit()
        
        # Team 3 creates submission for SIH1602
        sub3 = Submission(
            team_id=t3.id,
            problem_statement_id=problems[1].id,
            project_title="KisanDost Offline Crop Doctor App",
            problem_understanding="Farmers lose significant yield due to crop foliage diseases and lack internet in remote fields to upload pictures to cloud APIs.",
            current_situation="Farmers consult local dealers who push expensive chemical treatments; no immediate scientific diagnosis exists offline.",
            proposed_solution="Lightweight TensorFlow Lite model running offline inside a React Native app that reads leaves images and matches symptoms.",
            innovation="Quantized MobileNet model optimized for entry-level smartphone GPUs with multilingual local audio guides.",
            target_users="Marginal and smallholder farmers, village agricultural workers.",
            technical_approach="1. Image Capture -> 2. TFLite classification -> 3. Confidence verification -> 4. Local DB query for remedies -> 5. Audio speech playback.",
            technology_stack="React Native, TypeScript, TensorFlow Lite, SQLite",
            implementation_plan="Month 1: Dataset collection, Month 2: Model training/quantization, Month 3: App UI & offline database, Month 4: Field testing.",
            expected_impact="30% average decrease in foliage disease crop loss, reduced toxic chemical overuse.",
            scalability="Easily add new crop classifications by dropping in new model files into the local assets folder.",
            future_scope="Integrate drone image processing via bluetooth gateways.",
            pdf_url="https://sih-uploads.s3.amazonaws.com/nec/team3/proposal.pdf",
            ppt_url="https://sih-uploads.s3.amazonaws.com/nec/team3/presentation.ppt",
            images_url="https://sih-uploads.s3.amazonaws.com/nec/team3/screenshots.zip",
            demo_video_url="https://www.youtube.com/watch?v=demo-sih-1",
            github_url="https://github.com/Basharameez/kisandost-sih",
            prototype_url="https://kisandost.sih.demo",
            version=1,
            status="FINAL"
        )
        db.add(sub3)
        db.commit()
        
        # 9. Scoring and Evaluation
        # Let's mock judge evaluations for Team 3 ("Dev Innovators")
        # Judge 1 grades Team 3
        eval1 = Evaluation(team_id=t3.id, judge_id=judges[0].id, overall_comments="Excellent offline capability, UI demo is very polished.", total_score=0.0, submitted=True)
        db.add(eval1)
        db.commit()
        db.refresh(eval1)
        
        # Add criteria scores for eval1
        # Criteria are 1 to 5
        scores = [
            (1, 9.0),  # Underst: 9 * 1 = 9
            (2, 8.5),  # Innov: 8.5 * 2 = 17
            (3, 8.0),  # Tech Feas: 8 * 2 = 16
            (4, 9.0),  # Impact: 9 * 1.5 = 13.5
            (5, 8.0)   # Presentation: 8 * 1 = 8
        ]              # Total = 63.5 / 75
        for crit_idx, sc in scores:
            es = EvaluationScore(evaluation_id=eval1.id, criteria_id=crit_idx, score=sc)
            db.add(es)
        eval1.total_score = 63.5
        db.commit()
        
        # Judge 2 grades Team 3
        eval2 = Evaluation(team_id=t3.id, judge_id=judges[1].id, overall_comments="Solid technical design. TFLite works offline nicely.", total_score=0.0, submitted=True)
        db.add(eval2)
        db.commit()
        db.refresh(eval2)
        scores2 = [
            (1, 8.0),  # 8 * 1 = 8
            (2, 9.0),  # 9 * 2 = 18
            (3, 9.0),  # 9 * 2 = 18
            (4, 8.0),  # 8 * 1.5 = 12
            (5, 9.0)   # 9 * 1 = 9
        ]              # Total = 65.0 / 75
        for crit_idx, sc in scores2:
            es = EvaluationScore(evaluation_id=eval2.id, criteria_id=crit_idx, score=sc)
            db.add(es)
        eval2.total_score = 65.0
        db.commit()
        
        # Update Team 3 average score
        t3.average_score = round((63.5 + 65.0) / 2, 2)
        db.commit()
        
        # 10. Announcements
        ann1 = Announcement(
            event_id=event.id,
            title="Internal SIH Registrations Open!",
            message="Welcome students! Registrations for the College Internal Selection Round are now officially open. Complete your profiles and start forming teams. The team size is set to 6 members, and must include at least 1 female student.",
            priority="HIGH",
            audience="ALL",
            publish_time=now - timedelta(days=2)
        )
        ann2 = Announcement(
            event_id=event.id,
            title="Important: Deadline for Team Finalization",
            message="Attention leaders: Finalize your draft teams before the deadline. Locked teams cannot be edited. If you face issue registering team mates, contact Dr. Aris Sudharma.",
            priority="MEDIUM",
            audience="DRAFT_TEAMS",
            publish_time=now
        )
        db.add(ann1)
        db.add(ann2)
        db.commit()
        
        print("Database successfully seeded!")
        print("Coordinator credentials: coordinator@sih.edu / password123")
        print("Student credentials: student1@sih.edu to student20@sih.edu / password123")
        print("Judge credentials: rajesh.judge@sih.edu, priya.judge@sih.edu / password123")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
