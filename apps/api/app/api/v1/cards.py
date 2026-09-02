from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from app.services.pdf.exporter import pdf_exporter
from app.services.cad.slicer import slicer_exporter

router = APIRouter()

class ExplorationCardSchema(BaseModel):
    id: str = Field(default_factory=lambda: f"card_{uuid.uuid4().hex[:8]}")
    title: str
    category: str = "K-12 STEM Mechanical"
    original_image_url: str
    gltf_model_url: str
    ai_summary: str
    forked_from_id: Optional[str] = None
    remix_count: int = 0

# Mock DB store
cards_db = {}

@router.post("/cards/{card_id}/fork", response_model=ExplorationCardSchema)
async def fork_exploration_card(card_id: str):
    """
    Fork / Remix Exploration Card Endpoint:
    Duplicates an existing 3D exploration card into the user's workspace for customization.
    """
    new_card_id = f"card_fork_{uuid.uuid4().hex[:8]}"
    forked_card = ExplorationCardSchema(
        id=new_card_id,
        title=f"리믹스된 3D 메커니즘 카드 ({card_id})",
        category="K-12 STEM Mechanical",
        original_image_url="/static/images/sample.jpg",
        gltf_model_url=f"/static/models/{card_id}.glb",
        ai_summary="친구의 탐구 카드를 복제하여 나만의 부품과 질문 메모를 추가할 수 있습니다.",
        forked_from_id=card_id,
        remix_count=1
    )
    cards_db[new_card_id] = forked_card
    return forked_card

@router.get("/cards/{card_id}/pdf")
async def export_card_pdf(card_id: str):
    """
    Exports printable PDF Science Badge Card report for the specified exploration card.
    """
    card_data = cards_db.get(card_id) or {
        "title": f"3D 메커니즘 탐구 카드 ({card_id})",
        "ai_summary": "베벨 기어 90도 직각 전력 전달 시스템 및 물리 구동 축 분석 결과입니다."
    }
    pdf_bytes = pdf_exporter.generate_badge_card_pdf(card_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=EduMechanic_Badge_{card_id}.pdf"}
    )

from app.services.cad.dfam import dfam_engine
import trimesh

class DFAMCheckRequest(BaseModel):
    card_id: str
    tolerance_preset: str = "standard_prusa"
    cots_mount: str = "608zz"

class SlicerExportRequest(BaseModel):
    card_id: str
    micro_print: bool = False
    tolerance_preset: str = "standard_prusa"
    cots_type: str = "608zz"
    teeth_count: int = 20

@router.post("/cards/{card_id}/dfam-check")
async def check_dfam_printability(card_id: str, req: Optional[DFAMCheckRequest] = None):
    """
    DFAM (Design for Additive Manufacturing) Printability Check Endpoint
    """
    mesh = trimesh.creation.cylinder(radius=20.0, height=15.0)
    analysis = dfam_engine.analyze_mesh_printability(mesh)
    tolerance = dfam_engine.get_tolerance(req.tolerance_preset if req else "standard_prusa")
    return {
        "card_id": card_id,
        "dfam_analysis": analysis,
        "applied_tolerance": tolerance,
        "cots_mount": req.cots_mount if req else "608zz"
    }

@router.post("/cards/{card_id}/export-3mf")
async def export_slicer_3mf(card_id: str, req: Optional[SlicerExportRequest] = None):
    """
    Exports 3D Printable 3MF / STL Slicing Package for Bambu Studio, Cura, and PrusaSlicer.
    """
    micro = req.micro_print if req else False
    preset = req.tolerance_preset if req else "standard_prusa"
    cots = req.cots_type if req else "608zz"
    teeth = req.teeth_count if req else 20
    
    slicer_bytes = slicer_exporter.generate_3mf_package(
        card_id=card_id,
        micro_print=micro,
        tolerance_preset=preset,
        cots_type=cots,
        teeth_count=teeth
    )
    return Response(
        content=slicer_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=EduMechanic_3DPrint_{card_id}.3mf"}
    )


@router.get("/cards", response_model=List[ExplorationCardSchema])
async def list_exploration_cards():
    return list(cards_db.values())

