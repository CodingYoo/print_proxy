from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.core.database import Base
from app.core.time_utils import now_shanghai


class Printer(Base):
    __tablename__ = "printers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    is_default = Column(Boolean, default=False)
    status = Column(String(50), default="unknown")
    location = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_shanghai, nullable=False)
