from __future__ import annotations

import os
import yaml
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


def _get_user_data_dir() -> Path:
    """Get user data directory, writable for normal users"""
    # Use APPDATA for user-writable directory
    appdata = os.environ.get('APPDATA')
    if appdata:
        data_dir = Path(appdata) / 'PrintProxy'
    else:
        # Fallback to user home directory
        data_dir = Path.home() / '.printproxy'
    
    # Ensure directory exists
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


class Settings(BaseSettings):
    # Application settings
    app_name: str = Field(default="Print Proxy Service")
    api_prefix: str = Field(default="/api")
    
    # Server settings
    server_host: str = Field(default="0.0.0.0", description="Server host address")
    server_port: int = Field(default=8568, description="Server port")
    server_reload: bool = Field(default=False, description="Enable auto-reload for development")
    server_workers: int = Field(default=1, description="Number of worker processes")
    
    # Frontend settings
    frontend_dist_path: str = Field(default="frontend/frontend-app/dist", description="Path to built frontend static files")
    
    # Database settings
    database_url: str = Field(default="")
    database_echo: bool = Field(default=False)
    
    # Security settings
    access_token_expire_minutes: int = Field(default=60 * 24 * 7)
    jwt_algorithm: str = Field(default="HS256")
    jwt_secret_key: str = Field(default="change_me")
    
    # File and preview settings
    allowed_preview_formats: List[str] = Field(default_factory=lambda: ["pdf", "png", "jpg", "jpeg"])
    max_file_size_mb: int = Field(default=50, description="Maximum file size in MB")
    
    # Logging settings
    log_directory: str = Field(default="")
    log_level: str = Field(default="INFO", description="Logging level: DEBUG, INFO, WARNING, ERROR")

    class Config:
        env_file = ".env"
        case_sensitive = False


def _load_yaml_config() -> Dict[str, Any]:
    """Load configuration from YAML file if it exists"""
    config_file = Path("config.yaml")
    if not config_file.exists():
        return {}
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f) or {}
        
        # Flatten nested config for pydantic
        flat_config = {}
        if 'app' in config:
            flat_config['app_name'] = config['app'].get('name')
            flat_config['api_prefix'] = config['app'].get('api_prefix')
        
        if 'server' in config:
            flat_config['server_host'] = config['server'].get('host')
            flat_config['server_port'] = config['server'].get('port')
            flat_config['server_reload'] = config['server'].get('reload')
            flat_config['server_workers'] = config['server'].get('workers')
        
        if 'database' in config:
            flat_config['database_url'] = config['database'].get('url')
            flat_config['database_echo'] = config['database'].get('echo')
        
        if 'security' in config:
            flat_config['access_token_expire_minutes'] = config['security'].get('access_token_expire_minutes')
            flat_config['jwt_algorithm'] = config['security'].get('jwt_algorithm')
            flat_config['jwt_secret_key'] = config['security'].get('jwt_secret_key')
        
        if 'files' in config:
            flat_config['allowed_preview_formats'] = config['files'].get('allowed_preview_formats')
            flat_config['max_file_size_mb'] = config['files'].get('max_file_size_mb')
        
        if 'logging' in config:
            flat_config['log_directory'] = config['logging'].get('directory')
            flat_config['log_level'] = config['logging'].get('level')
        
        # Remove None values
        return {k: v for k, v in flat_config.items() if v is not None}
    except Exception as e:
        print(f"Warning: Failed to load config.yaml: {e}")
        return {}


def _get_legacy_env_mapping() -> Dict[str, str]:
    """Map legacy environment variables to new ones for backward compatibility"""
    legacy_map = {}
    
    # Map PRINT_PROXY_* to SERVER_*
    if 'PRINT_PROXY_HOST' in os.environ and 'SERVER_HOST' not in os.environ:
        legacy_map['server_host'] = os.environ['PRINT_PROXY_HOST']
    
    if 'PRINT_PROXY_PORT' in os.environ and 'SERVER_PORT' not in os.environ:
        legacy_map['server_port'] = os.environ['PRINT_PROXY_PORT']
    
    if 'PRINT_PROXY_RELOAD' in os.environ and 'SERVER_RELOAD' not in os.environ:
        legacy_map['server_reload'] = os.environ['PRINT_PROXY_RELOAD'] == '1'
    
    return legacy_map


@lru_cache
def load_settings() -> Settings:
    """Load settings with proper paths for user data directory
    
    Configuration priority (highest to lowest):
    1. Environment variables
    2. .env file
    3. config.yaml file
    4. Default values
    """
    # Get user data directory (writable location)
    user_data_dir = _get_user_data_dir()
    
    # Set database path in user directory
    db_path = user_data_dir / "print_proxy.db"
    
    # Set log directory in user directory
    log_dir = user_data_dir / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # Load YAML config
    yaml_config = _load_yaml_config()
    
    # Get legacy environment variable mappings
    legacy_env = _get_legacy_env_mapping()
    
    # Merge configurations (YAML < legacy env < explicit settings)
    config_overrides = {
        'database_url': os.environ.get('DATABASE_URL', yaml_config.get('database_url', f'sqlite:///{db_path}')),
        'log_directory': os.environ.get('LOG_DIRECTORY', yaml_config.get('log_directory', str(log_dir)))
    }
    
    # Apply YAML config
    config_overrides.update(yaml_config)
    
    # Apply legacy environment variables
    config_overrides.update(legacy_env)
    
    # Create settings with merged configuration
    settings = Settings(**config_overrides)
    
    return settings


settings = load_settings()
