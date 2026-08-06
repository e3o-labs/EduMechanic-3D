from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List
from app.services.lms.classroom import lms_service

router = APIRouter()

class LMSSubmissionRequest(BaseModel):
    assignment_id: str = "assign_stem_001"
    student_name: str = "김민준"
    card_id: str
    quiz_score: int = 100

class LMSSubmissionResponse(BaseModel):
    status: str
    submission_id: str
    assignment_id: str
    student_name: str
    card_id: str
    quiz_score: int
    classroom_post_url: str

@router.get("/lms/assignments")
async def list_lms_assignments():
    """
    Returns list of active Google Classroom assignments for the class.
    """
    return lms_service.list_assignments()

@router.post("/lms/submit", response_model=LMSSubmissionResponse)
async def submit_to_lms(req: LMSSubmissionRequest):
    """
    Submits student 3D Exploration Card & AI Quiz Grade to Google Classroom.
    """
    res = lms_service.submit_exploration_card(
        assignment_id=req.assignment_id,
        student_name=req.student_name,
        card_id=req.card_id,
        quiz_score=req.quiz_score
    )
    return res
