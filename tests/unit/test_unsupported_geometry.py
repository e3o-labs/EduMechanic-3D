"""
Unit Test: Unsupported Geometry Fail-Closed Behavior
Verifies:
1. bevel_gear request to CadQuery3DConverter raises UnsupportedGeometryError (no silent fallback).
2. bevel_gear request to generate_parametric_component returns status='unsupported'.
3. Supported geometry types (spur_gear) continue to generate normally.
"""
import pytest
from app.schemas.spec import ComponentSpec, ComponentParameter
from app.services.cad.converter import CadQuery3DConverter, UnsupportedGeometryError
from app.services.cad.generator import generate_parametric_component

def test_bevel_gear_raises_unsupported_geometry_error():
    converter = CadQuery3DConverter()
    spec = ComponentSpec(
        part_id="test_bevel",
        name="Unsupported Bevel Gear",
        geometry_type="bevel_gear",
        parameters=ComponentParameter(module=1.5, teeth_count=20, height=10.0)
    )

    with pytest.raises(UnsupportedGeometryError) as exc_info:
        converter.generate_and_convert(spec)

    assert "bevel_gear" in str(exc_info.value)
    assert "not supported in v0.1" in str(exc_info.value)

def test_generator_returns_unsupported_status_for_bevel_gear():
    spec = ComponentSpec(
        part_id="test_bevel_gen",
        name="Unsupported Bevel Gear in Generator",
        geometry_type="bevel_gear",
        parameters=ComponentParameter(module=1.5, teeth_count=20, height=10.0)
    )

    res = generate_parametric_component(spec)
    assert res["status"] == "unsupported"
    assert "Unsupported geometry type 'bevel_gear'" in res["error"]
    assert res["stl_url"] is None
    assert res["step_url"] is None

def test_spur_gear_still_succeeds():
    spec = ComponentSpec(
        part_id="test_spur_ok",
        name="Supported Spur Gear",
        geometry_type="spur_gear",
        parameters=ComponentParameter(module=1.5, teeth_count=16, height=8.0, bore_diameter=5.0)
    )

    res = generate_parametric_component(spec)
    assert res["status"] == "success"
    assert res["is_watertight"] is True
    assert res["volume_mm3"] > 0.0
