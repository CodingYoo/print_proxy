from __future__ import annotations

import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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

    # Mount static files
    # 支持打包后的exe和开发模式
    if getattr(sys, 'frozen', False):
        # 打包后的exe，static在_MEIPASS目录下
        static_dir = os.path.join(sys._MEIPASS, 'app', 'static')
    else:
        # 开发模式
        static_dir = os.path.join(os.path.dirname(__file__), 'static')
    
    if os.path.exists(static_dir):
        app.mount("/static", StaticFiles(directory=static_dir), name="static")

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
