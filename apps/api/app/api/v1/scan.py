from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.spec import VLMParsingResult, ComponentSpec, ComponentParameter, ComponentFeature, QuizSpec, ExplodeVector
from app.services.cad.generator import generate_parametric_component

router = APIRouter()

@router.post("/scan", response_model=VLMParsingResult)
async def scan_machine_image(
    file: UploadFile = File(...),
    mode: str = Form("educational")
):
    """
    이미지 업로드 ➔ VLM 세그먼테이션/RAG ➔ JSON 사양 파싱 API
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드할 수 있습니다.")

    # Mock VLM & CadQuery Pipeline response for sharpener model
    result = VLMParsingResult(
        card_id=f"card_{file.filename.split('.')[0]}_001",
        title="수동 연필깎이 메커니즘",
        category="K-12 STEM Mechanical",
        ai_summary="손잡이를 돌리면 직각 베벨 기어가 힘의 방향을 90도 변환하여 칼날을 회전시켜요!",
        global_tolerance=0.20,
        components=[
            ComponentSpec(
                part_id="part_housing",
                name="외부 투명 케이스",
                geometry_type="cylinder",
                function_title="내부 보호 및 연필 안내",
                description="내부 톱니바퀴가 어떻게 돌아가는지 훤히 들여다볼 수 있는 아크릴 케이스예요.",
                parameters=ComponentParameter(outer_diameter=50.0, height=35.0, wall_thickness=2.5),
                explode_vector=ExplodeVector(x=0.0, y=1.0, z=0.0),
                rotation_axis="Y",
                stem_principle="투명 하우징을 통한 기계 내부 시각화"
            ),
            ComponentSpec(
                part_id="part_bevel_gear",
                name="중앙 경사 베벨 기어",
                geometry_type="bevel_gear",
                function_title="동력 90도 직각 전달",
                description="손잡이의 회전력을 직각으로 꺾어 칼날 축으로 전달해 주는 핵심 기어입니다.",
                parameters=ComponentParameter(outer_diameter=30.0, height=15.0, pitch_angle=45.0, teeth_count=16),
                features=[
                    ComponentFeature(type="center_shaft", diameter=6.0, depth=15.0, is_d_cut=True),
                    ComponentFeature(type="bolt_pattern", standard="M3", count=4, pitch_circle_diameter=22.0)
                ],
                explode_vector=ExplodeVector(x=0.0, y=0.0, z=0.0),
                rotation_axis="Y",
                stem_principle="회전 운동 방향 전환 (Bevel Gear Principle)"
            )
        ],
        quiz=QuizSpec(
            question="손잡이를 2바퀴 돌릴 때 칼날이 6바퀴 돌았습니다. 회전 속도는 몇 배 빨라졌을까요?",
            options=["2배 빠름", "3배 빠름", "6배 빠름", "똑같음"],
            correct_index=1,
            explanation="입력 2회전에 출력 6회전이므로 6 ÷ 2 = 3배 더 빠르게 돌아요!"
        )
    )

    return result
