from fastapi import APIRouter

from app.core.config import settings
from app.core.time_utils import now_shanghai

from .routes import auth, jobs, printers, logs

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(printers.router, prefix="/printers", tags=["printers"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"])


@api_router.get("/", tags=["system"], summary="服务状态")
def service_status() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "status": "ok",
        "timestamp": now_shanghai().isoformat(),
        "documentation": "/docs",
    }
