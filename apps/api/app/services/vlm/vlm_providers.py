"""
Multi-Modal VLM Provider Implementations for EduMechanic 3D
Supports Google Gemini, OpenAI, Anthropic Claude, and High-Fidelity Mock Fallback.
"""
import os
import json
import base64
import urllib.request
import urllib.error
import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseVLMProvider(ABC):
    @abstractmethod
    async def analyze_image(
        self, image_bytes: bytes, mime_type: str, system_prompt: str, user_prompt: str
    ) -> str:
        pass

    @abstractmethod
    async def chat_completion(self, system_prompt: str, user_prompt: str) -> str:
        pass


class GeminiVLMProvider(BaseVLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model = model

    def _sync_post(self, url: str, payload: dict) -> str:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                text_blocks = [p.get("text", "") for p in parts if "text" in p]
                return "\n".join(text_blocks)
            raise ValueError(f"Gemini API returned no candidates: {res_data}")

    async def analyze_image(
        self, image_bytes: bytes, mime_type: str, system_prompt: str, user_prompt: str
    ) -> str:
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"inline_data": {"mime_type": mime_type, "data": b64_image}},
                        {"text": user_prompt},
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }
        return await asyncio.to_thread(self._sync_post, url, payload)

    async def chat_completion(self, system_prompt: str, user_prompt: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {"temperature": 0.7}
        }
        return await asyncio.to_thread(self._sync_post, url, payload)


class OpenAIVLMProvider(BaseVLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.api_key = api_key
        self.model = model

    def _sync_post(self, payload: dict) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            choices = res_data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "")
            raise ValueError(f"OpenAI API returned no choices: {res_data}")

    async def analyze_image(
        self, image_bytes: bytes, mime_type: str, system_prompt: str, user_prompt: str
    ) -> str:
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{mime_type};base64,{b64_image}"

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }
        return await asyncio.to_thread(self._sync_post, payload)

    async def chat_completion(self, system_prompt: str, user_prompt: str) -> str:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.7,
        }
        return await asyncio.to_thread(self._sync_post, payload)


class AnthropicVLMProvider(BaseVLMProvider):
    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        self.api_key = api_key
        self.model = model

    def _sync_post(self, payload: dict) -> str:
        url = "https://api.anthropic.com/v1/messages"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            content = res_data.get("content", [])
            text_blocks = [c.get("text", "") for c in content if c.get("type") == "text"]
            return "\n".join(text_blocks)

    async def analyze_image(
        self, image_bytes: bytes, mime_type: str, system_prompt: str, user_prompt: str
    ) -> str:
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        payload = {
            "model": self.model,
            "max_tokens": 2048,
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": mime_type,
                                "data": b64_image,
                            },
                        },
                        {"type": "text", "text": user_prompt},
                    ],
                }
            ],
            "temperature": 0.2,
        }
        return await asyncio.to_thread(self._sync_post, payload)

    async def chat_completion(self, system_prompt: str, user_prompt: str) -> str:
        payload = {
            "model": self.model,
            "max_tokens": 1024,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
            "temperature": 0.7,
        }
        return await asyncio.to_thread(self._sync_post, payload)


