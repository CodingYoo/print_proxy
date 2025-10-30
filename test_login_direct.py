# -*- coding: utf-8 -*-
"""Test login directly without starting server"""
import sys
from fastapi.security import OAuth2PasswordRequestForm
from app.core.database import session_scope
from app.services import user_service
from app.core.security import create_access_token
from datetime import timedelta
from app.core.config import settings

class MockForm:
    """Mock OAuth2 form"""
    def __init__(self, username, password):
        self.username = username
        self.password = password

def test_login_logic():
    """Test the login logic directly"""
    print("Testing login logic directly...")
    
    with session_scope() as db:
        # Test user authentication
        form_data = MockForm("admin", "admin123")
        
        print(f"\n1. Testing authenticate_user...")
        user = user_service.authenticate_user(db, form_data.username, form_data.password)
        
        if not user:
            print("FAILED - User authentication failed")
            return False
        
        print(f"SUCCESS - User authenticated: {user.username}")
        
        if not user.is_active:
            print("FAILED - User is not active")
            return False
        
        print(f"SUCCESS - User is active")
        
        # Test token creation
        print(f"\n2. Testing token creation...")
        try:
            access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
            access_token = create_access_token(subject=user.username, expires_delta=access_token_expires)
            print(f"SUCCESS - Token created: {access_token[:50]}...")
        except Exception as e:
            print(f"FAILED - Token creation failed: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        print("\nALL TESTS PASSED!")
        return True

if __name__ == "__main__":
    success = test_login_logic()
    sys.exit(0 if success else 1)

