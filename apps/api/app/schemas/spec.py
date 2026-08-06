from typing import List, Optional
from pydantic import BaseModel, Field

class ComponentParameter(BaseModel):
    outer_diameter: Optional[float] = Field(None, description="mm 단위 외경")
    height: Optional[float] = Field(None, description="mm 단위 높이")
    wall_thickness: Optional[float] = Field(None, description="mm 단위 두께")
    pitch_angle: Optional[float] = Field(None, description="피치 각도")
    teeth_count: Optional[int] = Field(None, description="톱니 수")

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
    geometry_type: str = Field(..., description="cylinder, spur_gear, bevel_gear 등")
    function_title: Optional[str] = None
    description: Optional[str] = None
    parameters: ComponentParameter
    features: List[ComponentFeature] = []
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
    components: List[ComponentSpec]
    quiz: QuizSpec
