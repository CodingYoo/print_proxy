# 认证与权限系统架构

## 1. Identity

- **What it is:** PrintProxy 的双模式认证系统，支持 JWT Token 和 API Key 两种认证方式。
- **Purpose:** 为 Web 界面和程序化访问提供安全的身份验证和基于角色的访问控制。

## 2. Core Components

- `app/core/security.py` (`create_access_token`, `verify_password`, `get_password_hash`): 安全核心模块，提供 JWT Token 生成和密码哈希功能。
- `app/api/deps.py` (`oauth2_scheme`, `api_key_header`, `get_current_user`, `get_current_admin`): 依赖注入模块，提供认证中间件和权限验证。
- `app/services/user_service.py` (`authenticate_user`, `generate_api_key`, `ensure_default_admin`): 用户服务层，处理用户认证和 API Key 管理。
- `app/api/routes/auth.py` (`login_access_token`, `create_user`, `generate_api_key`): 认证 API 路由，提供登录、用户创建和 API Key 生成端点。
- `app/models/user.py` (`User`): 用户数据模型，存储用户凭证、权限和 API Key。
- `app/schemas/auth.py` (`Token`, `TokenPayload`): 认证相关的 Pydantic 数据传输对象。

## 3. Execution Flow (LLM Retrieval Map)

### JWT Token 认证流程

- **1. 登录请求:** 客户端发送 POST `/api/auth/token`，携带 OAuth2PasswordRequestForm。
  - `app/api/routes/auth.py:20-32`
- **2. 用户验证:** 调用 `authenticate_user` 验证用户名和密码（bcrypt 哈希比对）。
  - `app/services/user_service.py:36-42`
- **3. Token 生成:** 调用 `create_access_token` 生成 JWT Token（HS256 算法，默认 7 天有效期）。
  - `app/core/security.py:15-18`
- **4. Token 验证:** 后续请求通过 `Authorization: Bearer <token>` 头传递，由 `_get_user_by_token` 解析验证。
  - `app/api/deps.py:25-38`
- **5. 用户获取:** `get_current_user` 依赖函数返回当前认证用户。
  - `app/api/deps.py:48-57`

### API Key 认证流程

- **1. Key 生成:** 管理员调用 POST `/api/auth/users/{user_id}/api-key` 生成 API Key。
  - `app/api/routes/auth.py:53-63`
- **2. Key 存储:** 使用 `secrets.token_urlsafe(32)` 生成随机 Key，存储到用户表。
  - `app/services/user_service.py:45-51`
- **3. Key 验证:** 请求通过 `X-API-Key` 头传递，由 `_get_user_by_api_key` 验证。
  - `app/api/deps.py:41-45`
- **4. 双模式支持:** `get_current_active_user_or_api_client` 同时支持 JWT 和 API Key（API Key 优先）。
  - `app/api/deps.py:60-69`

### 权限控制流程

- **1. 普通用户:** 使用 `get_current_user` 依赖，要求有效的 JWT Token 且 `is_active=True`。
  - `app/api/deps.py:48-57`
- **2. 管理员:** 使用 `get_current_admin` 依赖，额外要求 `is_admin=True`。
  - `app/api/deps.py:72-77`
- **3. 混合认证:** 使用 `get_current_active_user_or_api_client` 依赖，支持 JWT 或 API Key。
  - `app/api/deps.py:60-69`

## 4. Design Rationale

- **双模式认证:** JWT Token 适用于 Web 界面的有状态会话，API Key 适用于程序化访问和自动化脚本。
- **bcrypt 密码哈希:** 使用 passlib 的 bcrypt 算法，提供高安全性的密码存储。
- **依赖注入模式:** 使用 FastAPI 的 Depends 机制，实现认证逻辑的解耦和复用。
- **默认管理员:** 系统启动时自动创建默认管理员账户（admin/admin123），确保首次部署可用。
