# 打印代理服务 API 文档

## 基本信息

- 服务根地址：`http://<host>:<port>/api`
- 接口风格：RESTful JSON
- 身份认证：
  - **OAuth2 Password**：请求 `POST /api/auth/token` 获取 Bearer Token，在后续请求的 `Authorization: Bearer <token>` 头中携带。
  - **API Key**：管理员可通过 `POST /api/auth/users/{user_id}/api-key` 生成，在后续请求头中携带 `X-API-Key: <key>`。

若接口标记为“需要认证”，则必须携带上述任一凭证。带星号（*）的接口仅管理员可调用。

---

## 认证相关

### `POST /api/auth/token`
- 描述：使用用户名密码换取访问令牌。
- 请求（`application/x-www-form-urlencoded`）：
  - `username`（必填）
  - `password`（必填）
  - `grant_type=password`
- 响应：`200 OK`
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

### `POST /api/auth/users`
- 描述：创建新用户。*
- 请求体：
```json
{
  "username": "alice",
  "full_name": "Alice",
  "password": "secret",
  "is_active": true,
  "is_admin": false
}
```
- 响应：`201 Created`，返回用户详情。

### `GET /api/auth/me`
- 描述：获取当前登录用户信息。
- 响应：`200 OK`，返回用户详情。

### `POST /api/auth/users/{user_id}/api-key`
- 描述：为指定用户生成/刷新 API Key。*
- 路径参数：`user_id` 用户 ID。
- 响应：`200 OK`，正文为纯文本 API Key。

---

## 打印机管理

### `GET /api/printers/`
- 描述：查询已登记的打印机列表。
- 响应：`200 OK`
```json
[
  {
    "id": 1,
    "name": "HP-LASER",
    "is_default": true,
    "status": "online",
    "location": "办公室",
    "created_at": "2025-10-10T02:30:00"
  }
]
```

### `POST /api/printers/sync`
- 描述：同步系统打印机信息并更新数据库。*
- 响应：`200 OK`，返回同步后的打印机列表。

### `PUT /api/printers/{printer_id}`
- 描述：更新打印机属性（状态、默认标记、位置）。*
- 请求体示例：
```json
{
  "status": "offline",
  "is_default": false,
  "location": "会议室"
}
```
- 响应：`200 OK`，返回更新后的打印机。

### `POST /api/printers/{printer_id}/default`
- 描述：设置指定打印机为默认打印机（同时调用底层系统设置）。*
- 响应：`200 OK`，返回最新的打印机信息。

---

## 打印任务

### `POST /api/jobs/`
- 描述：创建打印任务并自动加入队列。
- 支持 Bearer Token 或 API Key。
- 请求体示例：
```json
{
  "title": "报告打印",
  "printer_name": "HP-LASER",
  "file_type": "pdf",
  "content_base64": "<Base64 内容>",
  "copies": 1,
  "priority": 5,
  "media_size": "A4",
  "color_mode": "color",
  "duplex": "long-edge"
}
```
- 响应：`201 Created`，返回任务详情。

### `GET /api/jobs/`
- 描述：分页查询打印任务列表。
- 查询参数：
  - `skip`（默认 0）
  - `limit`（默认 20）
- 响应：`200 OK`，返回任务数组。

### `GET /api/jobs/{job_id}`
- 描述：获取指定任务详情。
- 响应：`200 OK`。

### `PATCH /api/jobs/{job_id}`
- 描述：更新任务优先级、份数或状态（仅任务所有者或管理员）。
- 请求体示例：
```json
{
  "priority": 3
}
```
- 响应：`200 OK`。

### `POST /api/jobs/{job_id}/cancel`
- 描述：取消队列中的任务（仅任务所有者或管理员）。
- 响应：`200 OK`。

### `GET /api/jobs/{job_id}/status`
- 描述：查询任务状态。
- 响应：`200 OK`
```json
{
  "status": "completed",
  "error_message": null
}
```

### `GET /api/jobs/{job_id}/preview`
- 描述：获取任务预览图（Base64 文本，图片或 PDF 首页）。
- 响应：`200 OK`，`text/plain` 内容为 Base64 编码 PNG。

---

## 日志查询

### `GET /api/logs/`
- 描述：查询打印任务日志。
- 查询参数：`job_id`（可选，按任务过滤）
- 响应：`200 OK`
```json
[
  {
    "id": 10,
    "job_id": 3,
    "level": "info",
    "message": "打印任务已创建并进入队列",
    "created_at": "2025-10-10T03:45:00"
  }
]
```

---

## 错误响应格式

所有接口在异常情况下均返回 FastAPI 标准错误结构：
```json
{
  "detail": "错误描述"
}
```

常见状态码：
- `400 Bad Request`：参数或业务校验失败。
- `401 Unauthorized`：认证失败或缺失凭证。
- `403 Forbidden`：权限不足。
- `404 Not Found`：资源不存在。
- `500 Internal Server Error`：服务器内部错误。

---

## 调试建议

1. 访问 `http://<host>:<port>/docs` 使用 FastAPI 自动生成的 Swagger UI 快速调试接口。
2. 若需批量调用，可通过 Postman/Insomnia 导入上述接口描述，自行维护测试集合。
