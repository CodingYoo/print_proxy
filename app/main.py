from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings
from app.core.database import Base, engine, session_scope
from app.services import job_service, user_service
from app.tasks.manager import job_queue
from app.web import web_router


def create_application() -> FastAPI:
    Base.metadata.create_all(bind=engine)

    app = FastAPI(title=settings.app_name)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=True,
    )

    app.include_router(api_router, prefix=settings.api_prefix)
    app.include_router(web_router)

    @app.on_event("startup")
    def on_startup() -> None:
        os.makedirs(settings.log_directory, exist_ok=True)
        with session_scope() as db:
            user_service.ensure_default_admin(db)
            try:
                from app.services import printer_service

                printer_service.sync_printers(db)
            except Exception:
                pass
        job_queue.configure(job_service.process_print_job)

    return app


app = create_application()
