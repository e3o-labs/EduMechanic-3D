"""
Mechanism Grammar Solver v0.1 for Single-Stage Spur Gearbox
Validates C1 (Schema), C2 (Geometry), C3 (Kinematics), and C4 (Fit/Manufacturing) constraints.
Produces deterministic derived kinematic/geometric parameters and machine-readable rejection diagnostics.
"""
import math
from typing import Dict, Any, List, Optional, Tuple, Union

from app.schemas.grammar import (
    MechanismGrammar,
    MechanismFamily,
    PrimitiveType,
    RelationType,
    ConstraintValidationResult,
    RejectionDiagnostic,
    DerivedParameters,
    ParameterProvenance,
    ComponentNode,
    RelationEdge,
)

SUPPORTED_PRIMITIVES = {p.value for p in PrimitiveType}
SUPPORTED_RELATIONS = {r.value for r in RelationType}

def extract_numeric_value(val: Any, default: Optional[float] = None) -> Optional[float]:
    """Helper to extract a float number from a primitive float/int, ProvenanceValue, or dict."""
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, dict) and "value" in val:
        try:
            return float(val["value"])
        except (ValueError, TypeError):
            return default
    if hasattr(val, "value"):
        try:
            return float(val.value)
        except (ValueError, TypeError):
            return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def extract_provenance(val: Any) -> ParameterProvenance:
    """Helper to extract ParameterProvenance from a parameter."""
    if isinstance(val, dict) and "provenance" in val:
        prov_str = val["provenance"]
        try:
            return ParameterProvenance(prov_str)
        except ValueError:
            return ParameterProvenance.ASSUMED
    if hasattr(val, "provenance"):
        return val.provenance
    return ParameterProvenance.ASSUMED


