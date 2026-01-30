# PrintProxy 文档索引

## 项目简介

PrintProxy 是一个基于 FastAPI 构建的专业 Windows 打印代理服务，提供统一的打印任务管理接口，支持多种文件格式（PDF、图片、Office 文档等），适用于标签打印、小票打印等场景。

## 文档目录结构

```
llmdoc/
├── index.md              # 本索引文件
├── overview/             # 项目概述（必读）
├── architecture/         # 系统架构（LLM 检索地图）
├── guides/               # 操作指南（如何做 X）
└── reference/            # 参考资料（X 的具体细节）
```

---

## Overview（概述）

高层次项目上下文，回答"这个项目是什么？"

| 文档 | 说明 |
|------|------|
| [project-overview.md](overview/project-overview.md) | 项目整体介绍、技术栈、核心特性和目录结构 |

---

## Architecture（架构）

系统构建方式，回答"它是如何工作的？"

| 文档 | 说明 |
|------|------|
| [frontend-architecture.md](architecture/frontend-architecture.md) | 前端架构：React 19 + TypeScript + Vite，组件库、状态管理、路由守卫 |
| [api-task-queue-architecture.md](architecture/api-task-queue-architecture.md) | API 与任务队列：RESTful API 层、优先级队列、双重认证机制 |
| [print-service-architecture.md](architecture/print-service-architecture.md) | 打印服务核心：任务创建/处理流程、多打印模式、Windows GDI 交互 |
| [auth-system-architecture.md](architecture/auth-system-architecture.md) | 认证系统：JWT Token + API Key 双模式认证、权限控制流程 |

---

## Guides（指南）

操作指南，回答"如何做 X？"

| 文档 | 说明 |
|------|------|
| [how-to-add-frontend-page.md](guides/how-to-add-frontend-page.md) | 添加新前端页面：组件创建、路由配置、API 集成 |
| [how-to-add-print-format.md](guides/how-to-add-print-format.md) | 添加新文件格式支持：类型注册、载荷准备、打印函数实现 |
| [how-to-authenticate.md](guides/how-to-authenticate.md) | 认证操作：获取 JWT Token、使用 API Key、用户管理 |

---

## Reference（参考）

详细查阅信息，回答"X 的具体细节是什么？"

| 文档 | 说明 |
|------|------|
| [api-endpoints.md](reference/api-endpoints.md) | API 端点清单：认证、任务、打印机、日志四大模块的完整端点列表 |
| [print-options.md](reference/print-options.md) | 打印选项参考：纸张尺寸、颜色模式、缩放方式、质量增强参数 |
| [coding-conventions.md](reference/coding-conventions.md) | 编码规范：后端 Python 和前端 TypeScript/React 的命名、分层、导入规范 |
| [git-conventions.md](reference/git-conventions.md) | Git 规范：分支策略、提交消息格式、工作流程 |

---

## 快速导航

### 新手入门

1. 阅读 [project-overview.md](overview/project-overview.md) 了解项目全貌
2. 查看 [coding-conventions.md](reference/coding-conventions.md) 熟悉代码规范
3. 根据任务选择相应的架构文档深入了解

### 常见任务

| 任务 | 推荐文档 |
|------|----------|
| 理解后端 API 结构 | [api-task-queue-architecture.md](architecture/api-task-queue-architecture.md) |
| 理解前端组件和状态 | [frontend-architecture.md](architecture/frontend-architecture.md) |
| 添加新页面 | [how-to-add-frontend-page.md](guides/how-to-add-frontend-page.md) |
| 支持新文件格式 | [how-to-add-print-format.md](guides/how-to-add-print-format.md) |
| 调用 API 接口 | [api-endpoints.md](reference/api-endpoints.md) + [how-to-authenticate.md](guides/how-to-authenticate.md) |
| 调整打印效果 | [print-options.md](reference/print-options.md) |

### 核心代码入口

| 模块 | 入口文件 |
|------|----------|
| 后端应用 | `app/main.py` |
| API 路由 | `app/api/__init__.py` |
| 打印服务 | `app/services/job_service.py` |
| 任务队列 | `app/tasks/manager.py` |
| 前端应用 | `frontend/src/main.tsx` |
| 前端路由 | `frontend/src/router/index.tsx` |
| 状态管理 | `frontend/src/store/` |
