import multiprocessing
import os
import shutil
import sys
import logging
from pathlib import Path
from datetime import datetime

import uvicorn


def _is_frozen() -> bool:
    return getattr(sys, "frozen", False)


def _project_root() -> Path:
    if _is_frozen():
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent.parent


def _resource_root() -> Path:
    if hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS).resolve()
    return Path(__file__).resolve().parent.parent.parent


def _ensure_runtime_assets(app_root: Path, resource_root: Path) -> None:
    """Ensure runtime assets are available, handle read-only installation directories"""
    templates_src = resource_root / "app" / "templates"
    templates_dst = app_root / "app" / "templates"
    
    # If destination already exists with content, skip copying (e.g., installed in Program Files)
    if templates_dst.exists() and any(templates_dst.iterdir()):
        return
    
    # Only copy if source exists and we have permission to write to destination
    if templates_src.exists():
        try:
            templates_dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(templates_src, templates_dst, dirs_exist_ok=True)
        except PermissionError:
            # Running from read-only location (e.g., Program Files)
            # Templates should have been installed by installer, skip copying
            pass


def _configure_environment() -> None:
    root = _project_root()
    resource_root = _resource_root()
    if str(resource_root) not in sys.path:
        sys.path.insert(0, str(resource_root))
    if not (root / "app").exists():
        (root / "app").mkdir(parents=True, exist_ok=True)
    _ensure_runtime_assets(root, resource_root)
    os.chdir(root)


def _get_log_directory() -> Path:
    """Get writable log directory in user AppData"""
    appdata = os.environ.get('APPDATA')
    if appdata:
        log_dir = Path(appdata) / 'PrintProxy' / 'logs'
    else:
        log_dir = Path.home() / '.printproxy' / 'logs'
    
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


def _setup_logging(root: Path) -> None:
    """Setup logging to file for silent mode"""
    # Use user data directory for logs (writable location)
    log_dir = _get_log_directory()
    
    log_file = log_dir / f"printproxy_{datetime.now().strftime('%Y%m%d')}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
        ]
    )
    
    # Log startup
    logging.info("=" * 50)
    logging.info("PrintProxy starting...")
    logging.info(f"Python: {sys.version}")
    logging.info(f"Working directory: {os.getcwd()}")
    logging.info(f"Executable: {sys.executable}")
    logging.info(f"Frozen: {_is_frozen()}")


def main() -> None:
    try:
        multiprocessing.freeze_support()
        
        # Fix for --noconsole mode: redirect stdout/stderr if they are None
        if sys.stdout is None:
            sys.stdout = open(os.devnull, 'w')
        if sys.stderr is None:
            sys.stderr = open(os.devnull, 'w')
        
        _configure_environment()
        
        # Setup logging after environment is configured
        root = _project_root()
        _setup_logging(root)
        
        # Import settings after environment is configured
        try:
            from app.core.config import settings
            host = settings.server_host
            port = settings.server_port
            reload_enabled = settings.server_reload
            workers = settings.server_workers
        except Exception as e:
            logging.warning(f"Failed to load settings, using defaults: {e}")
            # Fallback to environment variables
            host = os.getenv("SERVER_HOST") or os.getenv("PRINT_PROXY_HOST", "0.0.0.0")
            port = int(os.getenv("SERVER_PORT") or os.getenv("PRINT_PROXY_PORT", "8568"))
            reload_enabled = (os.getenv("SERVER_RELOAD", "false").lower() == "true" or 
                             os.getenv("PRINT_PROXY_RELOAD", "0") == "1")
            workers = 1
        
        logging.info(f"Starting server on {host}:{port}")
        logging.info(f"Reload: {reload_enabled}, Workers: {workers}")
        
        # Custom log config to avoid stdout issues
        # Use user data directory for uvicorn logs
        uvicorn_log_dir = _get_log_directory()
        
        log_config = {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "file": {
                    "class": "logging.FileHandler",
                    "filename": str(uvicorn_log_dir / f"uvicorn_{datetime.now().strftime('%Y%m%d')}.log"),
                    "formatter": "default",
                    "encoding": "utf-8",
                },
            },
            "root": {
                "level": "INFO",
                "handlers": ["file"],
            },
        }
        
        uvicorn.run(
            "app.main:app",
            host=host,
            port=port,
            reload=reload_enabled,
            workers=1,
            log_config=log_config
        )
    except Exception as e:
        # If logging isn't set up yet, try to write to a basic log file
        try:
            # Use user data directory for error logs
            appdata = os.environ.get('APPDATA')
            if appdata:
                error_log = Path(appdata) / 'PrintProxy' / 'logs' / 'error.log'
            else:
                error_log = Path.home() / '.printproxy' / 'logs' / 'error.log'
            
            error_log.parent.mkdir(parents=True, exist_ok=True)
            with open(error_log, "a", encoding="utf-8") as f:
                f.write(f"\n{datetime.now()}: FATAL ERROR\n")
                f.write(f"{str(e)}\n")
                import traceback
                traceback.print_exc(file=f)
        except:
            pass
        raise


if __name__ == "__main__":
    main()
