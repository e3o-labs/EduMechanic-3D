"""
Mechanism Grammar Schema v0.1
Defines structured grammar specification, primitives, relations, parameter provenance,
and machine-readable validation diagnostics for single-stage spur gearboxes.
"""
from enum import Enum
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field

class MechanismFamily(str, Enum):
    SINGLE_STAGE_SPUR_GEARBOX = "single_stage_spur_gearbox"

class PrimitiveType(str, Enum):
    SPUR_GEAR = "spur_gear"
    SHAFT = "shaft"
    BUSHING = "bushing"
    FRAME = "frame"
    CRANK = "crank"

class RelationType(str, Enum):
    COAXIAL = "coaxial"
    FIXED = "fixed"
    REVOLUTE = "revolute"
    GEAR_MESH = "gear_mesh"
    SUPPORTED_BY = "supported_by"

class ParameterProvenance(str, Enum):
    MEASURED = "measured"
    LITERATURE = "literature"
    MANUFACTURER_SPEC = "manufacturer_spec"
    ASSUMED = "assumed"

class ProvenanceValue(BaseModel):
    value: Union[float, int, str]
    provenance: ParameterProvenance = ParameterProvenance.ASSUMED
    source: Optional[str] = None

class RejectionDiagnostic(BaseModel):
    code: str
    path: str
    message: str
    severity: str = "error"  # "error" | "warning"
    observed: Optional[Any] = None
    expected: Optional[Any] = None

class DerivedParameters(BaseModel):
    d1_pitch_diameter_mm: float
    d2_pitch_diameter_mm: float
    center_distance_mm: float
    gear_ratio: float
    speed_ratio: float
    tip_diameter_1_mm: float
    tip_diameter_2_mm: float
    root_diameter_1_mm: float
    root_diameter_2_mm: float

class ConstraintValidationResult(BaseModel):
    is_valid: bool
    errors: List[RejectionDiagnostic] = Field(default_factory=list)
    warnings: List[RejectionDiagnostic] = Field(default_factory=list)
    derived: Optional[DerivedParameters] = None
    untested_aspects: List[str] = Field(
        default_factory=lambda: [
            "full_agma_iso_load_rating_not_validated",
            "contact_ratio_analytical_only",
            "undercut_profile_shift_not_solved",
            "fea_tooth_root_stress_fatigue_not_validated",
            "exact_3d_mesh_boolean_contact_dynamics_not_validated"
        ]
    )

class ComponentNode(BaseModel):
    id: str
    type: str
    name: str
    parameters: Dict[str, Any]
    role: Optional[str] = None  # e.g., "driver", "driven", "input_shaft", "output_shaft", "main_frame"

class RelationEdge(BaseModel):
    id: str
    type: str
    source: str
    target: str
    parameters: Dict[str, Any] = Field(default_factory=dict)

class MechanismGrammar(BaseModel):
    grammar_version: str = "0.1.0"
    family: str = "single_stage_spur_gearbox"
    seed: int = 42
    components: List[ComponentNode]
    relations: List[RelationEdge]
    metadata: Dict[str, Any] = Field(default_factory=dict)
