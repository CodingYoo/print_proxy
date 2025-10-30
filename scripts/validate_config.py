"""Validate configuration and check for common issues"""
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


def check_port_available(port: int) -> bool:
    """Check if port is available"""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', port))
            return True
    except OSError:
        return False


def check_file_permissions(path: Path) -> bool:
    """Check if directory is writable"""
    try:
        test_file = path / '.test_write'
        test_file.touch()
        test_file.unlink()
        return True
    except Exception:
        return False


def validate_config():
    """Validate configuration and report issues"""
    print("=" * 70)
    print("Print Proxy Service - Configuration Validator")
    print("=" * 70)
    print()
    
    issues = []
    warnings = []
    
    # Check configuration files
    print("[1/6] Checking configuration files...")
    
    env_file = project_root / ".env"
    yaml_file = project_root / "config.yaml"
    
    if env_file.exists():
        print(f"  ✓ Found .env file: {env_file}")
    else:
        warnings.append("No .env file found (using defaults)")
        print(f"  ⚠ No .env file found")
        if (project_root / ".env.example").exists():
            print(f"    Hint: Copy .env.example to .env to customize settings")
    
    if yaml_file.exists():
        print(f"  ✓ Found config.yaml file: {yaml_file}")
        # Try to parse YAML
        try:
            import yaml
            with open(yaml_file, 'r', encoding='utf-8') as f:
                yaml.safe_load(f)
            print(f"  ✓ config.yaml is valid YAML")
        except Exception as e:
            issues.append(f"config.yaml has syntax errors: {e}")
            print(f"  ✗ config.yaml has syntax errors: {e}")
    
    print()
    
    # Load settings
    print("[2/6] Loading settings...")
    try:
        from app.core.config import settings
        print(f"  ✓ Settings loaded successfully")
    except Exception as e:
        issues.append(f"Failed to load settings: {e}")
        print(f"  ✗ Failed to load settings: {e}")
        print()
        print("=" * 70)
        print(f"FAILED: {len(issues)} critical issue(s) found")
        for issue in issues:
            print(f"  ✗ {issue}")
        return False
    
    print()
    
    # Check server settings
    print("[3/6] Validating server settings...")
    
    print(f"  Host: {settings.server_host}")
    print(f"  Port: {settings.server_port}")
    
    if settings.server_port < 1024:
        warnings.append(f"Port {settings.server_port} requires administrator privileges")
        print(f"  ⚠ Port {settings.server_port} may require administrator privileges")
    
    if not check_port_available(settings.server_port):
        issues.append(f"Port {settings.server_port} is already in use")
        print(f"  ✗ Port {settings.server_port} is already in use")
        print(f"    Hint: Change SERVER_PORT in configuration or stop the conflicting service")
    else:
        print(f"  ✓ Port {settings.server_port} is available")
    
    if settings.server_host not in ["0.0.0.0", "127.0.0.1", "localhost"]:
        warnings.append(f"Unusual host address: {settings.server_host}")
        print(f"  ⚠ Unusual host address: {settings.server_host}")
    
    print()
    
    # Check security settings
    print("[4/6] Validating security settings...")
    
    if settings.jwt_secret_key == "change_me":
        issues.append("JWT_SECRET_KEY is using default value - INSECURE!")
        print(f"  ✗ JWT_SECRET_KEY is using default value")
        print(f"    Hint: Set a strong random key in production")
    else:
        print(f"  ✓ JWT_SECRET_KEY is customized")
    
    if len(settings.jwt_secret_key) < 32:
        warnings.append("JWT_SECRET_KEY is too short (recommended: 32+ characters)")
        print(f"  ⚠ JWT_SECRET_KEY is short (length: {len(settings.jwt_secret_key)})")
    
    print()
    
    # Check file system permissions
    print("[5/6] Checking file system permissions...")
    
    log_dir = Path(settings.log_directory)
    if log_dir.exists():
        if check_file_permissions(log_dir):
            print(f"  ✓ Log directory is writable: {log_dir}")
        else:
            issues.append(f"Log directory is not writable: {log_dir}")
            print(f"  ✗ Log directory is not writable: {log_dir}")
    else:
        print(f"  ⚠ Log directory does not exist yet: {log_dir}")
        print(f"    (Will be created on startup)")
    
    # Check database
    if settings.database_url.startswith("sqlite"):
        db_path = settings.database_url.replace("sqlite:///", "")
        db_dir = Path(db_path).parent
        if db_dir.exists():
            if check_file_permissions(db_dir):
                print(f"  ✓ Database directory is writable: {db_dir}")
            else:
                issues.append(f"Database directory is not writable: {db_dir}")
                print(f"  ✗ Database directory is not writable: {db_dir}")
        else:
            print(f"  ⚠ Database directory does not exist yet: {db_dir}")
            print(f"    (Will be created on startup)")
    
    print()
    
    # Check dependencies
    print("[6/6] Checking dependencies...")
    
    required_modules = [
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "pydantic",
        "yaml",
    ]
    
    missing_modules = []
    for module in required_modules:
        try:
            __import__(module)
            print(f"  ✓ {module}")
        except ImportError:
            missing_modules.append(module)
            print(f"  ✗ {module} not found")
    
    if missing_modules:
        issues.append(f"Missing dependencies: {', '.join(missing_modules)}")
        print(f"    Hint: Run 'pip install -r requirements.txt'")
    
    print()
    print("=" * 70)
    
    # Summary
    if issues:
        print(f"FAILED: {len(issues)} critical issue(s) found")
        print()
        for i, issue in enumerate(issues, 1):
            print(f"  {i}. ✗ {issue}")
        print()
        if warnings:
            print(f"Also {len(warnings)} warning(s):")
            for i, warning in enumerate(warnings, 1):
                print(f"  {i}. ⚠ {warning}")
        print()
        print("Please fix the issues above before starting the service.")
        return False
    elif warnings:
        print(f"PASSED with {len(warnings)} warning(s)")
        print()
        for i, warning in enumerate(warnings, 1):
            print(f"  {i}. ⚠ {warning}")
        print()
        print("Configuration is valid but consider addressing the warnings.")
        return True
    else:
        print("PASSED: Configuration is valid!")
        print()
        print("You can start the service with:")
        print("  .\\scripts\\windows\\start_server.ps1")
        print("or")
        print("  python -m uvicorn app.main:app --reload")
        return True


def main():
    """Main entry point"""
    try:
        success = validate_config()
        sys.exit(0 if success else 1)
    except Exception as e:
        print()
        print("=" * 70)
        print("FATAL ERROR during validation:")
        print(f"  {e}")
        print()
        import traceback
        traceback.print_exc()
        sys.exit(2)


if __name__ == "__main__":
    main()
