from typing import List, Optional, Dict, Any
from enum import Enum
try:
    from pydantic import BaseModel, Field
except (ImportError, Exception):
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return self.__dict__
    def Field(default=None, **kwargs):
        return default

class FitProfileMap(BaseModel):
    press_fit: float = Field(0.12, description="억지 끼워맞춤 (베어링/고정축 압입, mm)")
    snug_fit: float = Field(0.20, description="중간 끼워맞춤 (M3 너트, 탈착 핀, mm)")
    sliding_fit: float = Field(0.30, description="미끄럼 끼워맞춤 (가이드 레일, mm)")
    rotating_fit: float = Field(0.38, description="회전 틈새 끼워맞춤 (수지 회전축/부싱, mm)")
    backlash: float = Field(0.25, description="기어 맞물림 치면 백래시 (mm)")

class PrinterProfile(BaseModel):
    profile_id: str = "classroom_fdm_v1"
    name: str = "EduMechanic Classroom FDM Profile v1"
    material: str = "PLA"
    nozzle_diameter: float = 0.40
    layer_height: float = 0.20
    min_wall_thickness: float = 1.20
    structural_wall_thickness: float = 1.60
    build_volume: List[float] = Field(default_factory=lambda: [180.0, 180.0, 180.0])
    max_overhang_deg: float = 45.0
    xy_compensation: float = 0.0
    hole_compensation: float = 0.15
    fit_profiles: FitProfileMap = Field(default_factory=FitProfileMap)

class PrintReadinessTier(str, Enum):
    CONCEPT = "Concept"
    PROTOTYPE = "Prototype"
    PRINT_READY = "Print Ready"

class GateValidationDetail(BaseModel):
    gate: str
    name: str
    passed: bool = False
    score: int = 0
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)

class ManufacturabilityReport(BaseModel):
    tier: PrintReadinessTier = PrintReadinessTier.CONCEPT
    overall_passed: bool = False
    score: int = 0
    g1_geometry: Optional[GateValidationDetail] = None
    g2_printer: Optional[GateValidationDetail] = None
    g3_assembly: Optional[GateValidationDetail] = None
    g4_slicing: Optional[GateValidationDetail] = None
    summary: str = "제조 검증 전 단계입니다."
    recommendations: List[str] = Field(default_factory=list)

class HardwareBOMItem(BaseModel):
    item_id: str
    name: str
    spec: str
    quantity: int = 1
    category: str = "fastener"  # fastener, shaft, bearing, cots
    optional: bool = False
    notes: Optional[str] = None

class AssemblyStepSpec(BaseModel):
    step_number: int
    title: str
    description: str
    parts_involved: List[str] = Field(default_factory=list)
    hardware_involved: List[str] = Field(default_factory=list)
    tip: Optional[str] = None

class ComponentParameter(BaseModel):
    outer_diameter: Optional[float] = Field(None, description="mm 단위 외경")
    height: Optional[float] = Field(None, description="mm 단위 높이")
    wall_thickness: Optional[float] = Field(None, description="mm 단위 두께")
    pitch_angle: Optional[float] = Field(None, description="피치 각도")
    teeth_count: Optional[int] = Field(None, description="톱니 수")
    module: Optional[float] = Field(1.5, description="기어 모듈 m")
    pressure_angle: Optional[float] = Field(20.0, description="압력각 (deg)")
    backlash: Optional[float] = Field(0.25, description="백래시 (mm)")
    bore_diameter: Optional[float] = Field(None, description="축 구멍 지름 (mm)")
    hub_diameter: Optional[float] = Field(None, description="허브 지름 (mm)")
    fit_type: Optional[str] = Field("rotating_fit", description="결합 공차 타입 (press_fit, snug_fit, sliding_fit, rotating_fit)")

class ComponentFeature(BaseModel):
    type: str = Field(..., description="feature 타입 (center_shaft, bolt_pattern 등)")
    diameter: Optional[float] = None
    depth: Optional[float] = None
    is_d_cut: Optional[bool] = False
    standard: Optional[str] = None
    count: Optional[int] = None
    pitch_circle_diameter: Optional[float] = None

class ExplodeVector(BaseModel):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0

class ComponentSpec(BaseModel):
    part_id: str
    name: str
    geometry_type: str = Field(..., description="cylinder, spur_gear, bevel_gear, gearbox_frame, hand_crank 등")
    is_printable: bool = True
    function_title: Optional[str] = None
    description: Optional[str] = None
    parameters: ComponentParameter = Field(default_factory=ComponentParameter)
    features: List[ComponentFeature] = Field(default_factory=list)
    explode_vector: Optional[ExplodeVector] = Field(default_factory=ExplodeVector)
    rotation_axis: Optional[str] = "Y"
    stem_principle: Optional[str] = None

class QuizSpec(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    explanation: str

class VLMParsingResult(BaseModel):
    card_id: str
    title: str
    category: str = "K-12 STEM Mechanical"
    ai_summary: str
    global_tolerance: float = 0.20
    printer_profile: PrinterProfile = Field(default_factory=PrinterProfile)
    readiness_status: ManufacturabilityReport = Field(default_factory=ManufacturabilityReport)
    components: List[ComponentSpec] = Field(default_factory=list)
    hardware_bom: List[HardwareBOMItem] = Field(default_factory=list)
    assembly_steps: List[AssemblyStepSpec] = Field(default_factory=list)
    quiz: QuizSpec
