# -*- coding: utf-8 -*-
"""简单的API连接测试"""
import requests
import sys

def test_api():
    """测试API连接和登录"""
    base_url = "http://localhost:8568"
    
    # 测试1: 后端服务状态
    print("=" * 60)
    print("Test 1: Backend Service Status")
    print("=" * 60)
    try:
        resp = requests.get(f"{base_url}/api/", timeout=5)
        print(f"SUCCESS - Backend is running")
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")
    except Exception as e:
        print(f"FAILED - Cannot connect to backend")
        print(f"Error: {e}")
        print(f"\nPlease start backend: python -m uvicorn app.main:app --host 127.0.0.1 --port 8568")
        return False
    
    # 测试2: 登录接口
    print("\n" + "=" * 60)
    print("Test 2: Login Endpoint")
    print("=" * 60)
    
    login_data = {"username": "admin", "password": "admin123"}
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    
    try:
        resp = requests.post(
            f"{base_url}/api/auth/token",
            data=login_data,
            headers=headers,
            timeout=5
        )
        
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("access_token", "")
            print(f"SUCCESS - Login successful")
            print(f"Status: {resp.status_code}")
            print(f"Token: {token[:50]}...")
            
            # 测试3: 获取用户信息
            print("\n" + "=" * 60)
            print("Test 3: Get Current User")
            print("=" * 60)
            
            auth_headers = {"Authorization": f"Bearer {token}"}
            user_resp = requests.get(
                f"{base_url}/api/auth/me",
                headers=auth_headers,
                timeout=5
            )
            
            if user_resp.status_code == 200:
                user_data = user_resp.json()
                print(f"SUCCESS - Got user info")
                print(f"User: {user_data}")
            else:
                print(f"FAILED - Cannot get user info")
                print(f"Status: {user_resp.status_code}")
                print(f"Response: {user_resp.text}")
            
            return True
        else:
            print(f"FAILED - Login failed")
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
            return False
            
    except Exception as e:
        print(f"FAILED - Request error")
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("\nStarting API Connection Tests...")
    print("=" * 60)
    
    success = test_api()
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    if success:
        print("\nALL TESTS PASSED!")
        print("\nFrontend should be able to call backend API.")
        print("\nIf frontend login still fails, check:")
        print("  1. Frontend dev server running (npm run dev)")
        print("  2. Browser console for errors")
        print("  3. Network tab in browser DevTools")
        print("  4. .env files in frontend/frontend-app/")
    else:
        print("\nTESTS FAILED!")
        print("\nPlease check:")
        print("  1. Backend service is running")
        print("  2. Database is initialized")
        print("  3. Default admin account exists")
    
    sys.exit(0 if success else 1)