class SingleStageSpurGearboxSolver:
    """
    Deterministic constraint solver for single_stage_spur_gearbox mechanism family.
    Evaluates:
      C1: Schema completeness, supported primitive/relation registries, required components & edges.
      C2: Positive geometric dimensions, bore < root diameter.
      C3: Involute gear module matching, pressure angle matching, theoretical center distance derivation.
      C4: Shaft-bore fits, frame center distance alignment, clearance validation.
    """

    TOLERANCE_CENTER_DISTANCE_MM = 0.05
    TOLERANCE_FLOAT_MATCH = 1e-4

    def validate(self, grammar: MechanismGrammar) -> ConstraintValidationResult:
        errors: List[RejectionDiagnostic] = []
        warnings: List[RejectionDiagnostic] = []

        # -------------------------------------------------------------
        # C1. Family & Registry Validation
        # -------------------------------------------------------------
        if grammar.family != MechanismFamily.SINGLE_STAGE_SPUR_GEARBOX.value:
            errors.append(
                RejectionDiagnostic(
                    code="UNSUPPORTED_FAMILY",
                    path="family",
                    message=f"Mechanism family '{grammar.family}' is not supported in v0.1. "
                            f"Supported family: '{MechanismFamily.SINGLE_STAGE_SPUR_GEARBOX.value}'",
                    severity="error",
                    observed=grammar.family,
                    expected=MechanismFamily.SINGLE_STAGE_SPUR_GEARBOX.value,
                )
            )
            return ConstraintValidationResult(is_valid=False, errors=errors, warnings=warnings)

        comp_map: Dict[str, ComponentNode] = {}
        for comp in grammar.components:
            comp_map[comp.id] = comp
            # Check primitive type against strict whitelist
            if comp.type not in SUPPORTED_PRIMITIVES:
                errors.append(
                    RejectionDiagnostic(
                        code="UNSUPPORTED_PRIMITIVE",
                        path=f"components.{comp.id}.type",
                        message=f"Unsupported primitive type '{comp.type}'. "
                                f"Supported types: {sorted(SUPPORTED_PRIMITIVES)}",
                        severity="error",
                        observed=comp.type,
                        expected=sorted(SUPPORTED_PRIMITIVES),
                    )
                )

        for rel in grammar.relations:
            # Check relation type against strict whitelist
            if rel.type not in SUPPORTED_RELATIONS:
                errors.append(
                    RejectionDiagnostic(
                        code="UNSUPPORTED_RELATION",
                        path=f"relations.{rel.id}.type",
                        message=f"Unsupported relation type '{rel.type}'. "
                                f"Supported types: {sorted(SUPPORTED_RELATIONS)}",
                        severity="error",
                        observed=rel.type,
                        expected=sorted(SUPPORTED_RELATIONS),
                    )
                )
            # Check source and target refer to valid components
            if rel.source not in comp_map:
                errors.append(
                    RejectionDiagnostic(
                        code="INVALID_RELATION_TARGET",
                        path=f"relations.{rel.id}.source",
                        message=f"Relation source component '{rel.source}' not found in component graph",
                        severity="error",
                        observed=rel.source,
                    )
                )
            if rel.target not in comp_map:
                errors.append(
                    RejectionDiagnostic(
                        code="INVALID_RELATION_TARGET",
                        path=f"relations.{rel.id}.target",
                        message=f"Relation target component '{rel.target}' not found in component graph",
                        severity="error",
                        observed=rel.target,
                    )
                )

        # Stop early if unsupported primitives/relations or broken references exist
        if errors:
            return ConstraintValidationResult(is_valid=False, errors=errors, warnings=warnings)

        # Find components by primitive type
        spur_gears = [c for c in grammar.components if c.type == PrimitiveType.SPUR_GEAR.value]
        shafts = [c for c in grammar.components if c.type == PrimitiveType.SHAFT.value]
        frames = [c for c in grammar.components if c.type == PrimitiveType.FRAME.value]
        cranks = [c for c in grammar.components if c.type == PrimitiveType.CRANK.value]

        # Minimum required component check
        if len(spur_gears) < 2:
            errors.append(
                RejectionDiagnostic(
                    code="MISSING_REQUIRED_COMPONENT",
                    path="components",
                    message=f"Single-stage spur gearbox requires at least 2 spur gears, found {len(spur_gears)}",
                    severity="error",
                    observed=len(spur_gears),
                    expected=2,
                )
            )
        if len(shafts) < 2:
            errors.append(
                RejectionDiagnostic(
                    code="MISSING_REQUIRED_COMPONENT",
                    path="components",
                    message=f"Single-stage spur gearbox requires at least 2 shafts, found {len(shafts)}",
                    severity="error",
                    observed=len(shafts),
                    expected=2,
                )
            )
        if len(frames) < 1:
            errors.append(
                RejectionDiagnostic(
                    code="MISSING_REQUIRED_COMPONENT",
                    path="components",
                    message="Single-stage spur gearbox requires at least 1 frame/housing",
                    severity="error",
                    observed=len(frames),
                    expected=1,
                )
            )

        if errors:
            return ConstraintValidationResult(is_valid=False, errors=errors, warnings=warnings)

        # Find mesh relation
        mesh_relations = [r for r in grammar.relations if r.type == RelationType.GEAR_MESH.value]
        if not mesh_relations:
            errors.append(
                RejectionDiagnostic(
                    code="MISSING_REQUIRED_RELATION",
                    path="relations",
                    message="Missing required 'gear_mesh' relation between driver and driven spur gears",
                    severity="error",
                    expected="gear_mesh",
                )
            )
            return ConstraintValidationResult(is_valid=False, errors=errors, warnings=warnings)

        mesh_rel = mesh_relations[0]
        gear1 = comp_map.get(mesh_rel.source)
        gear2 = comp_map.get(mesh_rel.target)

        if not gear1 or not gear2 or gear1.type != PrimitiveType.SPUR_GEAR.value or gear2.type != PrimitiveType.SPUR_GEAR.value:
            errors.append(
                RejectionDiagnostic(
                    code="INVALID_RELATION_TARGET",
                    path=f"relations.{mesh_rel.id}",
                    message="gear_mesh relation must connect two 'spur_gear' primitive components",
                    severity="error",
                )
            )
            return ConstraintValidationResult(is_valid=False, errors=errors, warnings=warnings)

        # -------------------------------------------------------------
        # C2. Geometric Dimensions & Positive Value Constraints
        # -------------------------------------------------------------
        for comp in grammar.components:
            for param_key, param_raw in comp.parameters.items():
                num_val = extract_numeric_value(param_raw)
                if num_val is not None:
                    # Specific dimension positivity check
                    if param_key in {
                        "module", "teeth_count", "face_width", "height",
                        "bore_diameter", "diameter", "length", "thickness",
                        "inner_diameter", "outer_diameter", "sleeve_length",
                        "arm_length", "shaft_dia"
                    }:
                        if num_val <= 0.0:
                            errors.append(
                                RejectionDiagnostic(
                                    code="DIMENSION_NON_POSITIVE",
                                    path=f"components.{comp.id}.parameters.{param_key}",
                                    message=f"Component '{comp.id}' parameter '{param_key}' must be strictly positive, got {num_val}",
                                    severity="error",
                                    observed=num_val,
                                    expected="> 0.0",
                                )
                            )

        # Extract gear parameters
        m1 = extract_numeric_value(gear1.parameters.get("module"))
        z1 = extract_numeric_value(gear1.parameters.get("teeth_count"))
        b1 = extract_numeric_value(gear1.parameters.get("bore_diameter"), default=5.0)
        pa1 = extract_numeric_value(gear1.parameters.get("pressure_angle_deg"), default=20.0)

        m2 = extract_numeric_value(gear2.parameters.get("module"))
        z2 = extract_numeric_value(gear2.parameters.get("teeth_count"))
        b2 = extract_numeric_value(gear2.parameters.get("bore_diameter"), default=5.0)
        pa2 = extract_numeric_value(gear2.parameters.get("pressure_angle_deg"), default=20.0)

        if m1 is None or z1 is None or m2 is None or z2 is None or m1 <= 0 or z1 <= 0 or m2 <= 0 or z2 <= 0:
            errors.append(
                RejectionDiagnostic(
                    code="INVALID_GEAR_PARAMETERS",
                    path="components",
                    message="Gear module and teeth_count must be valid positive numbers",
                    severity="error",
                )
            )
            return ConstraintValidationResult(is_valid=False, errors=errors, warnings=warnings)

        z1 = int(z1)
        z2 = int(z2)

        # -------------------------------------------------------------
        # C3. Kinematic Compatibility & Derivations
        # -------------------------------------------------------------
        # Module match
        if abs(m1 - m2) > self.TOLERANCE_FLOAT_MATCH:
            errors.append(
                RejectionDiagnostic(
                    code="GEAR_MODULE_MISMATCH",
                    path=f"relations.{mesh_rel.id}",
                    message=f"Mating spur gears must use the same module (driver: {m1}, driven: {m2})",
                    severity="error",
                    observed=[m1, m2],
                    expected="equal",
                )
            )

        # Pressure angle match
        if abs(pa1 - pa2) > self.TOLERANCE_FLOAT_MATCH:
            errors.append(
                RejectionDiagnostic(
                    code="GEAR_PRESSURE_ANGLE_MISMATCH",
                    path=f"relations.{mesh_rel.id}",
                    message=f"Mating spur gears must have matching pressure angles (driver: {pa1}°, driven: {pa2}°)",
                    severity="error",
                    observed=[pa1, pa2],
                    expected="equal",
                )
            )

        # Theoretical derivations
        m = m1
        d1 = m * z1
        d2 = m * z2
        a_derived = m * (z1 + z2) / 2.0
        da1 = d1 + 2.0 * m
        da2 = d2 + 2.0 * m
        df1 = max(0.5 * m, d1 - 2.5 * m)
        df2 = max(0.5 * m, d2 - 2.5 * m)
        gear_ratio = float(z2) / float(z1)
        speed_ratio = float(z1) / float(z2)

        # Bore < Root Diameter Check
        if b1 >= df1:
            errors.append(
                RejectionDiagnostic(
                    code="INVALID_SHAFT_BORE_FIT",
                    path=f"components.{gear1.id}.parameters.bore_diameter",
                    message=f"Gear '{gear1.id}' bore diameter ({b1} mm) exceeds or equals root diameter ({df1:.3f} mm)",
                    severity="error",
                    observed=b1,
                    expected=f"< {df1:.3f}",
                )
            )
        if b2 >= df2:
            errors.append(
                RejectionDiagnostic(
                    code="INVALID_SHAFT_BORE_FIT",
                    path=f"components.{gear2.id}.parameters.bore_diameter",
                    message=f"Gear '{gear2.id}' bore diameter ({b2} mm) exceeds or equals root diameter ({df2:.3f} mm)",
                    severity="error",
                    observed=b2,
                    expected=f"< {df2:.3f}",
                )
            )

        # Mesh relation center distance check (if specified)
        rel_cd = extract_numeric_value(mesh_rel.parameters.get("center_distance") or mesh_rel.parameters.get("actual_center_dist"))
        if rel_cd is not None and abs(rel_cd - a_derived) > self.TOLERANCE_CENTER_DISTANCE_MM:
            errors.append(
                RejectionDiagnostic(
                    code="CENTER_DISTANCE_MISMATCH",
                    path=f"relations.{mesh_rel.id}.parameters.center_distance",
                    message=f"Mesh relation center distance ({rel_cd} mm) does not match theoretical pitch center distance ({a_derived:.3f} mm)",
                    severity="error",
                    observed=rel_cd,
                    expected=round(a_derived, 3),
                )
            )

        # Frame center distance check
        frame = frames[0]
        frame_cd = extract_numeric_value(frame.parameters.get("center_distance"))
        if frame_cd is not None and abs(frame_cd - a_derived) > self.TOLERANCE_CENTER_DISTANCE_MM:
            errors.append(
                RejectionDiagnostic(
                    code="CENTER_DISTANCE_MISMATCH",
                    path=f"components.{frame.id}.parameters.center_distance",
                    message=f"Frame '{frame.id}' center distance ({frame_cd} mm) does not match theoretical gear center distance ({a_derived:.3f} mm)",
                    severity="error",
                    observed=frame_cd,
                    expected=round(a_derived, 3),
                )
            )

        # -------------------------------------------------------------
        # C4. Shaft-Bore Fit & Support Relation Constraints
        # -------------------------------------------------------------
        # Each gear must be attached to a shaft via coaxial or fixed relation
        gear_shaft_map: Dict[str, Tuple[str, str]] = {}  # gear_id -> (shaft_id, relation_id)
        for rel in grammar.relations:
            if rel.type in {RelationType.COAXIAL.value, RelationType.FIXED.value}:
                src = comp_map.get(rel.source)
                tgt = comp_map.get(rel.target)
                if src and tgt:
                    if src.type == PrimitiveType.SPUR_GEAR.value and tgt.type == PrimitiveType.SHAFT.value:
                        gear_shaft_map[src.id] = (tgt.id, rel.id)
                    elif src.type == PrimitiveType.SHAFT.value and tgt.type == PrimitiveType.SPUR_GEAR.value:
                        gear_shaft_map[tgt.id] = (src.id, rel.id)

        for gear in [gear1, gear2]:
            if gear.id not in gear_shaft_map:
                errors.append(
                    RejectionDiagnostic(
                        code="MISSING_REQUIRED_RELATION",
                        path="relations",
                        message=f"Gear '{gear.id}' must be connected to a shaft via 'coaxial' or 'fixed' relation",
                        severity="error",
                        expected="coaxial or fixed",
                    )
                )
            else:
                shaft_id, rel_id = gear_shaft_map[gear.id]
                shaft_comp = comp_map[shaft_id]
                s_dia = extract_numeric_value(shaft_comp.parameters.get("diameter"), default=5.0)
                g_bore = extract_numeric_value(gear.parameters.get("bore_diameter"), default=5.0)

                if s_dia is not None and g_bore is not None:
                    # Shaft diameter cannot exceed nominal bore (negative clearance / cannot assemble)
                    if s_dia > g_bore:
                        errors.append(
                            RejectionDiagnostic(
                                code="INVALID_SHAFT_BORE_FIT",
                                path=f"relations.{rel_id}",
                                message=f"Shaft '{shaft_id}' diameter ({s_dia} mm) exceeds gear '{gear.id}' bore diameter ({g_bore} mm)",
                                severity="error",
                                observed={"shaft_diameter": s_dia, "bore_diameter": g_bore},
                                expected=f"shaft_diameter <= {g_bore}",
                            )
                        )
                    elif g_bore - s_dia > 1.0:
                        warnings.append(
                            RejectionDiagnostic(
                                code="EXCESSIVE_SHAFT_BORE_CLEARANCE",
                                path=f"relations.{rel_id}",
                                message=f"Excessive clearance ({g_bore - s_dia:.2f} mm) between shaft '{shaft_id}' and gear '{gear.id}'",
                                severity="warning",
                                observed=g_bore - s_dia,
                                expected="< 1.0 mm",
                            )
                        )

        # Shafts supported by frame check
        supported_shafts = set()
        for rel in grammar.relations:
            if rel.type == RelationType.SUPPORTED_BY.value:
                src = comp_map.get(rel.source)
                tgt = comp_map.get(rel.target)
                if src and tgt:
                    if src.type == PrimitiveType.SHAFT.value and tgt.type == PrimitiveType.FRAME.value:
                        supported_shafts.add(src.id)
                    elif src.type == PrimitiveType.FRAME.value and tgt.type == PrimitiveType.SHAFT.value:
                        supported_shafts.add(tgt.id)

        for shaft in shafts:
            if shaft.id not in supported_shafts:
                errors.append(
                    RejectionDiagnostic(
                        code="MISSING_REQUIRED_RELATION",
                        path="relations",
                        message=f"Shaft '{shaft.id}' must be supported by frame '{frame.id}' via 'supported_by' relation",
                        severity="error",
                        expected=f"supported_by(shaft='{shaft.id}', frame='{frame.id}')",
                    )
                )

        # Crank check if present
        for crank in cranks:
            crank_shaft_dia = extract_numeric_value(crank.parameters.get("shaft_dia"), default=5.0)
            driver_shaft_id = gear_shaft_map.get(gear1.id, (None, None))[0]
            if driver_shaft_id:
                driver_shaft_dia = extract_numeric_value(comp_map[driver_shaft_id].parameters.get("diameter"), default=5.0)
                if driver_shaft_dia is not None and crank_shaft_dia is not None:
                    if driver_shaft_dia > crank_shaft_dia:
                        errors.append(
                            RejectionDiagnostic(
                                code="INVALID_SHAFT_BORE_FIT",
                                path=f"components.{crank.id}.parameters.shaft_dia",
                                message=f"Crank '{crank.id}' shaft hole ({crank_shaft_dia} mm) smaller than driver shaft ({driver_shaft_dia} mm)",
                                severity="error",
                                observed={"crank_shaft_dia": crank_shaft_dia, "driver_shaft_dia": driver_shaft_dia},
                                expected=f">= {driver_shaft_dia}",
                            )
                        )

        is_valid = len(errors) == 0
        derived = None

        if is_valid:
            derived = DerivedParameters(
                d1_pitch_diameter_mm=round(d1, 4),
                d2_pitch_diameter_mm=round(d2, 4),
                center_distance_mm=round(a_derived, 4),
                gear_ratio=round(gear_ratio, 4),
                speed_ratio=round(speed_ratio, 4),
                tip_diameter_1_mm=round(da1, 4),
                tip_diameter_2_mm=round(da2, 4),
                root_diameter_1_mm=round(df1, 4),
                root_diameter_2_mm=round(df2, 4),
            )

        return ConstraintValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            derived=derived,
        )
