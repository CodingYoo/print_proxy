from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class PrinterBase(BaseModel):
    name: str = Field(..., max_length=200)
    is_default: bool = False
    status: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=200)
    alias: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=500)


class PrinterCreate(PrinterBase):
    pass


class PrinterUpdate(BaseModel):
    is_default: Optional[bool] = None
    status: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=200)


    model_config = ConfigDict(from_attributes=True)


class MaintenanceLogBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    cost: float = 0.0


class MaintenanceLogCreate(MaintenanceLogBase):
    pass


class MaintenanceLogRead(MaintenanceLogBase):
    id: int
    printer_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PrinterRead(PrinterBase):
    id: int
    created_at: datetime
    alias: Optional[str] = None
    description: Optional[str] = None
    capabilities: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
