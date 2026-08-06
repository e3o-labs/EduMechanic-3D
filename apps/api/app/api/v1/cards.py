from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

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

@router.get("/cards", response_model=List[ExplorationCardSchema])
async def list_exploration_cards():
    return list(cards_db.values())
