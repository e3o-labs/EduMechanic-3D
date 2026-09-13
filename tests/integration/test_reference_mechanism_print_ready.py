"""
Integration Test: End-to-End Reference Mechanism Manufacturing Validation
Mechanism: 2 Spur Gears (z1=16, z2=32, m=1.5, a=36.0mm) + Shafts + Housing + Hand Crank
Computationally prevalidates reference mechanism CAD generation, G1~G4 checks, and manufacturing packaging.
"""
import io
import zipfile
import json
import tempfile
from pathlib import Path
import pytest
import trimesh
import math

from app.schemas.spec import PrinterProfile, PrintReadinessTier
from app.services.cad.components.gears.spur_gear import create_mating_gear_pair
from app.services.cad.components.housings.gearbox_frame import GearboxFrame
from app.services.cad.components.crank.hand_crank import HandCrank
from app.services.cad.components.shafts.shaft import PrecisionShaft
from app.services.cad.components.fasteners.bushing import FlangedBushing
from app.services.cad.validator import manufacturability_validator
from app.services.cad.slicer import slicer_exporter

def test_reference_mechanism_end_to_end():
    print("\n🚀 [Integration Test] Starting P0 Reference Mechanism End-to-End Validation...")

    m = 1.5
    z1 = 16
    z2 = 32
    shaft_dia = 5.0
    profile = PrinterProfile()

    # 1. Generate Components
    gear_driver, gear_driven, center_dist = create_mating_gear_pair(
        module=m,
        teeth_1=z1,
        teeth_2=z2,
        shaft_dia=shaft_dia,
        backlash=profile.fit_profiles.backlash,
        fit_clearance=profile.fit_profiles.rotating_fit
    )
    frame = GearboxFrame(center_distance=center_dist, shaft_diameter=shaft_dia)
    crank = HandCrank(shaft_dia=shaft_dia)
    shaft = PrecisionShaft(diameter=shaft_dia, length=45.0, is_d_cut=True)
    bushing = FlangedBushing(inner_diameter=shaft_dia)

    # 2. Export and Physically Re-open Artifacts
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        g1_stl = tmp_path / "driver_gear.stl"
        frame_stl = tmp_path / "frame.stl"
        crank_stl = tmp_path / "crank.stl"

        gear_driver.export_stl(str(g1_stl))
        frame.export_stl(str(frame_stl))
        crank.export_stl(str(crank_stl))

        assert g1_stl.exists() and g1_stl.stat().st_size > 5000, "Driver gear STL must be generated and non-empty"
        assert frame_stl.exists() and frame_stl.stat().st_size > 2000, "Frame STL must be generated"
        assert crank_stl.exists() and crank_stl.stat().st_size > 2000, "Crank STL must be generated"

        # Re-open with trimesh to inspect actual topology
        loaded_gear = trimesh.load(str(g1_stl))
        assert loaded_gear.is_watertight is True, "Re-opened driver gear must be watertight"
        assert loaded_gear.volume > 0.0, "Re-opened driver gear volume must be positive"
        # Check bounding diameter: tip diameter should be m * (z1 + 2) = 1.5 * 18 = 27.0 mm
        assert abs(loaded_gear.extents[0] - 27.0) < 0.5 or abs(loaded_gear.extents[1] - 27.0) < 0.5

    # 3. G1~G4 Manufacturability Validation
    m_g1 = gear_driver.to_trimesh()
    m_g2 = gear_driven.to_trimesh()
    m_frame = frame.to_trimesh()
    m_crank = crank.to_trimesh()
    m_shaft = shaft.to_trimesh()

    # Position in Assembled Coordinates:
    # Frame at Z=0..6, center distance = center_dist
    m_g1.apply_translation([-center_dist / 2.0, 0.0, 8.0])

    rot_z = trimesh.transformations.rotation_matrix(math.pi / z2, [0, 0, 1])
    m_g2.apply_transform(rot_z)
    m_g2.apply_translation([center_dist / 2.0, 0.0, 8.0])

    m_crank.apply_translation([-center_dist / 2.0, 0.0, 18.0])
    m_shaft.apply_translation([-center_dist / 2.0, 0.0, -2.0])

    parts_map = {
        "driver_gear_z16": m_g1,
        "driven_gear_z32": m_g2,
        "gearbox_frame": m_frame,
        "hand_crank": m_crank,
        "shaft": m_shaft
    }

    assembly_relations = [
        {
            "type": "gear_mesh",
            "actual_center_dist": center_dist,
            "target_center_dist": center_dist
        },
        {
            "type": "shaft_bore_fit",
            "shaft_id": "shaft",
            "bore_id": "driver_gear_z16",
            "shaft_dia": shaft_dia,
            "bore_dia": gear_driver.actual_bore_dia,
            "fit_type": "rotating_fit"
        },
        {
            "type": "shaft_bore_fit",
            "shaft_id": "shaft",
            "bore_id": "hand_crank",
            "shaft_dia": shaft_dia,
            "bore_dia": crank.actual_bore_dia,
            "fit_type": "snug_fit"
        }
    ]

    report = manufacturability_validator.evaluate_print_readiness(
        parts=parts_map,
        assembly_relations=assembly_relations
    )

    print(f"  ✓ Validation Tier: {report.tier.value}")
    print(f"  ✓ Quality Score: {report.score}%")
    print(f"  ✓ G1 (Geometry): {report.g1_geometry.passed}")
    print(f"  ✓ G2 (Printer): {report.g2_printer.passed}")
    print(f"  ✓ G3 (Assembly): {report.g3_assembly.passed}")
    print(f"  ✓ G4 (Slicing): {report.g4_slicing.passed}")

    assert report.g1_geometry.passed is True, "Gate G1 must pass for all parts"
    assert report.g2_printer.passed is True, "Gate G2 must pass against Classroom FDM limits"
    assert report.g3_assembly.passed is True, "Gate G3 must confirm correct center distance & clearance"
    assert report.g4_slicing.passed is True, "Gate G4 must generate valid layer polygons"
    assert report.tier == PrintReadinessTier.PRINT_READY, "Mechanism must be certified PRINT READY"

    # 4. Manufacturing Package Generation
    pkg_bytes = slicer_exporter.generate_manufacturing_package(
        card_id="test_gearbox_p0",
        teeth_driver=16,
        teeth_driven=32
    )
    assert len(pkg_bytes) > 20000, "Package ZIP must contain meshes and manifests"

    # 5. Inspect ZIP Package Contents
    with zipfile.ZipFile(io.BytesIO(pkg_bytes), "r") as zf:
        file_list = zf.namelist()
        print(f"  ✓ Archive Contents: {len(file_list)} files found")
        assert "manufacturing_manifest.json" in file_list
        assert "hardware_bom.json" in file_list
        assert "assembly_guide.md" in file_list
        assert "meshes/test_gearbox_p0_driver_gear_z16.stl" in file_list
        assert "meshes/test_gearbox_p0_driven_gear_z32.stl" in file_list
        assert "meshes/test_gearbox_p0_gearbox_frame.stl" in file_list
        assert "meshes/test_gearbox_p0_hand_crank.stl" in file_list

        manifest = json.loads(zf.read("manufacturing_manifest.json").decode("utf-8"))
        assert manifest["readiness_tier"] == "Print Ready"
        assert manifest["kinematics"]["gear_ratio"] == 2.0
        assert manifest["kinematics"]["center_distance_mm"] == 36.0

        bom = json.loads(zf.read("hardware_bom.json").decode("utf-8"))
        assert any(item["name"] == "스테인리스 회전축 (Stainless Shaft)" for item in bom)
        assert any("625ZZ" in item["spec"] for item in bom)

        guide = zf.read("assembly_guide.md").decode("utf-8")
        assert "조립 순서" in guide

    print("✓ [Integration Test] Reference Mechanism computationally prevalidated (Print Ready tier assigned).\n")
