# -*- coding: utf-8 -*-
"""
测试前端到后端的完整集成
模拟前端通过Vite代理调用后端API
"""
import requests
import json

def test_frontend_to_backend():
    """测试前端通过代理访问后端"""
    print("=" * 60)
    print("测试前端->后端集成")
    print("=" * 60)
    
    # 测试1: 直接访问后端
    print("\n1. 直接访问后端 (http://localhost:8568/api/)")
    try:
        resp = requests.get("http://localhost:8568/api/", timeout=5)
        print(f"   SUCCESS - Status: {resp.status_code}")
        print(f"   Response: {resp.json()}")
    except Exception as e:
        print(f"   FAILED: {e}")
        return False
    
    # 测试2: 通过前端代理访问后端（模拟前端调用）
    print("\n2. 通过Vite代理访问后端 (http://localhost:3000/api/)")
    try:
        resp = requests.get("http://localhost:3000/api/", timeout=5)
        print(f"   SUCCESS - Status: {resp.status_code}")
        print(f"   Response: {resp.json()}")
    except Exception as e:
        print(f"   FAILED: {e}")
        print(f"   Hint: Make sure frontend dev server is running (npm run dev)")
        return False
    
    # 测试3: 通过代理登录
    print("\n3. 测试登录 (http://localhost:3000/api/auth/token)")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        resp = requests.post(
            "http://localhost:3000/api/auth/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=5
        )
        
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("access_token", "")
            print(f"   SUCCESS - Login successful!")
            print(f"   Token: {token[:50]}...")
            
            # 测试4: 使用token获取用户信息
            print("\n4. Get User Info (http://localhost:3000/api/auth/me)")
            user_resp = requests.get(
                "http://localhost:3000/api/auth/me",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5
            )
            
            if user_resp.status_code == 200:
                user = user_resp.json()
                print(f"   SUCCESS - Got user info!")
                print(f"   Username: {user.get('username')}")
                print(f"   Is Admin: {user.get('is_admin')}")
                return True
            else:
                print(f"   FAILED - Cannot get user info")
                print(f"   Status: {user_resp.status_code}")
                print(f"   Response: {user_resp.text}")
                return False
        else:
            print(f"   FAILED - Login failed")
            print(f"   Status: {resp.status_code}")
            print(f"   Response: {resp.text}")
            return False
            
    except Exception as e:
        print(f"   FAILED - Request error: {e}")
        return False

def test_cors():
    """测试CORS配置"""
    print("\n" + "=" * 60)
    print("测试CORS配置")
    print("=" * 60)
    
    try:
        # 模拟前端跨域请求
        headers = {
            "Origin": "http://localhost:3000",
            "Content-Type": "application/json"
        }
        
        resp = requests.get(
            "http://localhost:8568/api/",
            headers=headers,
            timeout=5
        )
        
        cors_headers = {
            "Access-Control-Allow-Origin": resp.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Credentials": resp.headers.get("Access-Control-Allow-Credentials"),
        }
        
        print(f"\nCORS Headers:")
        for key, value in cors_headers.items():
            status = "OK" if value else "NO"
            print(f"  [{status}] {key}: {value}")
        
        return True
        
    except Exception as e:
        print(f"FAILED - CORS test error: {e}")
        return False

if __name__ == "__main__":
    print("\n开始前后端集成测试...")
    
    success = test_frontend_to_backend()
    test_cors()
    
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    
    if success:
        print("\n>>> ALL TESTS PASSED! <<<")
        print("\nFrontend can successfully call backend API through Vite proxy!")
        print("\nNext Steps:")
        print("  1. Open browser: http://localhost:3000")
        print("  2. Login with:")
        print("     Username: admin")
        print("     Password: admin123")
        print("  3. Check browser DevTools Network tab to confirm requests")
    else:
        print("\n>>> TESTS FAILED! <<<")
        print("\nPlease check:")
        print("  1. Backend running on http://localhost:8568")
        print("  2. Frontend running on http://localhost:3000")
        print("  3. Vite proxy configuration is correct")

