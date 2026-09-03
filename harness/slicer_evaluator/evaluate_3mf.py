"""
Harness Suite: 3MF / Multi-Mechanism Verification (Conical Ring + Music Box + Backlash)
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
    print("🚀 [Harness: Slicer Evaluator] Starting 3MF Conical Ring & Toleranced Solid verification...")
    
    # 1. Sharpener Planetary Pack with 18-deg Conical Ring Gear
    sh_pkg = slicer_exporter.generate_3mf_package("sharpener")
    with zipfile.ZipFile(io.BytesIO(sh_pkg), "r") as zf:
        files = zf.namelist()
        print(f"  ✓ Sharpener 3MF Files: {files}")
        assert "meshes/sharpener_conical_ring_gear_18deg_z24.stl" in files
        assert "meshes/sharpener_pinion_gear_z8.stl" in files
        assert "meshes/sharpener_helical_cutter_flute10.stl" in files

        ring_tri = inspect_stl_triangles(zf.read("meshes/sharpener_conical_ring_gear_18deg_z24.stl"))
        cutter_tri = inspect_stl_triangles(zf.read("meshes/sharpener_helical_cutter_flute10.stl"))
        print(f"  ✓ Conical Ring Gear Triangles: {ring_tri}, Helical Cutter Triangles: {cutter_tri}")
        assert ring_tri > 1000, f"Conical ring must be high precision (>1000), got {ring_tri}"
        assert cutter_tri > 800

        manifest = json.loads(zf.read("slicer_manifest.json").decode("utf-8"))
        assert manifest["engineering_tolerances"]["applied_backlash_mm"] == 0.20
        assert manifest["engineering_tolerances"]["conical_cone_angle_deg"] == 18.0

    # 2. Music Box Pin Drum & Comb Pack
    mb_pkg = slicer_exporter.generate_3mf_package("musicbox")
    with zipfile.ZipFile(io.BytesIO(mb_pkg), "r") as zf:
        files = zf.namelist()
        print(f"  ✓ Music Box 3MF Files: {files}")
        assert "meshes/musicbox_melody_pin_drum.stl" in files
        assert "meshes/musicbox_tuned_comb_reeds.stl" in files
        assert "meshes/musicbox_drive_spur_gear_z28.stl" in files

        manifest = json.loads(zf.read("slicer_manifest.json").decode("utf-8"))
        assert manifest["engineering_tolerances"]["applied_backlash_mm"] == 0.20

    print("🎉 [Harness: Slicer Evaluator] ALL 3MF CONICAL & TOLERANCED STL TESTS PASSED!\n")

if __name__ == "__main__":
    run_slicer_harness_tests()
