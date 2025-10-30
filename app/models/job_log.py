from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.core.database import Base
from app.core.time_utils import now_shanghai


class JobLog(Base):
    __tablename__ = "job_logs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("print_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    level = Column(String(20), default="info")
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_shanghai, nullable=False)
