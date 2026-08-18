"""
User Authentication & Session Endpoints for EduMechanic 3D
Provides fast student/teacher login and profile retrieval.
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User

router = APIRouter()

class LoginRequest(BaseModel):
    name: str = "김민준"
    role: str = "student" # student or teacher
    team_name: str = "1모둠 (알파팀)"
    email: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    role: str
    team_name: str
    email: Optional[str] = None
    token: str

@router.post("/auth/login", response_model=UserResponse)
def login_or_register(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Fast K-12 Student/Teacher Login.
    Finds existing user by name and role or registers a new user into DB.
    """
    user = db.query(User).filter(User.name == req.name, User.role == req.role).first()
    if not user:
        user_id = f"user_{req.role}_{uuid.uuid4().hex[:8]}"
        user = User(
            id=user_id,
            name=req.name,
            role=req.role,
            team_name=req.team_name,
            email=req.email
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return UserResponse(
        id=user.id,
        name=user.name,
        role=user.role,
        team_name=user.team_name,
        email=user.email,
        token=f"token_{user.id}"
    )

@router.get("/auth/me", response_model=UserResponse)
def get_current_user(db: Session = Depends(get_db)):
    """
    Returns the active student/teacher session (defaults to primary student user).
    """
    user = db.query(User).first()
    if not user:
        # Seed default student user
        user = User(
            id="user_student_minjun_01",
            name="김민준",
            role="student",
            team_name="1모둠 (알파팀)",
            email="minjun@school.edu"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return UserResponse(
        id=user.id,
        name=user.name,
        role=user.role,
        team_name=user.team_name,
        email=user.email,
        token=f"token_{user.id}"
    )
