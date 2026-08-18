"""
3D Exploration Portfolio & Badge Card DB Persistence Endpoints
Allows students to save, list, load, and manage custom 3D mechanisms and pins.
"""
import uuid
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import ExplorationCard, StudentPin, User

router = APIRouter()

class PinInput(BaseModel):
    id: Optional[str] = None
    part_id: str
    position: List[float] = Field(default_factory=lambda: [0.0, 0.0, 0.0])
    content: str
    author_name: str = "김민준"

class SaveCardRequest(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    title: str
    category: str = "K-12 STEM Mechanical"
    ai_summary: str = ""
    global_tolerance: float = 0.20
    spec_json: str # Serialized preset / VLM schema
    thumb_url: Optional[str] = None
    forked_from_id: Optional[str] = None
    pins: Optional[List[PinInput]] = []

class PinOutput(BaseModel):
    id: str
    part_id: str
    position: List[float]
    content: str
    author_name: str
    created_at: str

class CardOutput(BaseModel):
    id: str
    user_id: Optional[str]
    title: str
    category: str
    ai_summary: Optional[str]
    global_tolerance: float
    spec_json: str
    thumb_url: Optional[str]
    forked_from_id: Optional[str]
    remix_count: int
    created_at: str
    pins: List[PinOutput] = []

@router.post("/portfolio/cards", response_model=CardOutput)
def save_exploration_card(req: SaveCardRequest, db: Session = Depends(get_db)):
    """
    Saves a 3D Exploration card and any associated question pins into database.
    If card id exists, updates the existing card; otherwise creates a new record.
    """
    card_id = req.id or f"card_{uuid.uuid4().hex[:8]}"

    card = db.query(ExplorationCard).filter(ExplorationCard.id == card_id).first()
    if not card:
        card = ExplorationCard(
            id=card_id,
            user_id=req.user_id,
            title=req.title,
            category=req.category,
            ai_summary=req.ai_summary,
            global_tolerance=req.global_tolerance,
            spec_json=req.spec_json,
            thumb_url=req.thumb_url,
            forked_from_id=req.forked_from_id,
            remix_count=0
        )
        db.add(card)
    else:
        card.title = req.title
        card.ai_summary = req.ai_summary
        card.spec_json = req.spec_json
        if req.thumb_url:
            card.thumb_url = req.thumb_url

    db.commit()
    db.refresh(card)

    # Save associated pins if provided
    if req.pins:
        for pin_in in req.pins:
            pin_id = pin_in.id or f"pin_{uuid.uuid4().hex[:8]}"
            existing_pin = db.query(StudentPin).filter(StudentPin.id == pin_id).first()
            if not existing_pin:
                pos = pin_in.position or [0.0, 0.0, 0.0]
                new_pin = StudentPin(
                    id=pin_id,
                    card_id=card.id,
                    user_id=req.user_id,
                    part_id=pin_in.part_id,
                    pos_x=pos[0] if len(pos) > 0 else 0.0,
                    pos_y=pos[1] if len(pos) > 1 else 0.0,
                    pos_z=pos[2] if len(pos) > 2 else 0.0,
                    content=pin_in.content,
                    author_name=pin_in.author_name
                )
                db.add(new_pin)
        db.commit()

    # Load pins for output
    pins_db = db.query(StudentPin).filter(StudentPin.card_id == card.id).all()
    pins_out = [
        PinOutput(
            id=p.id,
            part_id=p.part_id,
            position=[p.pos_x, p.pos_y, p.pos_z],
            content=p.content,
            author_name=p.author_name,
            created_at=p.created_at.strftime("%Y-%m-%d %H:%M")
        )
        for p in pins_db
    ]

    return CardOutput(
        id=card.id,
        user_id=card.user_id,
        title=card.title,
        category=card.category,
        ai_summary=card.ai_summary,
        global_tolerance=card.global_tolerance,
        spec_json=card.spec_json,
        thumb_url=card.thumb_url,
        forked_from_id=card.forked_from_id,
        remix_count=card.remix_count,
        created_at=card.created_at.strftime("%Y-%m-%d %H:%M"),
        pins=pins_out
    )

@router.get("/portfolio/cards", response_model=List[CardOutput])
def list_exploration_cards(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns list of saved 3D exploration cards sorted by newest first.
    """
    query = db.query(ExplorationCard)
    if user_id:
        query = query.filter(ExplorationCard.user_id == user_id)
    cards = query.order_by(ExplorationCard.created_at.desc()).all()

    result = []
    for c in cards:
        pins = db.query(StudentPin).filter(StudentPin.card_id == c.id).all()
        result.append(CardOutput(
            id=c.id,
            user_id=c.user_id,
            title=c.title,
            category=c.category,
            ai_summary=c.ai_summary,
            global_tolerance=c.global_tolerance,
            spec_json=c.spec_json,
            thumb_url=c.thumb_url,
            forked_from_id=c.forked_from_id,
            remix_count=c.remix_count,
            created_at=c.created_at.strftime("%Y-%m-%d %H:%M"),
            pins=[
                PinOutput(
                    id=p.id,
                    part_id=p.part_id,
                    position=[p.pos_x, p.pos_y, p.pos_z],
                    content=p.content,
                    author_name=p.author_name,
                    created_at=p.created_at.strftime("%Y-%m-%d %H:%M")
                )
                for p in pins
            ]
        ))
    return result

@router.get("/portfolio/cards/{card_id}", response_model=CardOutput)
def get_exploration_card(card_id: str, db: Session = Depends(get_db)):
    """
    Fetches a specific exploration card with its 3D components and question pins.
    """
    card = db.query(ExplorationCard).filter(ExplorationCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="탐구 카드를 찾을 수 없습니다.")

    pins = db.query(StudentPin).filter(StudentPin.card_id == card.id).all()
    return CardOutput(
        id=card.id,
        user_id=card.user_id,
        title=card.title,
        category=card.category,
        ai_summary=card.ai_summary,
        global_tolerance=card.global_tolerance,
        spec_json=card.spec_json,
        thumb_url=card.thumb_url,
        forked_from_id=card.forked_from_id,
        remix_count=card.remix_count,
        created_at=card.created_at.strftime("%Y-%m-%d %H:%M"),
        pins=[
            PinOutput(
                id=p.id,
                part_id=p.part_id,
                position=[p.pos_x, p.pos_y, p.pos_z],
                content=p.content,
                author_name=p.author_name,
                created_at=p.created_at.strftime("%Y-%m-%d %H:%M")
            )
            for p in pins
        ]
    )

@router.post("/portfolio/cards/{card_id}/pins", response_model=PinOutput)
def add_card_pin(card_id: str, pin_in: PinInput, db: Session = Depends(get_db)):
    """
    Adds a new 3D question pin to a card and saves into database.
    """
    card = db.query(ExplorationCard).filter(ExplorationCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="탐구 카드를 찾을 수 없습니다.")

    pin_id = pin_in.id or f"pin_{uuid.uuid4().hex[:8]}"
    pos = pin_in.position or [0.0, 0.0, 0.0]

    pin = StudentPin(
        id=pin_id,
        card_id=card.id,
        part_id=pin_in.part_id,
        pos_x=pos[0] if len(pos) > 0 else 0.0,
        pos_y=pos[1] if len(pos) > 1 else 0.0,
        pos_z=pos[2] if len(pos) > 2 else 0.0,
        content=pin_in.content,
        author_name=pin_in.author_name
    )
    db.add(pin)
    db.commit()
    db.refresh(pin)

    return PinOutput(
        id=pin.id,
        part_id=pin.part_id,
        position=[pin.pos_x, pin.pos_y, pin.pos_z],
        content=pin.content,
        author_name=pin.author_name,
        created_at=pin.created_at.strftime("%Y-%m-%d %H:%M")
    )
