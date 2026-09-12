"""
Harness Suite: 3MF / Manufacturing Slicer Package Verification
Validates genuine multi-part STL geometries, 3MF container, Hardware BOM, and Print Ready manifest.
"""
import sys
import os
import io
import zipfile
import json
import struct

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../apps/api")))

from app.services.cad.slicer import slicer_exporter

def inspect_stl_triangles(stl_bytes: bytes) -> int:
    if len(stl_bytes) < 84:
        return 0
    return struct.unpack("<I", stl_bytes[80:84])[0]

def run_slicer_harness_tests():
    print("🚀 [Harness: Slicer Evaluator] Starting genuine Manufacturing 3MF & STL verification...")
    
    # 1. Full 2-Stage Spur Gearbox Package
    pkg = slicer_exporter.generate_3mf_package("gearbox_p0", micro_print=False, teeth_count=32)
    with zipfile.ZipFile(io.BytesIO(pkg), "r") as zf:
        files = zf.namelist()
        print(f"  ✓ Manufacturing Package Files: {files}")
        assert "meshes/gearbox_p0_driver_gear_z16.stl" in files
        assert "meshes/gearbox_p0_driven_gear_z32.stl" in files
        assert "meshes/gearbox_p0_gearbox_frame.stl" in files
        assert "meshes/gearbox_p0_hand_crank.stl" in files
        assert "manufacturing_manifest.json" in files
        assert "hardware_bom.json" in files
        assert "assembly_guide.md" in files

        # Triangle count checks
        gear_tri = inspect_stl_triangles(zf.read("meshes/gearbox_p0_driver_gear_z16.stl"))
        driven_tri = inspect_stl_triangles(zf.read("meshes/gearbox_p0_driven_gear_z32.stl"))
        frame_tri = inspect_stl_triangles(zf.read("meshes/gearbox_p0_gearbox_frame.stl"))
        print(f"  ✓ Driver Gear Triangles: {gear_tri}, Driven Gear Triangles: {driven_tri}, Frame Triangles: {frame_tri}")
        assert gear_tri > 800, f"Driver gear must have precision teeth (>800), got {gear_tri}"
        assert driven_tri > 1000, f"Driven gear must have precision teeth (>1000), got {driven_tri}"
        assert frame_tri > 200

        # Manifest verification
        manifest = json.loads(zf.read("manufacturing_manifest.json").decode("utf-8"))
        assert manifest["readiness_tier"] == "Print Ready"
        assert manifest["printer_profile"]["applied_backlash_mm"] == 0.25
        assert manifest["kinematics"]["gear_ratio"] == 2.0
        assert manifest["kinematics"]["center_distance_mm"] == 36.0
        assert manifest["gate_results"]["G1_geometry"] is True
        assert manifest["gate_results"]["G2_printer"] is True
        assert manifest["gate_results"]["G3_assembly"] is True
        assert manifest["gate_results"]["G4_slicing"] is True

        # Hardware BOM verification
        bom = json.loads(zf.read("hardware_bom.json").decode("utf-8"))
        assert any(item["name"] == "스테인리스 회전축 (Stainless Shaft)" for item in bom)
        assert any("625ZZ" in item["spec"] for item in bom)

    print("🎉 [Harness: Slicer Evaluator] ALL GENUINE MANUFACTURING 3MF & STL TESTS PASSED!\n")

if __name__ == "__main__":
    run_slicer_harness_tests()
