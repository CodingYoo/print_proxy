from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Integer, LargeBinary, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.time_utils import now_shanghai


class PrintJob(Base):
    __tablename__ = "print_jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    status = Column(String(50), default="queued", index=True)
    priority = Column(Integer, default=5, index=True)
    copies = Column(Integer, default=1)
    media_size = Column(String(50), nullable=True)
    color_mode = Column(String(30), nullable=True)
    duplex = Column(String(30), nullable=True)
    fit_mode = Column(String(20), default="fill", nullable=True)  # fill, contain, cover, stretch
    auto_rotate = Column(Integer, default=1, nullable=True)  # 1=True, 0=False (SQLite 兼容)
    enhance_quality = Column(Integer, default=1, nullable=True)  # 1=True, 0=False (质量增强)
    file_type = Column(String(20), nullable=False)
    content = Column(LargeBinary, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    printer_id = Column(Integer, ForeignKey("printers.id"), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_shanghai, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now_shanghai, onupdate=now_shanghai, nullable=False)

    owner = relationship("User", backref="jobs")
    printer = relationship("Printer", backref="jobs")

    @property
    def printer_name(self) -> str | None:
        return self.printer.name if self.printer else None
