"""
Unit Tests for Mechanism Grammar v0.1 (Single-Stage Spur Gearbox)
Tests:
1. Valid fixture acceptance + derived parameters check + untested aspects
2. Seed determinism & reproducibility
3. Module mismatch rejection (GEAR_MODULE_MISMATCH)
4. Pressure angle mismatch rejection (GEAR_PRESSURE_ANGLE_MISMATCH)
5. Center distance mismatch rejection (CENTER_DISTANCE_MISMATCH)
6. Invalid shaft/bore fit rejection (INVALID_SHAFT_BORE_FIT)
7. Bore exceeds root diameter rejection (INVALID_SHAFT_BORE_FIT)
8. Missing required relations rejection (MISSING_REQUIRED_RELATION)
9. Unsupported primitive fail-closed rejection (UNSUPPORTED_PRIMITIVE)
10. Unsupported relation fail-closed rejection (UNSUPPORTED_RELATION)
11. Non-positive dimension rejection (DIMENSION_NON_POSITIVE)
12. Parameter provenance tagging
13. Assembly Builder deterministic CAD generation with canonical components
"""
import copy
import pytest

from app.schemas.grammar import (
    MechanismGrammar,
    MechanismFamily,
    PrimitiveType,
    RelationType,
    ComponentNode,
    RelationEdge,
    ParameterProvenance,
    ProvenanceValue,
)
from app.services.grammar.solver import SingleStageSpurGearboxSolver, extract_provenance
from app.services.grammar.assembly_builder import MechanismAssemblyBuilder

def make_valid_gearbox_grammar() -> MechanismGrammar:
    """Returns a minimal valid single_stage_spur_gearbox grammar fixture."""
    return MechanismGrammar(
        grammar_version="0.1.0",
        family=MechanismFamily.SINGLE_STAGE_SPUR_GEARBOX.value,
        seed=42,
        components=[
            ComponentNode(
                id="gear_driver",
                type=PrimitiveType.SPUR_GEAR.value,
                name="Driver Spur Gear (z=16)",
                parameters={
                    "module": 1.5,
                    "teeth_count": 16,
                    "face_width": 10.0,
                    "bore_diameter": 5.0,
                    "pressure_angle_deg": 20.0,
                },
                role="driver"
            ),
            ComponentNode(
                id="gear_driven",
                type=PrimitiveType.SPUR_GEAR.value,
                name="Driven Spur Gear (z=32)",
                parameters={
                    "module": 1.5,
                    "teeth_count": 32,
                    "face_width": 10.0,
                    "bore_diameter": 5.0,
                    "pressure_angle_deg": 20.0,
                },
                role="driven"
            ),
            ComponentNode(
                id="shaft_driver",
                type=PrimitiveType.SHAFT.value,
                name="Driver Input Shaft",
                parameters={"diameter": 5.0, "length": 45.0},
                role="input_shaft"
            ),
            ComponentNode(
                id="shaft_driven",
                type=PrimitiveType.SHAFT.value,
                name="Driven Output Shaft",
                parameters={"diameter": 5.0, "length": 45.0},
                role="output_shaft"
            ),
            ComponentNode(
                id="housing_frame",
                type=PrimitiveType.FRAME.value,
                name="Gearbox Frame",
                parameters={"center_distance": 36.0, "thickness": 6.0},
                role="main_frame"
            ),
            ComponentNode(
                id="crank_input",
                type=PrimitiveType.CRANK.value,
                name="Hand Crank",
                parameters={"arm_length": 38.0, "shaft_dia": 5.0},
                role="crank"
            ),
        ],
        relations=[
            RelationEdge(
                id="rel_mesh",
                type=RelationType.GEAR_MESH.value,
                source="gear_driver",
                target="gear_driven",
                parameters={"center_distance": 36.0}
            ),
            RelationEdge(
                id="rel_driver_gear_shaft",
                type=RelationType.FIXED.value,
                source="gear_driver",
                target="shaft_driver"
            ),
            RelationEdge(
                id="rel_driven_gear_shaft",
                type=RelationType.FIXED.value,
                source="gear_driven",
                target="shaft_driven"
            ),
            RelationEdge(
                id="rel_shaft1_frame",
                type=RelationType.SUPPORTED_BY.value,
                source="shaft_driver",
                target="housing_frame"
            ),
            RelationEdge(
                id="rel_shaft2_frame",
                type=RelationType.SUPPORTED_BY.value,
                source="shaft_driven",
                target="housing_frame"
            ),
        ]
    )


