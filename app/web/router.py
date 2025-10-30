from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings


router = APIRouter()

# 获取前端静态文件目录的绝对路径
frontend_dist = Path(settings.frontend_dist_path).resolve()

# 检查前端构建文件是否存在
if frontend_dist.exists() and frontend_dist.is_dir():
    # 挂载静态资源目录（CSS、JS、图片等）
    assets_path = frontend_dist / "assets"
    if assets_path.exists():
        router.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")
    
    # 挂载其他静态文件（如 favicon）
    @router.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        favicon_path = frontend_dist / "favicon.ico"
        if favicon_path.exists():
            return FileResponse(favicon_path)
        return HTMLResponse(status_code=404)
    
    # 所有其他路由返回 index.html，让 Vue Router 处理
    @router.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """
        服务单页应用 (SPA)
        所有非 API 路由都返回 index.html，由 Vue Router 处理客户端路由
        """
        # 检查是否是静态文件请求
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        
        # 否则返回 index.html
        index_path = frontend_dist / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        
        return HTMLResponse(
            content="<h1>Frontend not built</h1><p>Please run: cd frontend/frontend-app && npm run build</p>",
            status_code=503
        )
else:
    # 前端未构建时的提示
    @router.get("/", include_in_schema=False)
    async def frontend_not_built():
        return HTMLResponse(
            content="""
            <html>
                <head><title>Frontend Not Built</title></head>
                <body>
                    <h1>前端未构建</h1>
                    <p>请先构建前端应用：</p>
                    <pre>cd frontend/frontend-app
npm install
npm run build</pre>
                    <p>或者设置环境变量 FRONTEND_DIST_PATH 指向已构建的前端目录</p>
                </body>
            </html>
            """,
            status_code=503
        )
