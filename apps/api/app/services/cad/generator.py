"""
CadQuery Parametric CAD Generation Service for EduMechanic 3D
"""
import sys
from typing import Dict, Any
from app.schemas.spec import ComponentSpec

def generate_parametric_component(comp: ComponentSpec, tolerance: float = 0.20) -> Dict[str, Any]:
    """
    CadQuery 스크립트 연산 및 FDM/SLA 결합 유격(Tolerance) 반영 파라메트릭 CAD 생성 함수
    """
    od = comp.parameters.outer_diameter or 30.0
    h = comp.parameters.height or 15.0
    
    cq_code = f"""import cadquery as cq

# 1. Base Geometry
model = cq.Workplane("XY").circle({od / 2}).extrude({h})

# 2. Features Application
"""
    for feat in comp.features:
        if feat.type == "center_shaft":
            shaft_dia = (feat.diameter or 6.0) + tolerance
            depth = feat.depth or h
            cq_code += f"""
model = model.faces(">Z").workplane().circle({shaft_dia / 2}).cutBlind(-{depth})
"""
        elif feat.type == "bolt_pattern":
            pcd = feat.pitch_circle_diameter or (od * 0.7)
            count = feat.count or 4
            cq_code += f"""
model = model.faces(">Z").workplane().polarArray(radius={pcd / 2}, startAngle=0, angle=360, count={count}).hole(3.2)
"""

    cq_code += """
# 3. Chamfering for 3D Printing
model = model.edges("<Z").chamfer(0.8)
"""

    return {
        "status": "success",
        "part_id": comp.part_id,
        "tolerance": tolerance,
        "cadquery_code": cq_code,
        "gltf_url": f"/static/models/{comp.part_id}.glb",
        "step_url": f"/static/models/{comp.part_id}.step"
    }