def test_valid_gearbox_grammar_accepted():
    solver = SingleStageSpurGearboxSolver()
    grammar = make_valid_gearbox_grammar()

    result = solver.validate(grammar)

    assert result.is_valid is True, f"Validation failed with errors: {result.errors}"
    assert len(result.errors) == 0

    derived = result.derived
    assert derived is not None
    # d1 = m * z1 = 1.5 * 16 = 24.0
    assert derived.d1_pitch_diameter_mm == 24.0
    # d2 = m * z2 = 1.5 * 32 = 48.0
    assert derived.d2_pitch_diameter_mm == 48.0
    # a = m * (z1 + z2) / 2 = 1.5 * 48 / 2 = 36.0
    assert derived.center_distance_mm == 36.0
    # ratio = 32 / 16 = 2.0
    assert derived.gear_ratio == 2.0
    assert derived.speed_ratio == 0.5
    # tip diameter da = d + 2m: da1 = 24 + 3 = 27.0, da2 = 48 + 3 = 51.0
    assert derived.tip_diameter_1_mm == 27.0
    assert derived.tip_diameter_2_mm == 51.0
    # root diameter df = d - 2.5m: df1 = 24 - 3.75 = 20.25, df2 = 48 - 3.75 = 44.25
    assert derived.root_diameter_1_mm == 20.25
    assert derived.root_diameter_2_mm == 44.25

    # Untested aspects must be explicitly disclosed
    assert len(result.untested_aspects) >= 4
    assert "full_agma_iso_load_rating_not_validated" in result.untested_aspects
    assert "fea_tooth_root_stress_fatigue_not_validated" in result.untested_aspects


def test_determinism_reproducibility():
    solver = SingleStageSpurGearboxSolver()
    g1 = make_valid_gearbox_grammar()
    g2 = make_valid_gearbox_grammar()

    res1 = solver.validate(g1)
    res2 = solver.validate(g2)

    assert res1.is_valid and res2.is_valid
    assert res1.derived.model_dump() == res2.derived.model_dump()


def test_module_mismatch_rejected():
    solver = SingleStageSpurGearboxSolver()
    grammar = make_valid_gearbox_grammar()
    # Change driven gear module to 2.0
    grammar.components[1].parameters["module"] = 2.0

    result = solver.validate(grammar)

    assert result.is_valid is False
    codes = [e.code for e in result.errors]
    assert "GEAR_MODULE_MISMATCH" in codes
    err = next(e for e in result.errors if e.code == "GEAR_MODULE_MISMATCH")
    assert err.path == "relations.rel_mesh"
    assert err.observed == [1.5, 2.0]
    assert err.expected == "equal"


def test_pressure_angle_mismatch_rejected():
    solver = SingleStageSpurGearboxSolver()
    grammar = make_valid_gearbox_grammar()
    # Change driven gear pressure angle to 14.5
    grammar.components[1].parameters["pressure_angle_deg"] = 14.5

    result = solver.validate(grammar)

    assert result.is_valid is False
    codes = [e.code for e in result.errors]
    assert "GEAR_PRESSURE_ANGLE_MISMATCH" in codes
    err = next(e for e in result.errors if e.code == "GEAR_PRESSURE_ANGLE_MISMATCH")
    assert err.observed == [20.0, 14.5]


def test_center_distance_mismatch_rejected():
    solver = SingleStageSpurGearboxSolver()
    grammar = make_valid_gearbox_grammar()
    # Frame center distance is 40.0 mm, theoretical is 36.0 mm
    frame_comp = next(c for c in grammar.components if c.id == "housing_frame")
    frame_comp.parameters["center_distance"] = 40.0

    result = solver.validate(grammar)

    assert result.is_valid is False
    codes = [e.code for e in result.errors]
    assert "CENTER_DISTANCE_MISMATCH" in codes
    err = next(e for e in result.errors if e.code == "CENTER_DISTANCE_MISMATCH")
    assert err.observed == 40.0
    assert err.expected == 36.0


def test_invalid_shaft_bore_fit_rejected():
    solver = SingleStageSpurGearboxSolver()
    grammar = make_valid_gearbox_grammar()
    # Shaft diameter 6.0 mm > gear bore 5.0 mm (interference)
    shaft_comp = next(c for c in grammar.components if c.id == "shaft_driver")
    shaft_comp.parameters["diameter"] = 6.0

    result = solver.validate(grammar)

    assert result.is_valid is False
    codes = [e.code for e in result.errors]
    assert "INVALID_SHAFT_BORE_FIT" in codes
    err = next(e for e in result.errors if e.code == "INVALID_SHAFT_BORE_FIT")
    assert err.observed["shaft_diameter"] == 6.0
    assert err.observed["bore_diameter"] == 5.0


def test_bore_exceeds_root_diameter_rejected():
    solver = SingleStageSpurGearboxSolver()
    grammar = make_valid_gearbox_grammar()
    # Root diameter for z=16, m=1.5 is 20.25 mm. Set bore to 22.0 mm
    gear_comp = next(c for c in grammar.components if c.id == "gear_driver")
    gear_comp.parameters["bore_diameter"] = 22.0
    shaft_comp = next(c for c in grammar.components if c.id == "shaft_driver")
    shaft_comp.parameters["diameter"] = 22.0

    result = solver.validate(grammar)

    assert result.is_valid is False
    codes = [e.code for e in result.errors]
    assert "INVALID_SHAFT_BORE_FIT" in codes
    err = next(e for e in result.errors if e.code == "INVALID_SHAFT_BORE_FIT")
    assert "exceeds or equals root diameter" in err.message


