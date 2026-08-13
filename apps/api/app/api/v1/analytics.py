from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.services.analytics.evaluator import analytics_evaluator

router = APIRouter()

class StudentEvalRequest(BaseModel):
    student_name: str = "김민준"
    team_name: str = "1모둠 (알파팀)"
    topic: str = "수동 연필깎이 직각 베벨 기어 메커니즘"
    exploration_rate: int = 95
    pins_count: int = 12
    quiz_accuracy: int = 100

class StudentEvalResponse(BaseModel):
    student_name: str
    team_name: str
    topic: str
    metrics: Dict[str, int]
    recommended_eval_text: str
    ai_competency_tags: List[str]

@router.get("/analytics/dashboard")
async def get_teacher_dashboard_analytics():
    """
    Returns real-time class & team-level 3D exploration analytics for teacher dashboard.
    """
    return analytics_evaluator.get_dashboard_summary()

@router.post("/analytics/eval/generate", response_model=StudentEvalResponse)
async def generate_student_evaluation(req: StudentEvalRequest):
    """
    Generates AI-recommended student behavioral record text (생기부 세특 문구) based on activity metrics.
    """
    res = analytics_evaluator.generate_student_evaluation(
        student_name=req.student_name,
        team_name=req.team_name,
        topic=req.topic,
        exploration_rate=req.exploration_rate,
        pins_count=req.pins_count,
        quiz_accuracy=req.quiz_accuracy
    )
    return res
