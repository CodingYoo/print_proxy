# -*- coding: utf-8 -*-
"""Initialize admin account"""
from app.core.database import session_scope
from app.services import user_service
from app.models import User

def main():
    """Initialize default admin account"""
    print("Initializing database and admin account...")
    
    with session_scope() as db:
        # Check existing users
        users = db.query(User).all()
        print(f"\nFound {len(users)} users in database:")
        for user in users:
            print(f"  - {user.username} (admin={user.is_admin}, active={user.is_active})")
        
        # Ensure default admin exists
        print("\nEnsuring default admin account...")
        admin = user_service.ensure_default_admin(db)
        print(f"Admin account ready: {admin.username}")
        print(f"Default password: admin123")
        
        # Test authentication
        print("\nTesting authentication...")
        auth_user = user_service.authenticate_user(db, "admin", "admin123")
        if auth_user:
            print(f"SUCCESS - Authentication works!")
            print(f"User: {auth_user.username}")
            print(f"Admin: {auth_user.is_admin}")
        else:
            print(f"FAILED - Authentication failed!")
        
    print("\nDone!")

if __name__ == "__main__":
    main()

