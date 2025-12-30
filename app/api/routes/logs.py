from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.models import User
from app.schemas import JobLogRead
from app.services.log_service import list_job_logs, clear_all_logs


router = APIRouter()


@router.get("/", response_model=List[JobLogRead])
def get_logs(
    job_id: Optional[int] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> List[JobLogRead]:
    logs = list_job_logs(db, job_id=job_id)
    return [JobLogRead.from_orm(log) for log in logs]


@router.delete("/", status_code=204)
def delete_logs(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    if not current_user.is_admin:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="只有管理员可以清空日志")
    clear_all_logs(db)
    from fastapi import Response
    return Response(status_code=204)
