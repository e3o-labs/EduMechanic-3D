"""
CadQuery Parametric Sandbox Test Harness for EduMechanic 3D
"""
import sys
from pathlib import Path

# Add apps/api to PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "apps" / "api"))
from app.schemas.spec import ComponentSpec, ComponentParameter, ComponentFeature
from app.services.cad.generator import generate_parametric_component

def test_cad_generator_harness():
    comp = ComponentSpec(
        part_id="part_test_gear",
        name="테스트 베벨 기어",
        geometry_type="bevel_gear",
        parameters=ComponentParameter(outer_diameter=40.0, height=20.0),
        features=[
            ComponentFeature(type="center_shaft", diameter=6.0, depth=15.0, is_d_cut=True),
            ComponentFeature(type="bolt_pattern", standard="M3", count=4, pitch_circle_diameter=28.0)
        ]
    )

    res = generate_parametric_component(comp, tolerance=0.20)
    print("✅ CadQuery Generator Harness Passed!")
    print(f"Part ID: {res['part_id']}, Applied Tolerance: {res['tolerance']}mm")
    print("--- CadQuery Python Script ---")
    print(res["cadquery_code"])
    return True

if __name__ == "__main__":
    success = test_cad_generator_harness()
    sys.exit(0 if success else 1)
