"""
Harness Suite: DFAM (Design for Additive Manufacturing) & Tolerance Verification
Validates that generated solids have 100% watertightness, proper tolerances, and printability scores > 80%.
"""
import sys
import os

# Add apps/api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../apps/api")))

from app.services.cad.dfam import dfam_engine, SimpleMesh
from app.services.cad.involute_gear import involute_generator
from app.services.cad.generator import generate_parametric_component
from app.schemas.spec import ComponentSpec, ComponentParameter, ComponentFeature

def run_dfam_harness_tests():
    print("🚀 [Harness: DFAM Evaluator] Starting automated verification...")
    
    # Test 1: Solid Watertightness Check
    gear_mesh = SimpleMesh(radius=18.0, height=12.0)
    analysis = dfam_engine.analyze_mesh_printability(gear_mesh)
    print(f"  ✓ Mesh Total Faces: {analysis['total_faces']}")
    print(f"  ✓ Watertight Check: {analysis['is_watertight']} (Score: {analysis['printability_score']}%)")
    assert analysis["is_watertight"] is True, "Mesh must be 100% watertight"
    assert analysis["printability_score"] >= 80, "Printability score must be >= 80%"

    # Test 2: Involute Gear Geometry & ISO Ratios
    gear_calc = involute_generator.calculate_gear_geometry(module=1.5, teeth_count=20)
    print(f"  ✓ Involute Gear Calculations: Pitch Dia={gear_calc['pitch_diameter']}mm, Tip Dia={gear_calc['tip_diameter']}mm")
    assert gear_calc["pitch_diameter"] == 30.0, "Pitch diameter must be m * z = 30.0"
    assert gear_calc["tip_diameter"] == 33.0, "Tip diameter must be m * (z + 2) = 33.0"

    # Test 3: Tolerance Profiles and Chamfer DFAM Code Generation
    comp = ComponentSpec(
        part_id="part_test_gear",
        name="테스트 인벌류트 기어",
        geometry_type="spur_gear",
        parameters=ComponentParameter(outer_diameter=30.0, height=12.0, teeth_count=20),
        features=[ComponentFeature(type="center_shaft", diameter=6.0)]
    )
    result = generate_parametric_component(comp, tolerance=0.25, cots_mount="608zz")
    print(f"  ✓ CadQuery Code Generation with 608ZZ Bearing Bore: Length={len(result['cadquery_code'])} chars")
    assert "chamfer(0.8)" in result["cadquery_code"], "DFAM Chamfer must be injected"
    assert "608ZZ" in result["cadquery_code"], "608ZZ COTS mounting pocket must be present"

    print("✓ [Harness: DFAM Evaluator] DFAM checks passed successfully.\n")

if __name__ == "__main__":
    run_dfam_harness_tests()
