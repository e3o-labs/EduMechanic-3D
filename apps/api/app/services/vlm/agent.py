"""
Vision Perception Agent for EduMechanic 3D
Handles multi-modal VLM image perception, component segmentation, and JSON spec generation.
Supports Google Gemini, OpenAI GPT-4o, Anthropic Claude, and Mock fallback.
"""
import os
import re
import json
import hashlib
from typing import Dict, Any, Optional

from app.core.config import settings
from app.schemas.spec import (
    VLMParsingResult,
    ComponentSpec,
    ComponentParameter,
    ComponentFeature,
    QuizSpec,
    ExplodeVector,
)
from app.services.vlm.vlm_providers import (
    BaseVLMProvider,
    GeminiVLMProvider,
    OpenAIVLMProvider,
    AnthropicVLMProvider,
    MockVLMProvider,
)

STEM_REVERSE_ENGINEERING_SYSTEM_PROMPT = """
You are a senior mechanical reverse-engineering and K-12 STEM education AI agent for 'EduMechanic 3D'.
Analyze the provided photograph of a mechanical device or STEM toy, and generate a precise structured JSON reverse-engineering specification.

JSON Schema Requirements:
{
  "card_id": "card_<unique_id>",
  "title": "<Concise Korean or English title of the mechanism>",
  "category": "K-12 STEM Mechanical",
  "ai_summary": "<1-2 sentence engineering summary of the mechanism motion & torque transfer>",
  "global_tolerance": 0.20,
  "components": [
    {
      "part_id": "part_<unique_snake_name>",
      "name": "<Component Name e.g. 구동 베벨 기어, 외부 하우징, 출력 샤프트>",
      "geometry_type": "<cylinder | spur_gear | bevel_gear | box | shaft>",
      "function_title": "<Concise function e.g. 동력 90도 직각 전환>",
      "description": "<Detailed description of what this part does>",
      "parameters": {
        "outer_diameter": <float in mm, e.g. 30.0>,
        "height": <float in mm, e.g. 15.0>,
        "wall_thickness": <optional float in mm>,
        "pitch_angle": <optional float in degrees, e.g. 45.0 for bevel gears>,
        "teeth_count": <optional integer, e.g. 16>
      },
      "features": [
        {
          "type": "<center_shaft | bolt_pattern | keyway | d_cut>",
          "diameter": <optional float>,
          "depth": <optional float>,
          "is_d_cut": <optional boolean>,
          "standard": "<optional string e.g. M3>",
          "count": <optional integer>,
          "pitch_circle_diameter": <optional float>
        }
      ],
      "explode_vector": {
        "x": <float offset for 3D exploded view, e.g. 0.0>,
        "y": <float offset for 3D exploded view, e.g. 1.2 or 0.0 or -1.0>,
        "z": <float offset for 3D exploded view, e.g. 0.0>
      },
      "rotation_axis": "Y",
      "stem_principle": "<Key STEM mechanical principle e.g. 감속비에 의한 토크 증대, 45도 경사 치합>"
    }
  ],
  "quiz": {
    "question": "<Engaging Socratic K-12 STEM question about this mechanism>",
    "options": ["1. ...", "2. ...", "3. ...", "4. ..."],
    "correct_index": <integer 0, 1, 2, or 3>,
    "explanation": "<Encouraging explanation of the correct answer and STEM principle>"
  }
}

CRITICAL RULES:
1. Return ONLY the valid JSON object. Do not include extra conversational text.
2. Segment at least 2 to 4 key functional components.
3. Ensure all dimensions (outer_diameter, height) are positive realistic numbers in mm.
4. Explode vectors should spread along Y (or X/Z) axis so exploded view (분해도) displays cleanly in 3D.
"""

class VisionPerceptionAgent:
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

    def compute_image_hash(self, image_bytes: bytes) -> str:
        return hashlib.sha256(image_bytes).hexdigest()

    def _detect_mime_type(self, image_bytes: bytes, filename: str) -> str:
        if filename.lower().endswith(".png") or image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        elif filename.lower().endswith(".webp") or image_bytes.startswith(b"RIFF") and b"WEBP" in image_bytes[:12]:
            return "image/webp"
        elif filename.lower().endswith(".gif") or image_bytes.startswith(b"GIF8"):
            return "image/gif"
        return "image/jpeg"

    def clean_and_repair_json(self, raw_text: str) -> Dict[str, Any]:
        """
        Self-Healing JSON Cleaner:
        Removes markdown code fences, strips non-JSON leading/trailing text, and parses.
        """
        text = raw_text.strip()

        # Remove ```json ... ``` or ``` ... ``` code blocks
        if "```" in text:
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
            if match:
                text = match.group(1)
            else:
                # Strip all backticks
                text = re.sub(r"^```[a-zA-Z]*\n", "", text)
                text = re.sub(r"\n```$", "", text).strip()

        # Extract innermost matching braces if extraneous text exists
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace != -1 and last_brace != -1:
            text = text[first_brace:last_brace + 1]

        # Fix trailing commas before closing braces/brackets
        text = re.sub(r",\s*([\]}])", r"\1", text)

        return json.loads(text)

    async def analyze_machine_image(self, image_bytes: bytes, filename: str) -> VLMParsingResult:
        """
        Analyze machine photo using active VLM provider, extracting kinematics and parametric parameters.
        Includes self-healing parsing and automatic fallback to mock provider if network/API fails.
        """
        img_hash = self.compute_image_hash(image_bytes)
        mime_type = self._detect_mime_type(image_bytes, filename)
        user_prompt = f"Analyze the mechanical components and STEM principles of this mechanism in the image. Filename: {filename}"

        raw_response = ""
        try:
            raw_response = await self.provider.analyze_image(
                image_bytes=image_bytes,
                mime_type=mime_type,
                system_prompt=STEM_REVERSE_ENGINEERING_SYSTEM_PROMPT,
                user_prompt=user_prompt,
            )
            data = self.clean_and_repair_json(raw_response)

            # Ensure card_id is set
            if not data.get("card_id") or data.get("card_id") == "card_<unique_id>":
                data["card_id"] = f"card_{img_hash[:8]}"

            # Sanitize quiz correct_index bounds
            if "quiz" in data and isinstance(data["quiz"], dict):
                options = data["quiz"].get("options", [])
                correct_idx = data["quiz"].get("correct_index", 0)
                if not (0 <= correct_idx < len(options)):
                    data["quiz"]["correct_index"] = 0

            return VLMParsingResult.model_validate(data)

        except Exception as e:
            print(f"⚠️ VLM Provider execution failed ({type(e).__name__}: {e}). Gracefully falling back to Mock Provider.")
            # Graceful Fallback
            mock_provider = MockVLMProvider()
            raw_response = await mock_provider.analyze_image(
                image_bytes, mime_type, STEM_REVERSE_ENGINEERING_SYSTEM_PROMPT, user_prompt
            )
            data = json.loads(raw_response)
            data["card_id"] = f"card_{img_hash[:8]}"
            data["title"] = f"역설계 메커니즘 분석 ({filename})"
            return VLMParsingResult.model_validate(data)

vlm_perception_agent = VisionPerceptionAgent()
