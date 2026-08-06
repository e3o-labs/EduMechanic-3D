"""
Automated VLM JSON Schema Validator Harness for EduMechanic 3D
"""
import sys
import json
from pathlib import Path
from pydantic import ValidationError

# Add apps/api to PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "apps" / "api"))
from app.schemas.spec import VLMParsingResult

SAMPLE_VLM_JSON = {
    "card_id": "card_sharpener_001",
    "title": "수동 연필깎이 메커니즘",
    "category": "K-12 STEM Mechanical",
    "ai_summary": "손잡이를 돌리면 직각 베벨 기어가 힘의 방향을 90도 변환하여 칼날을 회전시켜요!",
    "global_tolerance": 0.20,
    "components": [
        {
            "part_id": "part_bevel_gear",
            "name": "중앙 경사 베벨 기어",
            "geometry_type": "bevel_gear",
            "function_title": "동력 90도 직각 전달",
            "description": "손잡이의 회전력을 직각으로 꺾어 칼날 축으로 전달해 주는 핵심 기어입니다.",
            "parameters": {
                "outer_diameter": 45.0,
                "height": 22.0,
                "wall_thickness": 3.0,
                "pitch_angle": 45.0,
                "teeth_count": 16
            },
            "features": [
                {
                    "type": "center_shaft",
                    "diameter": 6.0,
                    "depth": 15.0,
                    "is_d_cut": True
                },
                {
                    "type": "bolt_pattern",
                    "standard": "M3",
                    "count": 4,
                    "pitch_circle_diameter": 32.0
                }
            ],
            "explode_vector": { "x": 1.0, "y": 0.5, "z": 0.0 },
            "rotation_axis": "Y",
            "stem_principle": "회전 운동 방향 전환 (Bevel Gear Principle)"
        }
    ],
    "quiz": {
        "question": "손잡이를 2바퀴 돌릴 때 칼날이 6바퀴 돌았습니다. 회전 속도는 몇 배 빨라졌을까요?",
        "options": ["1. 2배", "2. 3배", "3. 6배", "4. 12배"],
        "correct_index": 1,
        "explanation": "2바퀴 입력 시 6바퀴가 회전하므로 회전 속도는 3배 증가합니다!"
    }
}

def test_validate_vlm_schema():
    try:
        validated = VLMParsingResult.model_validate(SAMPLE_VLM_JSON)
        print(f"✅ VLM Schema Validation Passed! Card ID: {validated.card_id}, Parts Count: {len(validated.components)}")
        return True
    except ValidationError as e:
        print(f"❌ VLM Schema Validation Failed:\n{e}")
        return False

if __name__ == "__main__":
    success = test_validate_vlm_schema()
    sys.exit(0 if success else 1)
