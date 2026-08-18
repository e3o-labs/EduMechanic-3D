"""
AI Voice Habrutha Tutor Agent "Mechamong" for EduMechanic 3D
Handles Socratic dialogue, multi-provider LLM response generation, and 3D canvas action triggers.
"""
import json
import re
from typing import Dict, Any, Optional

from app.core.config import settings
from app.services.vlm.vlm_providers import (
    BaseVLMProvider,
    GeminiVLMProvider,
    OpenAIVLMProvider,
    AnthropicVLMProvider,
    MockVLMProvider,
)

VOICE_TUTOR_SYSTEM_PROMPT = """
You are Mechamong (메카몽), an enthusiastic and friendly AI STEM mentor for students using the EduMechanic 3D platform.
Respond to students' spoken or written questions about mechanical structures, gears, forces, and STEM principles.

Guidelines:
1. Speak in friendly, encouraging Korean (or user's language) with polite, curious tone (해요체).
2. Socratic Habrutha style: Ask an engaging follow-up thought question to prompt curiosity.
3. Automatically decide an appropriate 3D Viewport Action Trigger:
   - If asking to see inside / parts: {"type": "set_explode", "value": 75}
   - If asking how it moves / rotates / works: {"type": "toggle_simulate", "value": true}
   - If asking about internal structure / see-through: {"type": "toggle_xray", "value": true}
   - If asking about a specific part: {"type": "highlight_part", "part_id": "<part_id>"}
   - Default: {"type": "set_explode", "value": 30}

JSON Output Format:
{
  "answer": "<Friendly Korean explanation + Socratic follow-up question>",
  "action": {
    "type": "<set_explode | toggle_simulate | toggle_xray | highlight_part>",
    "value": <number or boolean or string>
  }
}
"""

class VoiceTutorAgent:
    def __init__(self, provider: Optional[BaseVLMProvider] = None):
        self.provider = provider or self._resolve_provider()

    def _resolve_provider(self) -> BaseVLMProvider:
        active_provider = settings.get_active_provider()
        if active_provider == "gemini" and settings.GEMINI_API_KEY:
            return GeminiVLMProvider(api_key=settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL)
        elif active_provider == "openai" and settings.OPENAI_API_KEY:
            return OpenAIVLMProvider(api_key=settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL)
        elif active_provider == "anthropic" and settings.ANTHROPIC_API_KEY:
            return AnthropicVLMProvider(api_key=settings.ANTHROPIC_API_KEY, model=settings.ANTHROPIC_MODEL)
        else:
            return MockVLMProvider()

    async def answer_voice_query(self, user_text: str, card_title: str) -> Dict[str, Any]:
        """
        Processes student's spoken question using LLM provider,
        extracts Socratic explanation and 3D canvas action trigger.
        """
        user_query_clean = user_text.strip()
        user_prompt = f"학생 질문: '{user_query_clean}' (현재 탐구 중인 기계 메커니즘: {card_title})"

        try:
            raw_response = await self.provider.chat_completion(
                system_prompt=VOICE_TUTOR_SYSTEM_PROMPT,
                user_prompt=user_prompt,
            )

            text = raw_response.strip()
            if "```" in text:
                match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
                if match:
                    text = match.group(1)

            first_brace = text.find("{")
            last_brace = text.rfind("}")
            if first_brace != -1 and last_brace != -1:
                text = text[first_brace:last_brace + 1]

            parsed = json.loads(text)
            answer_text = parsed.get("answer", "")
            action_trigger = parsed.get("action", {"type": "toggle_xray", "value": True})

            return {
                "tutor_name": "메카몽",
                "user_text": user_text,
                "answer_text": answer_text,
                "action_trigger": action_trigger,
                "audio_url": "/static/audio/tutor_response_sample.mp3",
                "provider": settings.get_active_provider()
            }

        except Exception as e:
            print(f"⚠️ Voice Tutor LLM fallback triggered ({e})")
            # Fallback Rule-based logic
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
                "answer_text": answer_text if 'answer_text' in locals() and answer_text else answer,
                "action_trigger": action,
                "audio_url": "/static/audio/tutor_response_sample.mp3",
                "provider": "fallback"
            }

voice_tutor_agent = VoiceTutorAgent()
