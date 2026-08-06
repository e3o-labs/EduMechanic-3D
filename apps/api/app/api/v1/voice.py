from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.services.vlm.voice_tutor import voice_tutor_agent

router = APIRouter()

class VoiceAskRequest(BaseModel):
    user_text: str = "기어 회전 원리가 궁금해요"
    card_title: str = "수동 연필깎이 역설계 메커니즘"

class VoiceAskResponse(BaseModel):
    tutor_name: str
    user_text: str
    answer_text: str
    action_trigger: Dict[str, Any]
    audio_url: str

@router.post("/voice/ask", response_model=VoiceAskResponse)
async def ask_voice_tutor(req: VoiceAskRequest):
    """
    Submits student spoken query to AI Tutor Mechamong and returns audio + 3D commands.
    """
    res = await voice_tutor_agent.answer_voice_query(req.user_text, req.card_title)
    return res
