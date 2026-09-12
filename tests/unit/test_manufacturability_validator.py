"""
Unit Test: Manufacturability Validator Pipeline (Gates G1 ~ G4)
"""
import pytest
import trimesh
import numpy as np

from app.schemas.spec import PrinterProfile
from app.services.cad.validator import ManufacturabilityValidator
from app.services.cad.components.gears.spur_gear import InvoluteSpurGear

def test_g1_geometry_validation():
    val = ManufacturabilityValidator()

    # Valid watertight box
    box = trimesh.creation.box(extents=[20, 20, 10])
    res_pass = val.validate_g1_geometry(box, "test_box")
    assert res_pass.passed is True
    assert res_pass.score == 100
    assert len(res_pass.errors) == 0

    # Non-watertight mesh (remove 2 faces)
    open_mesh = box.copy()
    open_mesh.faces = open_mesh.faces[:-2]
    res_fail = val.validate_g1_geometry(open_mesh, "open_box")
    assert res_fail.passed is False
    assert any("Non-watertight" in e for e in res_fail.errors)

def test_g2_printer_validation_build_volume_and_wall():
    val = ManufacturabilityValidator()
    # Profile has build volume [180, 180, 180], min wall 1.2

    # Compliant part
    gear = InvoluteSpurGear(module=1.5, teeth_count=20, face_width=10.0)
    mesh = gear.to_trimesh()
    res = val.validate_g2_printer(mesh, "gear_20t")
    assert res.passed is True
    assert res.metrics["bounding_box_mm"][0] < 180.0
    assert res.metrics["overhang_area_ratio"] < 0.15

    # Part exceeding build volume
    huge_box = trimesh.creation.box(extents=[250, 100, 50])
    res_huge = val.validate_g2_printer(huge_box, "huge_box")
    assert res_huge.passed is False
    assert any("빌드 볼륨" in e for e in res_huge.errors)

def test_g3_assembly_validation():
    val = ManufacturabilityValidator()

    # Two non-colliding parts separated in space
    b1 = trimesh.creation.box(extents=[10, 10, 10])
    b2 = trimesh.creation.box(extents=[10, 10, 10])
    b2.apply_translation([30, 0, 0])

    parts = {"box1": b1, "box2": b2}
    res = val.validate_g3_assembly(parts)
    assert res.passed is True
    assert res.metrics["has_collision"] is False

    # Two heavily penetrating parts
    b3 = trimesh.creation.box(extents=[10, 10, 10])
    colliding_parts = {"box1": b1, "box3": b3}
    res_coll = val.validate_g3_assembly(colliding_parts)
    assert res_coll.passed is False
    assert len(res_coll.errors) > 0
    assert any("물리적 간섭" in e for e in res_coll.errors)

def test_g4_slicing_validation():
    val = ManufacturabilityValidator()

    gear = InvoluteSpurGear(module=1.5, teeth_count=16, face_width=8.0)
    mesh = gear.to_trimesh()

    res = val.validate_g4_slicing(mesh, "gear_16t")
    assert res.passed is True
    assert res.metrics["total_layers"] > 30
    assert res.metrics["estimated_filament_mass_g"] > 0.0
    assert res.metrics["estimated_print_time_min"] >= 4
