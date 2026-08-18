"""
Test Suite for SQLite/PostgreSQL Database Persistence & User Auth for EduMechanic 3D
"""
import sys
import os
import json

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../apps/api")))

from app.db.database import SessionLocal, init_db, engine, Base
from app.db.models import User, ExplorationCard, StudentPin, TeamReport
from app.api.v1.auth import LoginRequest, login_or_register, get_current_user
from app.api.v1.portfolio import (
    SaveCardRequest,
    PinInput,
    save_exploration_card,
    list_exploration_cards,
    get_exploration_card,
    add_card_pin,
)

def setup_test_db():
    print("\n--- Initializing Database Tables ---")
    init_db()
    db = SessionLocal()
    return db

def test_user_auth(db):
    print("\n--- Test 1: User Login & Session ---")
    # 1. Login student
    req = LoginRequest(name="김민준", role="student", team_name="1모둠 (알파팀)", email="minjun@school.edu")
    user_res = login_or_register(req, db)
    assert user_res.name == "김민준"
    assert user_res.role == "student"
    assert user_res.team_name == "1모둠 (알파팀)"

    # 2. Login teacher
    teacher_req = LoginRequest(name="박선생님", role="teacher", team_name="교사실", email="teacher@school.edu")
    teacher_res = login_or_register(teacher_req, db)
    assert teacher_res.role == "teacher"

    # 3. Get current user
    me = get_current_user(db)
    assert me.id is not None
    print(f"✅ User Auth Test Passed! Student: {user_res.id}, Teacher: {teacher_res.id}")
    return user_res.id

def test_exploration_card_persistence(db, user_id):
    print("\n--- Test 2: Exploration Card CRUD & Persistence ---")
    spec_data = {
        "components": [
            {
                "part_id": "part_bevel_gear",
                "name": "중앙 경사 베벨 기어",
                "geometry_type": "bevel_gear",
                "parameters": {"outer_diameter": 32.0, "height": 16.0}
            }
        ],
        "quiz": {
            "question": "베벨 기어의 회전각은?",
            "options": ["45도", "90도", "180도"],
            "correct_index": 1,
            "explanation": "직각으로 동력을 꺾어줍니다."
        }
    }

    pins = [
        PinInput(
            part_id="part_bevel_gear",
            position=[0.0, 5.0, 0.0],
            content="기어 톱니가 왜 45도 기울어져 있나요?",
            author_name="김민준"
        )
    ]

    card_req = SaveCardRequest(
        title="나만의 수동 연필깎이 3D 탐구",
        category="K-12 STEM Mechanical",
        ai_summary="직각 베벨 기어의 45도 치합 원리를 탐구한 카드입니다.",
        spec_json=json.dumps(spec_data, ensure_ascii=False),
        thumb_url="/static/thumbs/sharpener.png",
        user_id=user_id,
        pins=pins
    )

    # Save card
    saved = save_exploration_card(card_req, db)
    assert saved.id is not None
    assert saved.title == "나만의 수동 연필깎이 3D 탐구"
    assert len(saved.pins) == 1
    print(f"✅ Card saved successfully! Card ID: {saved.id}")

    # List cards
    cards = list_exploration_cards(user_id=user_id, db=db)
    assert len(cards) >= 1
    print(f"✅ Card listing passed! Total user cards: {len(cards)}")

    # Get card details
    card_detail = get_exploration_card(saved.id, db)
    assert card_detail.title == saved.title
    assert len(card_detail.pins) == 1
    print(f"✅ Card retrieval verified! Pin content: '{card_detail.pins[0].content}'")

    # Add second pin
    new_pin_in = PinInput(
        part_id="part_bevel_gear",
        position=[2.0, 3.0, 1.0],
        content="회전 속도는 기어비에 비례하나요?",
        author_name="이서아"
    )
    added_pin = add_card_pin(saved.id, new_pin_in, db)
    assert added_pin.id is not None
    print(f"✅ New pin added to card! Pin ID: {added_pin.id}")

    # Re-verify pins count
    updated_card = get_exploration_card(saved.id, db)
    assert len(updated_card.pins) == 2
    print("✅ Total pins on card now: 2 (Verified DB cascade & relations)")


def main():
    print("🚀 Starting EduMechanic 3D Database Persistence & Auth Test Suite...")
    db = setup_test_db()
    try:
        user_id = test_user_auth(db)
        test_exploration_card_persistence(db, user_id)
        print("\n🎉 All Database Persistence & User Auth Tests Passed Successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
