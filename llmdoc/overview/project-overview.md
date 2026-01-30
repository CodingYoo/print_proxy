# PrintProxy 项目概述

## 1. Identity

- **What it is:** PrintProxy 是一个基于 FastAPI 构建的专业 Windows 打印代理服务。
- **Purpose:** 提供统一的打印任务管理接口，支持多种文件格式的打印，适用于标签打印、小票打印等场景。

## 2. High-Level Description

PrintProxy 是一个全栈打印管理解决方案，通过 RESTful API 接收打印任务，使用优先级队列调度，并通过 Windows GDI API 和 COM 自动化执行打印。系统支持 JWT Token 和 API Key 双重认证，提供完整的打印机管理、任务追踪和日志审计功能。

## 3. 技术栈

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 运行时环境 |
| FastAPI | 0.115+ | Web 框架 |
| SQLAlchemy | 2.0+ | ORM 数据库访问 |
| SQLite | - | 数据存储 |
| Pydantic | 2.0+ | 数据验证 |
| PyMuPDF (fitz) | - | PDF 渲染 |
| Pillow | - | 图像处理 |
| pywin32 | - | Windows API 调用 |

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2+ | UI 框架 |
| TypeScript | 5.9+ | 类型系统 |
| Vite | 6.0+ | 构建工具 |
| Zustand | 5.0+ | 状态管理 |
| Tailwind CSS | 4.1+ | 样式框架 |
| Axios | 1.13+ | HTTP 客户端 |
| React Router | 7.11+ | 路由管理 |

### 打印技术

| 技术 | 用途 |
|------|------|
| Windows GDI API | 图片和 PDF 打印 |
| PyMuPDF | PDF 页面渲染 |
| COM 自动化 | Word/Excel 文档打印 |
| win32print | 打印机管理和 RAW 打印 |

## 4. 核心特性

- **多格式支持:** PDF, PNG, JPG, JPEG, BMP, SVG, TXT, DOC, DOCX, XLS, XLSX
- **优先级队列:** 基于 PriorityQueue 的任务调度，支持任务取消
- **质量增强:** 锐化、对比度优化、Floyd-Steinberg 抖动算法
- **智能适配:** 自动旋转、多种缩放模式 (contain/fill/cover/stretch)
- **自定义尺寸:** 支持 "40x60mm@300dpi" 格式的纸张尺寸定义
- **双重认证:** JWT Token (Web 界面) + API Key (程序化访问)
- **实时监控:** 打印机状态轮询、任务队列查看
- **日志审计:** 任务日志和系统日志记录

## 5. 目标用户和使用场景

- **目标用户:** 需要集中管理打印任务的企业和开发者
- **使用场景:**
  - 标签打印系统 (条码、二维码)
  - 小票打印 (POS 系统)
  - 批量文档打印
  - 打印任务 API 集成

## 6. 项目目录结构

```
print_proxy/
├── app/                    # 后端应用
│   ├── api/               # API 路由和依赖注入
│   ├── core/              # 配置、数据库、安全
│   ├── models/            # SQLAlchemy ORM 模型
│   ├── schemas/           # Pydantic DTO
│   ├── services/          # 业务逻辑层
│   ├── tasks/             # 任务队列管理
│   ├── utils/             # 工具函数
│   ├── web/               # SPA 前端路由
│   └── main.py            # 应用入口
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── api/          # API 客户端
│   │   ├── components/   # UI 组件
│   │   ├── pages/        # 页面组件
│   │   ├── store/        # Zustand 状态
│   │   └── router/       # 路由配置
│   └── vite.config.ts    # Vite 配置
└── llmdoc/               # 项目文档
```

## 7. 相关文档

- `/llmdoc/architecture/backend-architecture.md` - 后端架构详解
- `/llmdoc/architecture/frontend-architecture.md` - 前端架构详解
- `/llmdoc/architecture/print-service.md` - 打印服务核心
- `/llmdoc/reference/api-endpoints.md` - API 端点参考