class MockVLMProvider(BaseVLMProvider):
    """
    High-Fidelity offline mechanical mock provider.
    Ensures zero-downtime and 100% testable local development.
    """
    async def analyze_image(
        self, image_bytes: bytes, mime_type: str, system_prompt: str, user_prompt: str
    ) -> str:
        mock_data = {
            "card_id": "card_live_mock_001",
            "title": "실시간 AI 역설계 메커니즘 분석",
            "category": "K-12 STEM Mechanical",
            "ai_summary": "입력된 기계 사진의 기어 감속비 및 동력 전달 축을 3D 파라메트릭 CAD 모델로 자동 복원하였습니다.",
            "global_tolerance": 0.20,
            "components": [
                {
                    "part_id": "part_housing",
                    "name": "외부 투명 하우징",
                    "geometry_type": "cylinder",
                    "function_title": "내부 메커니즘 보호 및 축 지지",
                    "description": "투명 아크릴 하우징으로 내부 기어 회전 동작을 보호하고 회전축을 정밀 고정합니다.",
                    "parameters": {
                        "outer_diameter": 52.0,
                        "height": 36.0,
                        "wall_thickness": 2.5
                    },
                    "features": [
                        {"type": "bolt_pattern", "standard": "M3", "count": 4, "pitch_circle_diameter": 40.0}
                    ],
                    "explode_vector": {"x": 0.0, "y": 1.2, "z": 0.0},
                    "rotation_axis": "Y",
                    "stem_principle": "투명 하우징을 통한 기계 내부 구조 인지"
                },
                {
                    "part_id": "part_bevel_gear",
                    "name": "중앙 경사 베벨 기어",
                    "geometry_type": "bevel_gear",
                    "function_title": "동력 90도 직각 전환",
                    "description": "손잡이의 회전력을 직각으로 꺾어 주 축으로 전달하는 45도 경사 톱니바퀴입니다.",
                    "parameters": {
                        "outer_diameter": 32.0,
                        "height": 16.0,
                        "pitch_angle": 45.0,
                        "teeth_count": 16
                    },
                    "features": [
                        {"type": "center_shaft", "diameter": 6.0, "depth": 15.0, "is_d_cut": True}
                    ],
                    "explode_vector": {"x": 0.0, "y": 0.0, "z": 0.0},
                    "rotation_axis": "Y",
                    "stem_principle": "회전 운동 방향 직각 전환 (Bevel Gear Principle)"
                },
                {
                    "part_id": "part_pinion_shaft",
                    "name": "고속 피니언 구동축",
                    "geometry_type": "spur_gear",
                    "function_title": "고속 회전 출력 가속",
                    "description": "작은 기어비로 회전 속도를 3배 가속하여 출력부로 동력을 전달합니다.",
                    "parameters": {
                        "outer_diameter": 18.0,
                        "height": 12.0,
                        "teeth_count": 8
                    },
                    "features": [
                        {"type": "center_shaft", "diameter": 4.0, "depth": 10.0, "is_d_cut": False}
                    ],
                    "explode_vector": {"x": 0.0, "y": -1.0, "z": 0.0},
                    "rotation_axis": "Y",
                    "stem_principle": "기어비(Gear Ratio)에 따른 회전 속도 증속"
                }
            ],
            "quiz": {
                "question": "입력 베벨 기어(16T)가 1회전할 때 출력 피니언 기어(8T)는 몇 회전할까요?",
                "options": ["1. 0.5회전", "2. 1회전", "3. 2회전", "4. 4회전"],
                "correct_index": 2,
                "explanation": "기어비는 16 ÷ 8 = 2이므로, 큰 기어가 1바퀴 돌 때 작은 피니언 기어는 2바퀴 회전하여 속도가 2배 빨라집니다!"
            }
        }
        return json.dumps(mock_data, ensure_ascii=False)

    async def chat_completion(self, system_prompt: str, user_prompt: str) -> str:
        user_query_clean = user_prompt.strip()
        if "분해" in user_query_clean or "펼쳐" in user_query_clean:
            return json.dumps({
                "answer": "안녕! AI 튜터 메카몽이야! 내부 구조를 잘 볼 수 있도록 3D 부품을 75% 펼쳐보았어. 어떤 부품이 제일 궁금하니?",
                "action": {"type": "set_explode", "value": 75}
            }, ensure_ascii=False)
        elif "회전" in user_query_clean or "움직" in user_query_clean or "기어" in user_query_clean:
            return json.dumps({
                "answer": "손잡이를 돌리면 베벨 기어가 45도 경사면에 맞물려 직각으로 회전력을 전달한단다! 한번 구동 모션을 지켜보렴!",
                "action": {"type": "toggle_simulate", "value": True}
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "answer": "좋은 질문이야! 투명 X-Ray 모드로 내부 부품의 배치와 맞물림을 함께 탐구해 보자!",
                "action": {"type": "toggle_xray", "value": True}
            }, ensure_ascii=False)
