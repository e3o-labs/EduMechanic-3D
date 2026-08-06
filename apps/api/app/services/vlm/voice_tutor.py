"""
AI Voice Habrutha Tutor Agent "Mechamong" for EduMechanic 3D
Handles Socratic dialogue, voice audio synthesis, and 3D animation triggers.
"""
from typing import Dict, Any

class VoiceTutorAgent:
    def __init__(self):
        pass

    async def answer_voice_query(self, user_text: str, card_title: str) -> Dict[str, Any]:
        """
        Processes student's spoken question, generates Socratic Habrutha STEM response,
        and returns 3D canvas action triggers (e.g. set_explode, toggle_xray, simulate).
        """
        user_query_clean = user_text.strip()

        if "분해" in user_query_clean or "펼쳐" in user_query_clean:
            action = {"type": "set_explode", "value": 75}
            answer = "안녕! AI 튜터 메카몽이야! 내부 구조를 잘 볼 수 있도록 3D 부품을 75% 펼쳐보았어. 어떤 부품이 제일 궁금하니?"
        elif "회전" in user_query_clean or "움직" in user_query_clean or "기어" in user_query_clean:
            action = {"type": "toggle_simulate", "value": True}
            answer = "손잡이를 돌리면 베벨 기어가 45도 경사면에 맞물려 직각으로 회전력을 전달한단다! 한번 구동 모션을 지켜보렴!"
        else:
            action = {"type": "toggle_xray", "value": True}
            answer = f"좋은 질문이야! [{card_title}]의 메커니즘 원리를 투명 X-Ray 모드로 함께 탐구해 보자!"

        return {
            "tutor_name": "메카몽",
            "user_text": user_text,
            "answer_text": answer,
            "action_trigger": action,
            "audio_url": "/static/audio/tutor_response_sample.mp3"
        }

voice_tutor_agent = VoiceTutorAgent()
