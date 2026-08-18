"""
SQLAlchemy ORM Models for EduMechanic 3D
Defines Users, 3D Exploration Cards, Question Pins, and Team Analytics Reports.
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    role = Column(String(32), default="student") # student, teacher
    team_name = Column(String(100), default="1모둠 (알파팀)")
    created_at = Column(DateTime, default=datetime.utcnow)

    cards = relationship("ExplorationCard", back_populates="user", cascade="all, delete-orphan")
    pins = relationship("StudentPin", back_populates="user", cascade="all, delete-orphan")


class ExplorationCard(Base):
    __tablename__ = "exploration_cards"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="K-12 STEM Mechanical")
    ai_summary = Column(Text, nullable=True)
    global_tolerance = Column(Float, default=0.20)
    spec_json = Column(Text, nullable=False) # JSON encoded VLMParsingResult / MechanicalPreset
    thumb_url = Column(Text, nullable=True)
    forked_from_id = Column(String(64), nullable=True)
    remix_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="cards")
    pins = relationship("StudentPin", back_populates="card", cascade="all, delete-orphan")


class StudentPin(Base):
    __tablename__ = "student_pins"

    id = Column(String(64), primary_key=True, index=True)
    card_id = Column(String(64), ForeignKey("exploration_cards.id"), nullable=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    part_id = Column(String(64), nullable=False)
    pos_x = Column(Float, default=0.0)
    pos_y = Column(Float, default=0.0)
    pos_z = Column(Float, default=0.0)
    content = Column(Text, nullable=False)
    author_name = Column(String(100), default="김민준")
    created_at = Column(DateTime, default=datetime.utcnow)

    card = relationship("ExplorationCard", back_populates="pins")
    user = relationship("User", back_populates="pins")


class TeamReport(Base):
    __tablename__ = "team_reports"

    id = Column(String(64), primary_key=True, index=True)
    team_name = Column(String(100), nullable=False)
    topic = Column(String(255), nullable=False)
    members_count = Column(Integer, default=4)
    exploration_rate = Column(Integer, default=90)
    pins_count = Column(Integer, default=10)
    quiz_accuracy = Column(Integer, default=100)
    status = Column(String(50), default="진행 중")
    competency_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
