"""
CadQuery Parametric Sandbox Test Harness for EduMechanic 3D
Validates true parametric solid generation, watertightness, and real asset export.
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
        name="테스트 인벌류트 스퍼 기어",
        geometry_type="spur_gear",
        parameters=ComponentParameter(module=1.5, teeth_count=20, height=12.0, bore_diameter=5.0),
        features=[
            ComponentFeature(type="center_shaft", diameter=5.0, depth=12.0, is_d_cut=True)
        ]
    )

    res = generate_parametric_component(comp, tolerance=0.25)
    print("🚀 [Harness: CAD Sandbox] Running true parametric component generation...")
    print(f"  ✓ Part ID: {res['part_id']}, Applied Tolerance: {res.get('applied_tolerance')}mm")
    print(f"  ✓ Watertight: {res.get('is_watertight')}, Volume: {res.get('volume_mm3')} mm³, Faces: {res.get('faces_count')}")
    print(f"  ✓ STL URL: {res.get('stl_url')}, GLB URL: {res.get('gltf_url')}")

    assert res["is_watertight"] is True, "Generated CAD solid must be 100% watertight"
    assert res["volume_mm3"] > 0, "Generated CAD solid volume must be positive"
    assert res["faces_count"] > 100, "Must be high-resolution polygonal mesh"
    assert res["stl_url"] is not None

    print("✅ [Harness: CAD Sandbox] Genuine Watertight Solid Generation Passed!\n")
    return True

if __name__ == "__main__":
    success = test_cad_generator_harness()
    sys.exit(0 if success else 1)
