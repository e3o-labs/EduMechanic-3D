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

from app.services.cad.validator import manufacturability_validator
from app.services.cad.components.gears.spur_gear import InvoluteSpurGear, create_mating_gear_pair
from app.services.cad.components.housings.gearbox_frame import GearboxFrame
from app.services.cad.components.crank.hand_crank import HandCrank
from app.schemas.spec import PrinterProfile

class DFAMCheckRequest(BaseModel):
    card_id: str
    tolerance_preset: str = "standard_prusa"
    cots_mount: str = "608zz"
    teeth_count: int = 20

class SlicerExportRequest(BaseModel):
    card_id: str
    micro_print: bool = False
    tolerance_preset: str = "standard_prusa"
    cots_type: str = "608zz"
    teeth_count: int = 20

@router.post("/cards/{card_id}/dfam-check")
async def check_dfam_printability(card_id: str, req: Optional[DFAMCheckRequest] = None):
    """
    DFAM & Manufacturability Validation Endpoint:
    Runs full G1~G4 validation gates on true mechanical components and returns Print Readiness tier.
    """
    teeth = req.teeth_count if req and req.teeth_count else 20
    preset = req.tolerance_preset if req else "standard_prusa"

    # Profile selection
    profile = PrinterProfile()
    if preset == "precise_bambu":
        profile.fit_profiles.rotating_fit = 0.30
        profile.fit_profiles.backlash = 0.20
    elif preset == "school_ender":
        profile.fit_profiles.rotating_fit = 0.42
        profile.fit_profiles.backlash = 0.30

    manufacturability_validator.profile = profile

    # Generate physical gear pair & frame for the card
    g1, g2, center_dist = create_mating_gear_pair(
        module=1.5,
        teeth_1=16,
        teeth_2=teeth if teeth >= 16 else 32,
        shaft_dia=5.0
    )
    frame = GearboxFrame(center_distance=center_dist, shaft_diameter=5.0)
    crank = HandCrank(shaft_dia=5.0)

    parts_map = {
        "driver_gear": g1.to_trimesh(),
        "driven_gear": g2.to_trimesh(),
        "gearbox_frame": frame.to_trimesh(),
        "hand_crank": crank.to_trimesh()
    }

    report = manufacturability_validator.evaluate_print_readiness(
        parts=parts_map,
        assembly_relations=[
            {"type": "gear_mesh", "actual_center_dist": center_dist, "target_center_dist": center_dist},
            {"type": "shaft_bore_fit", "shaft_id": "shaft", "bore_id": "driver_gear", "shaft_dia": 5.0, "bore_dia": g1.actual_bore_dia, "fit_type": "rotating_fit"}
        ]
    )

    return {
        "card_id": card_id,
        "print_readiness_tier": report.tier.value,
        "overall_passed": report.overall_passed,
        "score": report.score,
        "summary": report.summary,
        "gates": {
            "G1_geometry": report.g1_geometry.model_dump() if hasattr(report.g1_geometry, "model_dump") else report.g1_geometry.dict(),
            "G2_printer": report.g2_printer.model_dump() if hasattr(report.g2_printer, "model_dump") else report.g2_printer.dict(),
            "G3_assembly": report.g3_assembly.model_dump() if hasattr(report.g3_assembly, "model_dump") else report.g3_assembly.dict(),
            "G4_slicing": report.g4_slicing.model_dump() if hasattr(report.g4_slicing, "model_dump") else report.g4_slicing.dict()
        },
        "applied_tolerance": profile.fit_profiles.rotating_fit,
        "recommendations": report.recommendations
    }

@router.post("/cards/{card_id}/export-3mf")
async def export_slicer_3mf(card_id: str, req: Optional[SlicerExportRequest] = None):
    """
    Exports 3D Printable Manufacturing Package (STLs, standard 3MF, BOM, Assembly Guide).
    """
    micro = req.micro_print if req else False
    preset = req.tolerance_preset if req else "standard_prusa"
    teeth = req.teeth_count if req else 32

    slicer_bytes = slicer_exporter.generate_3mf_package(
        card_id=card_id,
        micro_print=micro,
        tolerance_preset=preset,
        teeth_count=teeth
    )
    return Response(
        content=slicer_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=EduMechanic_Manufacturing_{card_id}.zip"}
    )


@router.get("/cards", response_model=List[ExplorationCardSchema])
async def list_exploration_cards():
    return list(cards_db.values())

