from __future__ import annotations

from app.core.time_utils import now_shanghai

from sqlalchemy import Column, DateTime, Integer, String, Boolean

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(120), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    api_key = Column(String(128), unique=True, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=now_shanghai, nullable=False)
