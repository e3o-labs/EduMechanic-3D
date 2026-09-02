"""
Harness Suite: 3MF / Planetary Helical Cutter & Involute Solid Geometry Verification
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
    print("🚀 [Harness: Slicer Evaluator] Starting 3MF Planetary Helical & Involute verification...")
    
    card_id = "sharpener_pro"
    pkg_bytes = slicer_exporter.generate_3mf_package(card_id, micro_print=False, cots_type="608zz", teeth_count=24)
    assert len(pkg_bytes) > 0, "Package bytes cannot be empty"
    
    zip_buffer = io.BytesIO(pkg_bytes)
    with zipfile.ZipFile(zip_buffer, "r") as zf:
        file_list = zf.namelist()
        print(f"  ✓ 3MF Package Files: {file_list}")
        assert "3D/3dmodel.model" in file_list
        assert f"meshes/{card_id}_housing.stl" in file_list
        assert f"meshes/{card_id}_involute_gear_z24.stl" in file_list
        assert f"meshes/{card_id}_helical_cutter_flute10.stl" in file_list
        assert "slicer_manifest.json" in file_list

        gear_triangles = inspect_stl_triangles(zf.read(f"meshes/{card_id}_involute_gear_z24.stl"))
        print(f"  ✓ Involute Gear STL Triangles: {gear_triangles}")
        assert gear_triangles > 500

        cutter_triangles = inspect_stl_triangles(zf.read(f"meshes/{card_id}_helical_cutter_flute10.stl"))
        print(f"  ✓ Helical Cutter STL Triangles: {cutter_triangles} (10-Flute Milling Blade)")
        assert cutter_triangles > 800, f"Helical cutter must have high density (>800), got {cutter_triangles}"

        manifest_data = json.loads(zf.read("slicer_manifest.json").decode("utf-8"))
        print(f"  ✓ Slicer Manifest Mechanism: {manifest_data['mechanism_type']}")
        assert manifest_data["gear_spec"]["helical_cutter_flutes"] == 10

    print("🎉 [Harness: Slicer Evaluator] ALL PLANETARY HELICAL CUTTER 3MF TESTS PASSED!\n")

if __name__ == "__main__":
    run_slicer_harness_tests()
