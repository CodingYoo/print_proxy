# API 端点参考

## 1. Core Summary

PrintProxy 提供 RESTful API，分为四个模块：认证（auth）、打印任务（jobs）、打印机管理（printers）、日志（logs）。所有 API 端点前缀为 `/api`，支持 JWT Token 和 API Key 双重认证。

## 2. Source of Truth

- **路由定义:** `app/api/__init__.py` - API 主路由器聚合。
- **认证路由:** `app/api/routes/auth.py` - 登录、用户管理端点。
- **任务路由:** `app/api/routes/jobs.py` - 打印任务 CRUD 端点。
- **打印机路由:** `app/api/routes/printers.py` - 打印机管理端点。
- **日志路由:** `app/api/routes/logs.py` - 日志查询端点。
- **数据模型:** `app/schemas/` - Pydantic 请求/响应模型。
- **相关架构:** `/llmdoc/architecture/api-task-queue-architecture.md`

## 3. API 端点清单

### 3.1 认证 API (`/api/auth`)

| 方法 | 端点 | 权限 | 说明 | 代码位置 |
|------|------|------|------|----------|
| POST | `/token` | 公开 | OAuth2 密码登录，返回 JWT Token | `auth.py:20-32` |
| POST | `/users` | 管理员 | 创建新用户 | `auth.py:35-45` |
| GET | `/me` | 已认证 | 获取当前用户信息 | `auth.py:48-50` |
| POST | `/users/{user_id}/api-key` | 管理员 | 为用户生成 API Key | `auth.py:53-63` |

### 3.2 打印任务 API (`/api/jobs`)

| 方法 | 端点 | 权限 | 说明 | 代码位置 |
|------|------|------|------|----------|
| POST | `/` | JWT/API Key | 创建打印任务 | `jobs.py:19-34` |
| GET | `/` | 已认证 | 列出任务（支持分页、搜索） | `jobs.py:37-46` |
| POST | `/batch/reprint` | 已认证 | 批量重印任务 | `jobs.py:49-66` |
| GET | `/{job_id}` | 已认证 | 获取任务详情 | `jobs.py:69-76` |
| PATCH | `/{job_id}` | 所有者/管理员 | 更新任务 | `jobs.py:79-90` |
| POST | `/{job_id}/cancel` | 所有者/管理员 | 取消任务 | `jobs.py:93-103` |
| POST | `/{job_id}/reprint` | 所有者/管理员 | 重印任务 | `jobs.py:106-116` |
| DELETE | `/` | 管理员 | 清空所有任务 | `jobs.py:119-127` |
| DELETE | `/{job_id}` | 所有者/管理员 | 删除任务 | `jobs.py:130-140` |
| GET | `/{job_id}/status` | 已认证 | 获取任务状态 | `jobs.py:143-150` |
| GET | `/{job_id}/preview` | 所有者/管理员 | 获取任务预览（Base64） | `jobs.py:153-164` |

### 3.3 打印机管理 API (`/api/printers`)

| 方法 | 端点 | 权限 | 说明 | 代码位置 |
|------|------|------|------|----------|
| GET | `/` | 已认证 | 列出所有打印机 | `printers.py:17-23` |
| POST | `/sync` | 管理员 | 同步系统打印机 | `printers.py:26-32` |
| PUT | `/{printer_id}` | 管理员 | 更新打印机信息 | `printers.py:35-51` |
| POST | `/{printer_id}/default` | 管理员 | 设置默认打印机 | `printers.py:54-64` |
| DELETE | `/{printer_id}` | 管理员 | 删除打印机 | `printers.py:67-80` |
| GET | `/{printer_id}/status` | 已认证 | 获取打印机状态 | `printers.py:83-93` |
| POST | `/{printer_id}/test-page` | 管理员 | 打印测试页 | `printers.py:96-110` |
| GET | `/{printer_id}/jobs` | 已认证 | 获取打印机队列 | `printers.py:113-123` |
| DELETE | `/{printer_id}/jobs` | 管理员 | 清空打印机队列 | `printers.py:126-140` |
| GET | `/{printer_id}/maintenance` | 已认证 | 获取维护记录 | `printers.py:143-153` |
| POST | `/{printer_id}/maintenance` | 管理员 | 添加维护记录 | `printers.py:156-172` |
| DELETE | `/{printer_id}/maintenance/{log_id}` | 管理员 | 删除维护记录 | `printers.py:175-192` |

### 3.4 日志 API (`/api/logs`)

| 方法 | 端点 | 权限 | 说明 | 代码位置 |
|------|------|------|------|----------|
| GET | `/` | 已认证 | 获取日志列表（可按 job_id 过滤） | `logs.py:17-24` |
| DELETE | `/` | 管理员 | 清空所有日志 | `logs.py:27-37` |

### 3.5 系统 API (`/api`)

| 方法 | 端点 | 权限 | 说明 | 代码位置 |
|------|------|------|------|----------|
| GET | `/` | 公开 | 服务状态检查 | `__init__.py:15-22` |

## 4. 关键数据结构

### 4.1 PrintJobCreate（创建任务请求）

定义位置: `app/schemas/print_job.py:39-49`

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| title | string | 是 | - | 任务标题（最大 200 字符） |
| file_type | string | 是 | - | 文件类型（pdf/png/jpg/jpeg/bmp/svg/txt/doc/docx/xls/xlsx） |
| content_base64 | string | 是 | - | 文件内容的 Base64 编码 |
| copies | int | 否 | 1 | 打印份数（最小 1） |
| priority | int | 否 | 5 | 优先级（1-10，数字越小优先级越高） |
| media_size | string | 否 | null | 纸张尺寸（如 "40x60mm@203dpi"） |
| color_mode | string | 否 | null | 颜色模式（monochrome/grayscale/color） |
| dpi | int | 否 | 203 | 打印分辨率（72-1200） |
| fit_mode | string | 否 | "fill" | 适配模式（fill/contain） |
| auto_rotate | bool | 否 | true | 自动旋转以适配纸张 |
| enhance_quality | bool | 否 | true | 增强打印质量 |
| scale_to_fit | bool | 否 | false | 缩放适配纸张尺寸 |

### 4.2 认证方式

- **JWT Token:** 请求头 `Authorization: Bearer <token>`
- **API Key:** 请求头 `X-API-Key: <api_key>`

### 4.3 任务状态

| 状态 | 说明 |
|------|------|
| queued | 排队中 |
| processing | 处理中 |
| completed | 已完成 |
| failed | 失败 |
| cancelled | 已取消 |
