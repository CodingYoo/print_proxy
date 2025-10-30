from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class PrinterBase(BaseModel):
    name: str = Field(..., max_length=200)
    is_default: bool = False
    status: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=200)


class PrinterCreate(PrinterBase):
    pass


class PrinterUpdate(BaseModel):
    is_default: Optional[bool] = None
    status: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=200)


class PrinterRead(PrinterBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
