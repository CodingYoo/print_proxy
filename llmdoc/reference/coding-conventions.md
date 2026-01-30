# PrintProxy 编码规范

## 1. 核心概要

本文档定义了 PrintProxy 项目的编码规范，涵盖后端 Python (FastAPI) 和前端 TypeScript (React) 两部分。所有规范均基于项目实际配置和代码风格提取。

## 2. 真实来源

- **后端依赖**: `requirements.txt`
- **前端配置**: `frontend/package.json`, `frontend/eslint.config.js`, `frontend/tsconfig.app.json`
- **架构文档**: `/llmdoc/agent/scout-backend.md`, `/llmdoc/agent/scout-frontend.md`

---

## 3. 后端 Python 编码规范

### 3.1 代码风格

- **Python 版本**: 3.10+
- **类型注解**: 必须使用，文件头添加 `from __future__ import annotations`
- **日志**: 使用 `loguru.logger`，禁止使用 `print()`
- **异步**: FastAPI 路由可使用同步或异步函数，服务层优先同步

### 3.2 命名约定

| 类型 | 规范 | 示例 |
|------|------|------|
| 模块/文件 | snake_case | `job_service.py`, `print_utils.py` |
| 类 | PascalCase | `PrintJob`, `JobQueueManager` |
| 函数/方法 | snake_case | `create_print_job()`, `get_user_by_username()` |
| 常量 | UPPER_SNAKE_CASE | `ALLOWED_FILE_TYPES`, `SUPPORTED_IMAGE_TYPES` |
| 私有函数 | 前缀下划线 | `_send_to_printer()`, `_resolve_com_active_printer()` |

### 3.3 项目分层架构

```
app/
├── api/           # API 层: 路由定义、依赖注入
│   ├── deps.py    # 依赖注入函数 (get_db, get_current_user)
│   └── routes/    # 路由模块 (auth, jobs, printers, logs)
├── core/          # 核心层: 配置、数据库、安全
├── models/        # 数据模型层: SQLAlchemy ORM 模型
├── schemas/       # DTO 层: Pydantic 数据传输对象
├── services/      # 业务服务层: 核心业务逻辑
├── tasks/         # 任务队列层: 异步任务处理
├── utils/         # 工具函数层: 通用工具
└── web/           # Web 路由层: SPA 前端服务
```

### 3.4 导入顺序

```python
from __future__ import annotations          # 1. Future imports

import base64                               # 2. 标准库
from typing import List, Optional

from fastapi import APIRouter, Depends      # 3. 第三方库
from loguru import logger
from sqlalchemy.orm import Session

from app.api import deps                    # 4. 项目内部模块
from app.models import PrintJob
from app.services import job_service
```

---

## 4. 前端 TypeScript/React 编码规范

### 4.1 ESLint 规则概要

- **配置文件**: `frontend/eslint.config.js`
- **继承规则**: `@eslint/js` recommended, `typescript-eslint` recommended
- **React 插件**: `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- **目标版本**: ECMAScript 2020

### 4.2 TypeScript 严格模式

- `strict: true` - 启用所有严格类型检查
- `noUnusedLocals: true` - 禁止未使用的局部变量
- `noUnusedParameters: true` - 禁止未使用的参数
- `noFallthroughCasesInSwitch: true` - 禁止 switch 穿透

### 4.3 组件命名和文件组织

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase.tsx | `Button.tsx`, `DashboardLayout.tsx` |
| 组件名 | PascalCase | `Button`, `ConfirmDialog` |
| Hook | use 前缀 camelCase | `useAuthStore`, `useMessageStore` |
| API 模块 | camelCase.ts | `jobs.ts`, `printers.ts` |
| 工具函数 | camelCase | `cn()` |

### 4.4 目录结构

```
frontend/src/
├── api/           # API 客户端层 (Axios 封装)
├── components/    # 组件库
│   ├── layout/    # 布局组件 (Sidebar, Header)
│   └── ui/        # UI 基础组件 (Button, Card, Table)
├── pages/         # 页面组件
├── store/         # Zustand 状态管理
├── router/        # React Router 配置
└── lib/           # 工具函数
```

### 4.5 状态管理约定

- **全局状态**: 使用 Zustand (`create<StateType>`)
- **页面状态**: 使用 `useState` 本地管理
- **Store 命名**: `use[Name]Store` (如 `useAuthStore`)
- **导出方式**: 通过 `index.ts` 统一导出

---

## 5. 通用规范

### 5.1 文件命名

| 位置 | 规范 |
|------|------|
| 后端 Python | snake_case (`job_service.py`) |
| 前端组件 | PascalCase (`Button.tsx`) |
| 前端非组件 | camelCase (`client.ts`, `utils.ts`) |
| 配置文件 | kebab-case 或约定名 (`vite.config.ts`) |

### 5.2 注释规范

- **后端**: 中文注释，关键逻辑必须注释
- **前端**: 复杂逻辑添加注释，组件 Props 使用 TypeScript 接口自文档化
- **禁止**: 无意义注释、注释掉的代码块

### 5.3 路径别名

- **前端**: 使用 `@/` 别名指向 `src/` 目录
- **配置**: `vite.config.ts` 和 `tsconfig.app.json` 同步配置
