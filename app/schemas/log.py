from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class JobLogRead(BaseModel):
    id: int
    job_id: Optional[int]
    category: str = "general"
    level: str
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
