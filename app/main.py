from __future__ import annotations

import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from fastapi import Request
from fastapi.responses import JSONResponse
from app.api import api_router
from app.core.config import settings
from app.core.database import Base, engine, session_scope
from app.services import job_service, user_service
from app.services.log_service import create_system_log
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
        dist_dir = os.path.join(sys._MEIPASS, 'app', 'static', 'dist')
    else:
        # 开发模式
        static_dir = os.path.join(os.path.dirname(__file__), 'static')
        dist_dir = os.path.join(os.path.dirname(__file__), 'static', 'dist')
    
    if os.path.exists(static_dir):
        app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    # Mount SPA assets (Vite build output)
    if os.path.exists(dist_dir):
        assets_dir = os.path.join(dist_dir, 'assets')
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    app.include_router(api_router, prefix=settings.api_prefix)
    app.include_router(web_router)

    @app.on_event("startup")
    def on_startup() -> None:
        os.makedirs(settings.log_directory, exist_ok=True)
        with session_scope() as db:
            create_system_log(db, "info", "系统已启动", "system")
            user_service.ensure_default_admin(db)
            try:
                from app.services import printer_service
                printer_service.sync_printers(db)
            except Exception as e:
                create_system_log(db, "error", f"打印机同步失败: {e}", "printer")
        job_queue.configure(job_service.process_print_job)

    @app.on_event("shutdown")
    def on_shutdown() -> None:
        try:
             with session_scope() as db:
                create_system_log(db, "info", "系统正在关闭", "system")
        except Exception:
            pass

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        try:
            with session_scope() as db:
                # 记录请求路径和方法
                msg = f"未捕获的异常: {exc} (Path: {request.method} {request.url.path})"
                create_system_log(db, "error", msg, "system")
        except Exception:
            pass # 避免死循环
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error"},
        )

    return app


app = create_application()
