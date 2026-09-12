"""
Unit Test: Involute Spur Gear Mathematical Geometry & Watertightness Verification
"""
import math
import pytest
from app.services.cad.components.gears.spur_gear import InvoluteSpurGear, create_mating_gear_pair

def test_involute_gear_theoretical_dimensions():
    m = 1.5
    z = 20
    backlash = 0.25
    fit_clearance = 0.38
    bore = 5.0

    gear = InvoluteSpurGear(
        module=m,
        teeth_count=z,
        pressure_angle_deg=20.0,
        face_width=10.0,
        bore_diameter=bore,
        backlash=backlash,
        fit_clearance=fit_clearance
    )
    metrics = gear.get_gear_metrics()

    # Theoretical formulas:
    # d_pitch = m * z = 1.5 * 20 = 30.0 mm
    assert abs(metrics["pitch_diameter_mm"] - 30.0) < 1e-3
    # d_base = d_pitch * cos(20 deg) = 30 * 0.93969 = 28.191 mm
    assert abs(metrics["base_diameter_mm"] - (30.0 * math.cos(math.radians(20.0)))) < 1e-2
    # d_tip = m * (z + 2) = 1.5 * 22 = 33.0 mm
    assert abs(metrics["tip_diameter_mm"] - 33.0) < 1e-3
    # d_root = m * (z - 2.5) = 1.5 * 17.5 = 26.25 mm
    assert abs(metrics["root_diameter_mm"] - 26.25) < 1e-3

    # Backlash check on tooth thickness:
    # nominal thickness = pi * m / 2 = 2.356 mm
    nominal_thick = (math.pi * m) / 2.0
    expected_actual = nominal_thick - backlash
    assert abs(metrics["tooth_thickness_pitch_mm"] - expected_actual) < 1e-3

    # Bore clearance check
    assert abs(metrics["actual_bore_mm"] - (bore + fit_clearance)) < 1e-3

def test_involute_gear_mesh_watertightness_and_volume():
    gear = InvoluteSpurGear(module=1.5, teeth_count=16, face_width=8.0, bore_diameter=5.0)
    mesh = gear.to_trimesh()

    assert mesh.is_watertight is True, "Involute gear mesh must be 100% watertight"
    assert mesh.volume > 0.0, "Gear volume must be positive"
    assert len(mesh.faces) > 500, "Gear must have high precision polygonal tooth flanks"
    assert mesh.is_winding_consistent is True, "Mesh normals must be strictly consistent"

def test_mating_gear_pair_center_distance():
    m = 1.5
    z1 = 16
    z2 = 32
    g1, g2, center_dist = create_mating_gear_pair(module=m, teeth_1=z1, teeth_2=z2)

    # Theoretical center distance a = m * (z1 + z2) / 2 = 1.5 * 48 / 2 = 36.0 mm
    assert abs(center_dist - 36.0) < 1e-4
    assert g1.z == 16
    assert g2.z == 32
    assert g1.is_d_cut is True
