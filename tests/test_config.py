"""Test configuration system"""
import os
import pytest
from pathlib import Path


def test_default_settings():
    """Test default settings are loaded correctly"""
    from app.core.config import Settings
    
    settings = Settings()
    
    assert settings.app_name == "Print Proxy Service"
    assert settings.api_prefix == "/api"
    assert settings.server_host == "0.0.0.0"
    assert settings.server_port == 8568
    assert settings.server_reload is False
    assert settings.server_workers == 1
    assert settings.log_level == "INFO"


def test_env_override():
    """Test environment variables override defaults"""
    os.environ["SERVER_HOST"] = "127.0.0.1"
    os.environ["SERVER_PORT"] = "9000"
    os.environ["LOG_LEVEL"] = "DEBUG"
    
    from app.core.config import Settings
    
    settings = Settings()
    
    assert settings.server_host == "127.0.0.1"
    assert settings.server_port == 9000
    assert settings.log_level == "DEBUG"
    
    # Cleanup
    del os.environ["SERVER_HOST"]
    del os.environ["SERVER_PORT"]
    del os.environ["LOG_LEVEL"]


def test_legacy_env_variables():
    """Test legacy environment variables still work"""
    os.environ["PRINT_PROXY_HOST"] = "192.168.1.1"
    os.environ["PRINT_PROXY_PORT"] = "7000"
    
    # Clear cache to reload settings
    from app.core.config import load_settings
    load_settings.cache_clear()
    
    settings = load_settings()
    
    assert settings.server_host == "192.168.1.1"
    assert settings.server_port == 7000
    
    # Cleanup
    del os.environ["PRINT_PROXY_HOST"]
    del os.environ["PRINT_PROXY_PORT"]
    load_settings.cache_clear()


def test_new_env_takes_precedence():
    """Test new environment variables take precedence over legacy ones"""
    os.environ["PRINT_PROXY_HOST"] = "192.168.1.1"
    os.environ["SERVER_HOST"] = "127.0.0.1"
    
    from app.core.config import Settings
    
    settings = Settings()
    
    # New variable should take precedence
    assert settings.server_host == "127.0.0.1"
    
    # Cleanup
    del os.environ["PRINT_PROXY_HOST"]
    del os.environ["SERVER_HOST"]


def test_config_helper():
    """Test configuration helper functions"""
    from app.utils.config_helper import get_server_config, get_server_url, get_api_url
    
    server_config = get_server_config()
    assert "host" in server_config
    assert "port" in server_config
    assert "reload" in server_config
    assert "workers" in server_config
    
    server_url = get_server_url()
    assert server_url.startswith("http://")
    assert "localhost" in server_url or "0.0.0.0" in server_url
    
    api_url = get_api_url()
    assert api_url.endswith("/api")


def test_security_settings():
    """Test security settings"""
    from app.core.config import Settings
    
    settings = Settings()
    
    assert settings.jwt_algorithm == "HS256"
    assert settings.jwt_secret_key is not None
    assert settings.access_token_expire_minutes > 0


def test_file_settings():
    """Test file and preview settings"""
    from app.core.config import Settings
    
    settings = Settings()
    
    assert "pdf" in settings.allowed_preview_formats
    assert settings.max_file_size_mb > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
