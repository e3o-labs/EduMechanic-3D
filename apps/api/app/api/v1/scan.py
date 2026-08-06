from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.spec import VLMParsingResult
from app.services.vlm.agent import VisionPerceptionAgent
from app.services.rag.cache_engine import global_cache_engine
from app.services.cad.converter import CadQuery3DConverter

router = APIRouter()
vlm_agent = VisionPerceptionAgent()
cad_converter = CadQuery3DConverter()

@router.post("/scan", response_model=VLMParsingResult)
async def scan_machine_image(
    file: UploadFile = File(...),
    mode: str = Form("educational")
):
    """
    Step 1~4 AI Pipeline API:
    1. Check Data Reuse Cache (Zero LLM token cost)
    2. Vision Perception Agent VLM analysis
    3. CadQuery 3D Parametric CAD & GLB conversion
    4. Store in Cache for community reuse
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드할 수 있습니다.")

    contents = await file.read()

    # Step 2 Cache-First Check: Data Reuse
    cached = global_cache_engine.get_cached_result(contents)
    if cached:
        return cached

    # Step 1 & 3: Vision Perception Agent Analysis
    result = await vlm_agent.analyze_machine_image(contents, file.filename)

    # Step 4: 3D Parametric CAD Generation
    for comp in result.components:
        cad_res = cad_converter.generate_and_convert(comp)
        print(f"🔧 CAD Exported for {comp.name}: {cad_res.get('status')}")

    # Store in Cache for Data Reuse
    global_cache_engine.store_result(contents, result)

    return result

@router.get("/cache/stats")
async def get_cache_stats():
    """
    Returns LLM token savings and Cache-First statistics
    """
    return global_cache_engine.get_stats()
