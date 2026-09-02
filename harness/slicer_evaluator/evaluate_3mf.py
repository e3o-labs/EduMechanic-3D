"""
Harness Suite: 3MF / Multi-Mechanism Verification (Sharpener + Music Box)
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
    print("🚀 [Harness: Slicer Evaluator] Starting Multi-Mechanism 3MF verification...")
    
    # 1. Sharpener Planetary Helical Pack
    sh_pkg = slicer_exporter.generate_3mf_package("sharpener", teeth_count=24)
    with zipfile.ZipFile(io.BytesIO(sh_pkg), "r") as zf:
        files = zf.namelist()
        print(f"  ✓ Sharpener 3MF Files: {files}")
        assert "meshes/sharpener_helical_cutter_flute10.stl" in files
        c_tri = inspect_stl_triangles(zf.read("meshes/sharpener_helical_cutter_flute10.stl"))
        print(f"  ✓ Sharpener Helical Cutter Triangles: {c_tri}")
        assert c_tri > 800

    # 2. Music Box Pin Drum & Comb Pack
    mb_pkg = slicer_exporter.generate_3mf_package("musicbox")
    with zipfile.ZipFile(io.BytesIO(mb_pkg), "r") as zf:
        files = zf.namelist()
        print(f"  ✓ Music Box 3MF Files: {files}")
        assert "meshes/musicbox_melody_pin_drum.stl" in files
        assert "meshes/musicbox_tuned_comb_reeds.stl" in files
        assert "meshes/musicbox_drive_spur_gear_z28.stl" in files

        d_tri = inspect_stl_triangles(zf.read("meshes/musicbox_melody_pin_drum.stl"))
        comb_tri = inspect_stl_triangles(zf.read("meshes/musicbox_tuned_comb_reeds.stl"))
        print(f"  ✓ Music Box Drum Triangles: {d_tri}, Comb Triangles: {comb_tri}")
        assert d_tri > 500
        assert comb_tri > 100

    print("🎉 [Harness: Slicer Evaluator] ALL MULTI-MECHANISM 3MF/STL TESTS PASSED!\n")

if __name__ == "__main__":
    run_slicer_harness_tests()
