from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from app.services.vlm.co_learn import co_learn_tutor

router = APIRouter()

class CoLearnRequest(BaseModel):
    card_id: str
    user_query: str
    current_params: Dict[str, Any] = Field(default_factory=dict)

class CoLearnResponse(BaseModel):
    status: str
    tutor_message: str
    physics_principle: str
    updated_params: Dict[str, Any]
    printability_note: str

@router.post("/colearn/tune", response_model=CoLearnResponse)
async def tune_parametric_mechanism(req: CoLearnRequest):
    """
    AI Co-Learning & Parametric Habrutha Tuning Endpoint:
    Processes natural language question and calculates revised mechanical/DFAM parameters.
    """
    result = co_learn_tutor.process_tuning_query(req.user_query, req.current_params)
    return result
