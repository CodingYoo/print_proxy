from __future__ import annotations

import base64
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models import PrintJob, User
from app.schemas import PrintJobCreate, PrintJobRead, PrintJobStatus, PrintJobUpdate
from app.services import job_service


router = APIRouter()


@router.post("/", response_model=PrintJobRead, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: PrintJobCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user_or_api_client),
) -> PrintJobRead:
    job = job_service.create_print_job(db, job_in, owner_id=current_user.id if current_user else None)
    return PrintJobRead.from_orm(job)


@router.get("/", response_model=List[PrintJobRead])
def list_jobs(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> List[PrintJobRead]:
    jobs = job_service.list_print_jobs(db, skip=skip, limit=limit)
    return [PrintJobRead.from_orm(job) for job in jobs]


@router.get("/{job_id}", response_model=PrintJobRead)
def get_job(
    job_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> PrintJobRead:
    job = job_service.get_print_job(db, job_id)
    return PrintJobRead.from_orm(job)


@router.patch("/{job_id}", response_model=PrintJobRead)
def update_job(
    job_id: int,
    update_in: PrintJobUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> PrintJobRead:
    job = job_service.get_print_job(db, job_id)
    if current_user.id != job.owner_id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="没有权限修改此任务")
    job = job_service.update_print_job(db, job, update_in)
    return PrintJobRead.from_orm(job)


@router.post("/{job_id}/cancel", response_model=PrintJobRead)
def cancel_job(
    job_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> PrintJobRead:
    job = job_service.get_print_job(db, job_id)
    if current_user.id != job.owner_id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="没有权限取消此任务")
    job = job_service.cancel_print_job(db, job)
    return PrintJobRead.from_orm(job)


@router.get("/{job_id}/status", response_model=PrintJobStatus)
def get_job_status(
    job_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> PrintJobStatus:
    job = job_service.get_print_job(db, job_id)
    return PrintJobStatus(status=job.status, error_message=job.error_message)


@router.get("/{job_id}/preview")
def get_job_preview(
    job_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Response:
    job = job_service.get_print_job(db, job_id)
    if current_user.id != job.owner_id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="没有权限预览此任务")
    preview_bytes = job_service.generate_preview(job)
    encoded = base64.b64encode(preview_bytes).decode("ascii")
    return Response(content=encoded, media_type="text/plain")
