# API 与任务队列架构

## 1. Identity

- **What it is:** PrintProxy 的 RESTful API 层和基于优先级队列的异步任务处理系统。
- **Purpose:** 提供打印任务的创建、管理和异步执行能力，支持双重认证机制（JWT Token / API Key）。

## 2. Core Components

- `app/api/__init__.py` (`api_router`): API 主路由器，聚合 auth、jobs、printers、logs 四个子路由模块。
- `app/api/deps.py` (`oauth2_scheme`, `api_key_header`, `get_current_user`, `get_current_admin`): 认证依赖注入，支持 JWT Token 和 API Key 双重认证。
- `app/api/routes/auth.py` (`router`): 认证路由，提供登录、用户管理、API Key 生成。
- `app/api/routes/jobs.py` (`router`): 打印任务路由，提供任务 CRUD、批量重印、取消、预览。
- `app/api/routes/printers.py` (`router`): 打印机管理路由，提供同步、状态查询、队列管理。
- `app/api/routes/logs.py` (`router`): 日志查询路由。
- `app/tasks/manager.py` (`JobQueueManager`, `job_queue`): 任务队列管理器，基于 PriorityQueue 实现。
- `app/services/job_service.py` (`create_print_job`, `process_print_job`, `_send_to_printer`): 任务创建和处理核心逻辑。
- `app/schemas/print_job.py` (`PrintJobCreate`, `PrintJobRead`, `ALLOWED_FILE_TYPES`): 请求/响应数据模型。

## 3. Execution Flow (LLM Retrieval Map)

### 3.1 API 请求处理流程

- **1. 路由注册:** `app/api/__init__.py:8-12` 聚合所有子路由到 `api_router`。
- **2. 认证验证:** `app/api/deps.py:48-57` (`get_current_user`) 或 `app/api/deps.py:60-69` (`get_current_active_user_or_api_client`) 验证用户身份。
- **3. 业务处理:** 路由处理函数调用 `app/services/` 下的服务层函数。
- **4. 响应返回:** 使用 Pydantic 模型序列化响应数据。

### 3.2 任务队列处理流程

- **1. 任务创建:** `app/services/job_service.py:102-158` 创建 PrintJob 记录，调用 `job_queue.enqueue()`。
- **2. 入队排序:** `app/tasks/manager.py:22-23` 按 `(priority, timestamp, job_id)` 三元组排序。
- **3. 工作线程取任务:** `app/tasks/manager.py:33-47` 从队列取出任务，检查取消状态。
- **4. 任务处理:** `app/services/job_service.py:748-775` 更新状态为 processing，调用 `_send_to_printer()`。
- **5. 打印分发:** `app/services/job_service.py:625-745` 根据文件类型选择打印模式（raw/image_gdi/pdf_gdi/word/excel）。
- **6. 状态更新:** 打印完成后更新状态为 completed 或 failed。

### 3.3 认证流程

- **JWT Token:** `app/api/routes/auth.py:20-32` 登录获取 Token -> `app/api/deps.py:25-38` 解析验证。
- **API Key:** `app/api/routes/auth.py:53-63` 生成 API Key -> `app/api/deps.py:41-45` 验证。

## 4. Design Rationale

- **双重认证:** JWT Token 用于 Web 界面交互，API Key 用于程序化访问（如自动化脚本）。
- **优先级队列:** 使用 Python 标准库 `PriorityQueue`，简单高效，支持任务优先级调度。
- **单线程处理:** 避免并发打印导致的资源冲突，保证打印顺序。
- **任务取消机制:** 使用 `set` 存储已取消任务 ID，工作线程处理前检查跳过。
- **多打印模式:** 根据文件类型自动选择最佳打印方式（GDI/COM/RAW）。
