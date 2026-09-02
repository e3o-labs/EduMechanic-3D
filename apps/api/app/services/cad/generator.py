"""
CadQuery Parametric CAD Generation Service for EduMechanic 3D
Integrated with DFAM optimization & Involute Gear Engine.
"""
from typing import Dict, Any
from app.schemas.spec import ComponentSpec
from app.services.cad.involute_gear import involute_generator
from app.services.cad.dfam import dfam_engine

def generate_parametric_component(
    comp: ComponentSpec, 
    tolerance: float = 0.25,
    cots_mount: str = "608zz",
    apply_dfam: bool = True
) -> Dict[str, Any]:
    """
    CadQuery script generator supporting:
    - Standard Involute gears & bevel gears
    - COTS hardware mounts (608ZZ, M3, LEGO, D-Shaft)
    - DFAM rules (Elephant foot chamfer, Tear-drop hole, tolerance offsets)
    """
    od = comp.parameters.outer_diameter or 30.0
    h = comp.parameters.height or 12.0
    teeth = comp.parameters.teeth_count or 20
    
    if comp.geometry_type in ["spur_gear", "bevel_gear"]:
        cq_code = involute_generator.generate_cadquery_script(
            module=1.5,
            teeth_count=teeth,
            face_width=h,
            shaft_dia=6.0,
            tolerance=tolerance,
            cots_type=cots_mount
        )
    else:
        # Standard Housing / Shaft component
        cq_code = f"""import cadquery as cq

# 1. Base Solid
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
        if apply_dfam:
            cq_code += dfam_engine.generate_dfam_cadquery_snippet(tolerance=tolerance, hole_dia=6.0)

    return {
        "status": "success",
        "part_id": comp.part_id,
        "tolerance": tolerance,
        "cots_mount": cots_mount,
        "cadquery_code": cq_code,
        "gltf_url": f"/static/models/{comp.part_id}.glb",
        "step_url": f"/static/models/{comp.part_id}.step"
    }
