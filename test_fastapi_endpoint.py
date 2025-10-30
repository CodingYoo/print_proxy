# -*- coding: utf-8 -*-
"""Test FastAPI endpoint directly"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login_endpoint():
    """Test login endpoint"""
    print("Testing FastAPI login endpoint...")
    
    # Test data
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    print(f"\n1. Testing POST /api/auth/token")
    print(f"   Data: {login_data}")
    
    try:
        response = client.post(
            "/api/auth/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"\n   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   SUCCESS - Response: {data}")
            
            # Test getting current user
            print(f"\n2. Testing GET /api/auth/me")
            token = data["access_token"]
            me_response = client.get(
                "/api/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            print(f"   Status: {me_response.status_code}")
            if me_response.status_code == 200:
                print(f"   SUCCESS - User: {me_response.json()}")
            else:
                print(f"   FAILED - Response: {me_response.text}")
        else:
            print(f"   FAILED - Response: {response.text}")
            print(f"   Full response: {response.__dict__}")
            
    except Exception as e:
        print(f"   ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_login_endpoint()

