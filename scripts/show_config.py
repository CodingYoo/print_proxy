"""Show current configuration"""
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.core.config import settings
from app.utils.config_helper import print_config_info


def main():
    """Display current configuration"""
    print_config_info()
    
    print("\nDetailed Configuration:")
    print("-" * 60)
    
    # Server settings
    print("\n[Server Settings]")
    print(f"  Host: {settings.server_host}")
    print(f"  Port: {settings.server_port}")
    print(f"  Reload: {settings.server_reload}")
    print(f"  Workers: {settings.server_workers}")
    
    # Database settings
    print("\n[Database Settings]")
    print(f"  URL: {settings.database_url}")
    print(f"  Echo: {settings.database_echo}")
    
    # Security settings
    print("\n[Security Settings]")
    print(f"  Token Expire (minutes): {settings.access_token_expire_minutes}")
    print(f"  JWT Algorithm: {settings.jwt_algorithm}")
    print(f"  JWT Secret Key: {'*' * 20} (hidden)")
    
    # File settings
    print("\n[File Settings]")
    print(f"  Allowed Preview Formats: {', '.join(settings.allowed_preview_formats)}")
    print(f"  Max File Size (MB): {settings.max_file_size_mb}")
    
    # Logging settings
    print("\n[Logging Settings]")
    print(f"  Directory: {settings.log_directory}")
    print(f"  Level: {settings.log_level}")
    
    print("\n" + "=" * 60)
    print("Configuration loaded successfully!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error loading configuration: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
