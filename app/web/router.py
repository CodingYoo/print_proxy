from __future__ import annotations

import os
import sys

from fastapi import APIRouter
from fastapi.responses import FileResponse, RedirectResponse


router = APIRouter()


def get_spa_dist_dir() -> str:
    """获取 SPA 静态文件目录"""
    if getattr(sys, 'frozen', False):
        # 打包后的 exe
        return os.path.join(sys._MEIPASS, 'app', 'static', 'dist')
    else:
        # 开发模式
        return os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'dist')


def serve_spa_index():
    """返回 SPA 的 index.html"""
    dist_dir = get_spa_dist_dir()
    index_path = os.path.join(dist_dir, 'index.html')
    if os.path.exists(index_path):
        return FileResponse(index_path, media_type='text/html')
    # 如果没有构建前端，返回提示
    return FileResponse(
        os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates', 'fallback.html'),
        media_type='text/html'
    )


@router.get("/", include_in_schema=False)
def root():
    return serve_spa_index()


@router.get("/login", include_in_schema=False)
def login_page():
    return serve_spa_index()


@router.get("/dashboard", include_in_schema=False)
def dashboard():
    return serve_spa_index()


@router.get("/dashboard/{path:path}", include_in_schema=False)
def dashboard_subpages(path: str):
    return serve_spa_index()


@router.get("/admin", include_in_schema=False)
def legacy_admin_redirect() -> RedirectResponse:
    return RedirectResponse(url="/dashboard")
