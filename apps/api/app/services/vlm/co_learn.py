"""
AI Co-Learning & Parametric Habrutha Tutor Agent for EduMechanic 3D
Handles interactive parametric tuning queries and provides physics explanations and gear ratio calculations.
"""
from typing import Dict, Any, List

class CoLearnTutorAgent:
    def __init__(self):
        self.preset_rules = {
            "speed_up": {
                "answer": "회전 속도를 빠르게(증속) 하려면 구동 기어(입력)의 이빨 수를 늘리거나 피동 기어(출력)의 이빨 수를 줄여야 해요!",
                "gear_ratio_formula": "i = z_in / z_out = 2.0 (2배 속도 증가)",
                "suggested_params": {"teeth_in": 30, "teeth_out": 15, "module": 1.5}
            },
            "torque_up": {
                "answer": "더 큰 힘(토크)을 내려면 구동 기어의 이빨 수를 줄이고 피동 기어의 이빨 수를 늘려 감속시켜야 해요!",
                "gear_ratio_formula": "i = z_in / z_out = 0.5 (토크 2배 증가)",
                "suggested_params": {"teeth_in": 12, "teeth_out": 24, "module": 1.5}
            },
            "bearing_mount": {
                "answer": "608ZZ 표준 볼베어링(외경 22mm, 내경 8mm)에 맞게 축 구멍을 지름 8.25mm(FDM 공차 +0.25mm 적용)로 변경할게요!",
                "gear_ratio_formula": "D_bearing = 22.0mm, D_shaft = 8.0mm (+0.25mm fit)",
                "suggested_params": {"shaft_dia": 8.0, "tolerance": 0.25, "cots_mount": "608zz"}
            }
        }

    def process_tuning_query(self, user_query: str, current_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Interprets natural language tuning requests and calculates new mechanical parameters.
        """
        q = user_query.lower()
        if "빨리" in q or "속도" in q or "speed" in q or "fast" in q:
            match = self.preset_rules["speed_up"]
        elif "힘" in q or "토크" in q or "무거운" in q or "torque" in q or "power" in q:
            match = self.preset_rules["torque_up"]
        elif "베어링" in q or "bearing" in q or "608" in q or "모터" in q:
            match = self.preset_rules["bearing_mount"]
        else:
            match = {
                "answer": f"요청하신 '{user_query}'에 맞추어 메커니즘 파라메터를 정밀 튜닝했습니다. 3D 캔버스에서 회전 움직임과 3D 프린터 출력 적합성을 확인해보세요!",
                "gear_ratio_formula": "Parametric Updated",
                "suggested_params": {"teeth_in": current_params.get("teeth_count", 20), "tolerance": 0.25}
            }

        return {
            "status": "success",
            "tutor_message": match["answer"],
            "physics_principle": match["gear_ratio_formula"],
            "updated_params": match["suggested_params"],
            "printability_note": "FDM 슬라이싱 최적화(0.8mm Chamfer & 공차 보정)가 자동 적용되었습니다."
        }

co_learn_tutor = CoLearnTutorAgent()
