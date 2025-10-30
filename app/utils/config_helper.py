"""Configuration helper utilities"""
from __future__ import annotations

from typing import Dict, Any
from app.core.config import settings


def get_server_config() -> Dict[str, Any]:
    """Get server configuration"""
    return {
        "host": settings.server_host,
        "port": settings.server_port,
        "reload": settings.server_reload,
        "workers": settings.server_workers,
    }


def get_server_url(scheme: str = "http") -> str:
    """Get full server URL"""
    host = settings.server_host
    # Replace 0.0.0.0 with localhost for URL display
    if host == "0.0.0.0":
        host = "localhost"
    return f"{scheme}://{host}:{settings.server_port}"


def get_api_url(scheme: str = "http") -> str:
    """Get full API URL"""
    return f"{get_server_url(scheme)}{settings.api_prefix}"


def print_config_info() -> None:
    """Print current configuration information"""
    print("=" * 60)
    print("Print Proxy Service Configuration")
    print("=" * 60)
    print(f"Application Name: {settings.app_name}")
    print(f"Server URL: {get_server_url()}")
    print(f"API URL: {get_api_url()}")
    print(f"API Docs: {get_server_url()}/docs")
    print(f"Admin Panel: {get_server_url()}/admin")
    print(f"Log Directory: {settings.log_directory}")
    print(f"Log Level: {settings.log_level}")
    print(f"Database: {settings.database_url}")
    print("=" * 60)