def test_missing_mesh_relation_rejected():
    solver = SingleStageSpurGearboxSolver()
    grammar = make_valid_gearbox_grammar()
    # Remove gear_mesh relation
    grammar.relations = [r for r in grammar.relations if r.type != RelationType.GEAR_MESH.value]

    result = solver.validate(grammar)

    assert result.is_valid is False
    codes = [e.code for e in result.errors]
    assert "MISSING_REQUIRED_RELATION" in codes


def test_missing_shaft_support_relation_rejected():
    solver = SingleStageSpurGearboxSolver()
    grammar = make_valid_gearbox_grammar()
    # Remove supported_by relation for shaft 1
    grammar.relations = [r for r in grammar.relations if r.id != "rel_shaft1_frame"]

    result = solver.validate(grammar)

    assert result.is_valid is False
    codes = [e.code for e in result.errors]
    assert "MISSING_REQUIRED_RELATION" in codes
    err = next(e for e in result.errors if e.code == "MISSING_REQUIRED_RELATION")
    assert "shaft_driver" in err.message


def test_unsupported_primitive_fails_closed():
    solver = SingleStageSpurGearboxSolver()
    grammar = make_valid_gearbox_grammar()
    # Inject unknown primitive 'bevel_gear'
    grammar.components.append(
        ComponentNode(
            id="bad_bevel",
            type="bevel_gear",
            name="Unsupported Bevel",
            parameters={"module": 1.5}
        )
    )

    result = solver.validate(grammar)

    assert result.is_valid is False
    codes = [e.code for e in result.errors]
    assert "UNSUPPORTED_PRIMITIVE" in codes
    err = next(e for e in result.errors if e.code == "UNSUPPORTED_PRIMITIVE")
    assert err.observed == "bevel_gear"


def test_unsupported_relation_fails_closed():
    solver = SingleStageSpurGearboxSolver()
    grammar = make_valid_gearbox_grammar()
    # Inject unknown relation 'worm_mesh'
    grammar.relations.append(
        RelationEdge(
            id="bad_rel",
            type="worm_mesh",
            source="gear_driver",
            target="gear_driven"
        )
    )

    result = solver.validate(grammar)

    assert result.is_valid is False
    codes = [e.code for e in result.errors]
    assert "UNSUPPORTED_RELATION" in codes
    err = next(e for e in result.errors if e.code == "UNSUPPORTED_RELATION")
    assert err.observed == "worm_mesh"


def test_non_positive_dimension_rejected():
    solver = SingleStageSpurGearboxSolver()
    grammar = make_valid_gearbox_grammar()
    # Negative face width
    gear_comp = next(c for c in grammar.components if c.id == "gear_driver")
    gear_comp.parameters["face_width"] = -5.0

    result = solver.validate(grammar)

    assert result.is_valid is False
    codes = [e.code for e in result.errors]
    assert "DIMENSION_NON_POSITIVE" in codes
    err = next(e for e in result.errors if e.code == "DIMENSION_NON_POSITIVE")
    assert err.observed == -5.0


def test_provenance_metadata_extracted():
    param_with_prov = ProvenanceValue(
        value=1.5,
        provenance=ParameterProvenance.MANUFACTURER_SPEC,
        source="Misumi Gear Catalog 2024"
    )
    assert param_with_prov.value == 1.5
    assert param_with_prov.provenance == ParameterProvenance.MANUFACTURER_SPEC

    extracted_prov = extract_provenance(param_with_prov)
    assert extracted_prov == ParameterProvenance.MANUFACTURER_SPEC


def test_assembly_builder_generates_watertight_meshes():
    grammar = make_valid_gearbox_grammar()
    builder = MechanismAssemblyBuilder()

    result = builder.build(grammar)

    assert result["status"] == "success"
    assert result["grammar_version"] == "0.1.0"
    assert result["metadata"]["parts_count"] == 6

    parts = result["parts"]
    assert "gear_driver" in parts
    assert "gear_driven" in parts
    assert "housing_frame" in parts
    assert "shaft_driver" in parts
    assert "shaft_driven" in parts
    assert "crank_input" in parts

    # Check that every part is a valid trimesh with positive volume
    for name, mesh in parts.items():
        assert mesh.is_watertight, f"Part '{name}' must be watertight"
        assert mesh.volume > 0.0, f"Part '{name}' volume must be positive"

    # Reject build when grammar is invalid
    bad_grammar = copy.deepcopy(grammar)
    bad_grammar.components[0].parameters["module"] = 99.0
    with pytest.raises(ValueError) as exc:
        builder.build(bad_grammar)
    assert "GEAR_MODULE_MISMATCH" in str(exc.value)
