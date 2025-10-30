from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import JobLog


def create_job_log(db: Session, job_id: int, level: str, message: str) -> JobLog:
    log = JobLog(job_id=job_id, level=level, message=message)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def list_job_logs(db: Session, job_id: int | None = None):
    query = db.query(JobLog)
    if job_id is not None:
        query = query.filter(JobLog.job_id == job_id)
    return query.order_by(JobLog.created_at.desc()).all()
