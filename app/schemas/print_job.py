from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator


ALLOWED_FILE_TYPES = {
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "bmp",
    "svg",
    "txt",
    "doc",
    "docx",
    "xls",
    "xlsx",
}


class PrintJobBase(BaseModel):
    title: str = Field(..., max_length=200)
    copies: int = Field(default=1, ge=1)
    priority: int = Field(default=5, ge=1, le=10)
    media_size: Optional[str] = Field(default=None, max_length=50)
    color_mode: Optional[str] = Field(default=None, max_length=30)
    duplex: Optional[str] = Field(default=None, max_length=30)
    printer_name: Optional[str] = Field(default=None, max_length=200)
    dpi: Optional[int] = Field(default=203, ge=72, le=1200)  # 默认 203 DPI
    fit_mode: Optional[str] = Field(default="fill", max_length=20)  # fill=填满, contain=完整显示
    auto_rotate: Optional[bool] = Field(default=True)  # 自动旋转以最佳适配纸张
    enhance_quality: Optional[bool] = Field(default=True)  # 增强打印质量（锐化、对比度优化）


class PrintJobCreate(PrintJobBase):
    file_type: str = Field(..., max_length=20)
    content_base64: str

    @field_validator("file_type")
    @classmethod
    def validate_file_type(cls, value: str) -> str:
        normalized = value.lower()
        if normalized not in ALLOWED_FILE_TYPES:
            raise ValueError("文件类型不受支持")
        return normalized


class PrintJobUpdate(BaseModel):
    priority: Optional[int] = Field(default=None, ge=1, le=10)
    copies: Optional[int] = Field(default=None, ge=1)
    status: Optional[str] = None


class PrintJobRead(PrintJobBase):
    id: int
    status: str
    file_type: str
    created_at: datetime
    updated_at: datetime
    error_message: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class PrintJobStatus(BaseModel):
    status: str
    error_message: Optional[str]
