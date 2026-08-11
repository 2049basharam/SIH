from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User, StudentProfile, CoordinatorProfile, JudgeProfile, SpocProfile, InvitationToken
from app.schemas import LoginRequest, Token, UserOut, StudentRegisterRequest, StudentProfileOut, InvitationActivateRequest
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register/student", response_model=StudentProfileOut)
def register_student(req: StudentRegisterRequest, db: Session = Depends(get_db)):
    # Check if email exists
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if student ID (roll number) exists
    existing_profile = db.query(StudentProfile).filter(StudentProfile.student_id == req.student_id).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student roll number already exists"
        )
    
    # Create user
    user = User(
        email=req.email,
        hashed_password=get_password_hash(req.password),
        role="student"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create student profile
    profile = StudentProfile(
        user_id=user.id,
        student_id=req.student_id,
        full_name=req.full_name,
        gender=req.gender,
        phone=req.phone,
        department=req.department,
        branch=req.branch,
        year=req.year,
        college=req.college,
        approved_by_coordinator=True # Auto approved for testing/demo
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return profile

@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if user.status in ["DISABLED", "SUSPENDED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Your account status is {user.status}. Please contact your SPOC."
        )
    elif user.status == "INVITED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account has not been activated yet. Please click the activation link first."
        )
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = None
    if current_user.role == "student":
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    elif current_user.role == "coordinator":
        profile = db.query(CoordinatorProfile).filter(CoordinatorProfile.user_id == current_user.id).first()
    elif current_user.role == "judge":
        profile = db.query(JudgeProfile).filter(JudgeProfile.user_id == current_user.id).first()
    elif current_user.role == "spoc":
        profile = db.query(SpocProfile).filter(SpocProfile.user_id == current_user.id).first()
        
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "profile": profile
    }

@router.post("/logout")
def logout():
    return {"detail": "Logged out successfully"}

@router.get("/invitation/{token}")
def get_invitation(token: str, db: Session = Depends(get_db)):
    inv_token = db.query(InvitationToken).filter(InvitationToken.token == token, InvitationToken.used == False).first()
    if not inv_token:
        raise HTTPException(status_code=404, detail="Invitation token not found or already used")
    if inv_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invitation token has expired")
        
    user = db.query(User).filter(User.id == inv_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    name = ""
    dept = ""
    if user.role == "coordinator":
        profile = db.query(CoordinatorProfile).filter(CoordinatorProfile.user_id == user.id).first()
        if profile:
            name = profile.full_name
            dept = profile.department
    elif user.role == "judge":
        profile = db.query(JudgeProfile).filter(JudgeProfile.user_id == user.id).first()
        if profile:
            name = profile.full_name
            dept = profile.organization
            
    return {
        "email": user.email,
        "role": user.role,
        "name": name,
        "department_or_org": dept,
        "college": user.college
    }

@router.post("/invitation/{token}/activate")
def activate_invitation(token: str, req: InvitationActivateRequest, db: Session = Depends(get_db)):
    inv_token = db.query(InvitationToken).filter(InvitationToken.token == token, InvitationToken.used == False).first()
    if not inv_token:
        raise HTTPException(status_code=404, detail="Invitation token not found or already used")
    if inv_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invitation token has expired")
        
    user = db.query(User).filter(User.id == inv_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(req.password)
    user.status = "ACTIVE"
    inv_token.used = True
    
    db.commit()
    return {"detail": "Account activated successfully"}
