from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import JobLog


def create_job_log(db: Session, job_id: int | None, level: str, message: str, category: str = "general") -> JobLog:
    log = JobLog(job_id=job_id, level=level, message=message, category=category)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def create_system_log(db: Session, level: str, message: str, category: str = "system") -> JobLog:
    return create_job_log(db, None, level, message, category)


def list_job_logs(db: Session, job_id: int | None = None, limit: int = 100):
    query = db.query(JobLog)
    if job_id is not None:
        query = query.filter(JobLog.job_id == job_id)
    return query.order_by(JobLog.created_at.desc()).limit(limit).all()


def clear_all_logs(db: Session) -> int:
    count = db.query(JobLog).delete()
    db.commit()
    return count
