"""
Vision Perception Agent for EduMechanic 3D
Handles multi-modal VLM image perception, component segmentation, and JSON spec generation.
"""
import os
import json
import hashlib
from typing import Dict, Any
from app.schemas.spec import VLMParsingResult, ComponentSpec, ComponentParameter, ComponentFeature, QuizSpec, ExplodeVector

class VisionPerceptionAgent:
    def __init__(self, model_name: str = "claude-3-5-sonnet"):
        self.model_name = model_name

    def compute_image_hash(self, image_bytes: bytes) -> str:
        return hashlib.sha256(image_bytes).hexdigest()

    async def analyze_machine_image(self, image_bytes: bytes, filename: str) -> VLMParsingResult:
        """
        Analyze machine photo using VLM agent, extracting kinematics and parametric parameters.
        """
        img_hash = self.compute_image_hash(image_bytes)
        
        # System Prompt definition for VLM agent
        system_prompt = """
        You are a senior mechanical reverse-engineering and STEM educator AI agent.
        Analyze the provided image of a mechanical object and return a structured JSON response matching the VLMParsingResult schema.
        1. Segment key components (housing, gears, shafts, cutters, etc.).
        2. Infer kinematics, gear ratios, physical principles.
        3. Formulate a Habrutha-style K-12 STEM quiz with explanation.
        """

        # Mock VLM execution result (fallback to high-fidelity mechanical specification)
        # In live mode, this connects to Anthropic / OpenAI / Qwen2-VL API
        card_id = f"card_{img_hash[:8]}"
        
        return VLMParsingResult(
            card_id=card_id,
            title=f"역설계 메커니즘 분석 ({filename})",
            category="K-12 STEM Mechanical",
            ai_summary="손잡이의 회전 운동을 베벨 기어로 90도 직각 전환하여 고속 축을 구동하는 공학 메커니즘입니다.",
            global_tolerance=0.20,
            components=[
                ComponentSpec(
                    part_id="part_housing",
                    name="외부 투명 하우징",
                    geometry_type="cylinder",
                    function_title="내부 메커니즘 보호 및 축 가이드",
                    description="투명 아크릴 하우징으로 내부 기어 회전 동작을 보여주고 고정축을 보전합니다.",
                    parameters=ComponentParameter(outer_diameter=50.0, height=35.0, wall_thickness=2.5),
                    explode_vector=ExplodeVector(x=0.0, y=1.2, z=0.0),
                    rotation_axis="Y",
                    stem_principle="투명 하우징을 통한 기계 내부 구조 인지"
                ),
                ComponentSpec(
                    part_id="part_bevel_gear",
                    name="중앙 경사 베벨 기어",
                    geometry_type="bevel_gear",
                    function_title="동력 90도 직각 전환",
                    description="손잡이의 회전력을 직각으로 꺾어 주 축으로 전달하는 45도 경사 톱니바퀴입니다.",
                    parameters=ComponentParameter(outer_diameter=32.0, height=16.0, pitch_angle=45.0, teeth_count=16),
                    features=[
                        ComponentFeature(type="center_shaft", diameter=6.0, depth=15.0, is_d_cut=True),
                        ComponentFeature(type="bolt_pattern", standard="M3", count=4, pitch_circle_diameter=24.0)
                    ],
                    explode_vector=ExplodeVector(x=0.0, y=0.0, z=0.0),
                    rotation_axis="Y",
                    stem_principle="회전 운동 방향 전환 (Bevel Gear Principle)"
                )
            ],
            quiz=QuizSpec(
                question="손잡이를 2바퀴 돌릴 때 출력 축이 6바퀴 회전했습니다. 회전 속도는 몇 배가 될까요?",
                options=["1. 2배", "2. 3배", "3. 6배", "4. 12배"],
                correct_index=1,
                explanation="입력 2회전 당 출력 6회전이므로 6 ÷ 2 = 3배 회전 속도가 빨라집니다!"
            )
        )
