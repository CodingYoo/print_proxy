from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from app.core.config import settings


templates = Jinja2Templates(directory="app/templates")

router = APIRouter()


@router.get("/", include_in_schema=False)
def root_redirect() -> RedirectResponse:
    return RedirectResponse(url="/login")


@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "login.html",
        {
            "request": request,
            "api_prefix": settings.api_prefix,
            "app_name": settings.app_name,
        },
    )


@router.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "api_prefix": settings.api_prefix,
            "app_name": settings.app_name,
        },
    )


@router.get("/admin", include_in_schema=False)
def legacy_admin_redirect() -> RedirectResponse:
    return RedirectResponse(url="/dashboard")
