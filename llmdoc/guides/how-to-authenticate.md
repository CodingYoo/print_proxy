# 如何进行认证操作

本指南介绍如何在 PrintProxy 系统中进行用户认证、API Key 管理和权限控制。

## 获取 JWT Token

1. **发送登录请求:** POST `/api/auth/token`，使用 `application/x-www-form-urlencoded` 格式。
   - 参数: `username` (用户名), `password` (密码)
   - 参考: `app/api/routes/auth.py:20-32`

2. **接收 Token 响应:** 成功返回 `{"access_token": "...", "token_type": "bearer"}`。

3. **使用 Token:** 在后续请求的 Header 中添加 `Authorization: Bearer <access_token>`。

4. **验证:** 调用 GET `/api/auth/me` 确认 Token 有效，返回当前用户信息。

## 使用 API Key

1. **生成 API Key:** 管理员调用 POST `/api/auth/users/{user_id}/api-key`。
   - 需要管理员权限（`is_admin=True`）
   - 参考: `app/api/routes/auth.py:53-63`

2. **保存 API Key:** 响应返回生成的 API Key 字符串，需安全保存（仅显示一次）。

3. **使用 API Key:** 在请求 Header 中添加 `X-API-Key: <api_key>`。
   - 参考: `app/api/deps.py:17`, `app/api/deps.py:60-69`

4. **验证:** API Key 认证优先于 JWT Token，适用于支持双模式认证的端点。

## 创建用户和管理权限

1. **创建普通用户:** 管理员调用 POST `/api/auth/users`。
   - 请求体: `{"username": "...", "password": "...", "full_name": "..."}`
   - 参考: `app/api/routes/auth.py:35-45`

2. **创建管理员:** 在 `UserCreate` 中设置 `is_admin: true`（需通过服务层直接调用）。
   - 参考: `app/services/user_service.py:22-33`

3. **默认管理员:** 系统首次启动自动创建 `admin/admin123` 账户。
   - 参考: `app/services/user_service.py:54-69`

4. **权限验证:** 管理员端点使用 `get_current_admin` 依赖进行权限检查。
   - 参考: `app/api/deps.py:72-77`

## 认证端点权限要求

| 端点 | 方法 | 权限要求 |
|------|------|----------|
| `/api/auth/token` | POST | 无（公开） |
| `/api/auth/me` | GET | JWT Token |
| `/api/auth/users` | POST | 管理员 |
| `/api/auth/users/{id}/api-key` | POST | 管理员 |
