# 前端架构

## 1. Identity

- **What it is:** 基于 React 19 + TypeScript + Vite 构建的现代化单页应用 (SPA)。
- **Purpose:** 提供打印任务管理、打印机管理、系统日志查看等功能的用户界面。

## 2. Core Components

### 应用入口与路由

- `frontend/src/main.tsx` (`StrictMode`): React 应用入口，渲染根组件。
- `frontend/src/App.tsx` (`App`): 根组件，初始化认证状态，渲染路由和消息容器。
- `frontend/src/router/index.tsx` (`router`, `ProtectedRoute`, `PublicRoute`): 路由配置，包含路由守卫实现。

### 状态管理 (Zustand)

- `frontend/src/store/auth.ts` (`useAuthStore`): 认证状态管理，包含 login/logout/fetchUser/checkAuth 方法。
- `frontend/src/store/message.ts` (`useMessageStore`): 全局消息通知状态，支持 info/success/error 类型，4 秒自动消失。

### API 客户端层

- `frontend/src/api/client.ts` (`apiClient`, `setToken`, `getToken`, `clearToken`): Axios 实例配置，请求/响应拦截器，Token 管理。
- `frontend/src/api/auth.ts` (`authApi`): 认证 API (login, getCurrentUser)。
- `frontend/src/api/jobs.ts` (`jobsApi`, `PrintJob`, `CreateJobParams`): 打印任务 API。
- `frontend/src/api/printers.ts` (`printersApi`): 打印机 API。
- `frontend/src/api/logs.ts` (`logsApi`): 系统日志 API。

### 布局组件

- `frontend/src/components/layout/DashboardLayout.tsx` (`DashboardLayout`): 仪表板布局容器，管理侧边栏状态。
- `frontend/src/components/layout/Sidebar.tsx` (`Sidebar`): 侧边栏导航，包含菜单和用户信息。
- `frontend/src/components/layout/Header.tsx` (`Header`): 顶部导航栏，包含面包屑和服务状态指示器。

### UI 组件库

- `frontend/src/components/ui/Button.tsx` (`Button`): 按钮组件，6 种变体，4 种尺寸，支持 loading 状态。
- `frontend/src/components/ui/Table.tsx` (`Table`): 表格组件，支持列定义、行选择、分页。
- `frontend/src/components/ui/Modal.tsx` (`Modal`): 模态框组件。
- `frontend/src/components/ui/Card.tsx` (`Card`): 卡片容器组件。
- `frontend/src/components/ui/Input.tsx` (`Input`): 输入框组件。
- `frontend/src/components/ui/Select.tsx` (`Select`): 下拉选择组件。
- `frontend/src/components/ui/Badge.tsx` (`Badge`): 徽章组件，多种颜色变体。
- `frontend/src/components/ui/ConfirmDialog.tsx` (`ConfirmDialog`): 确认对话框组件。

### 页面组件

- `frontend/src/pages/Login.tsx` (`LoginPage`): 登录页面。
- `frontend/src/pages/dashboard/Overview.tsx` (`OverviewPage`): 总览页面。
- `frontend/src/pages/dashboard/Jobs.tsx` (`JobsPage`): 打印任务管理页面。
- `frontend/src/pages/dashboard/Printers.tsx` (`PrintersPage`): 打印机管理页面。
- `frontend/src/pages/dashboard/Logs.tsx` (`LogsPage`): 系统日志页面。
- `frontend/src/pages/dashboard/ApiDocs.tsx` (`ApiDocsPage`): API 文档页面。

## 3. Execution Flow (LLM Retrieval Map)

### 认证流程

1. **入口检查:** `frontend/src/App.tsx:11-15` - 应用启动时检查 Token 并获取用户信息。
2. **路由守卫:** `frontend/src/router/index.tsx:6-11` - ProtectedRoute 检查 Token，无效则重定向登录。
3. **登录请求:** `frontend/src/store/auth.ts:20-26` - 调用 authApi.login，存储 Token，获取用户信息。
4. **Token 管理:** `frontend/src/api/client.ts:31-46` - setToken/getToken/clearToken 操作 localStorage/sessionStorage。

### API 请求流程

1. **请求拦截:** `frontend/src/api/client.ts:11-17` - 自动添加 Authorization Bearer Token。
2. **响应拦截:** `frontend/src/api/client.ts:19-29` - 401 响应自动清除 Token 并跳转登录。
3. **API 调用:** 页面组件调用 `frontend/src/api/jobs.ts:33-80` 等 API 模块方法。

### 页面渲染流程

1. **布局渲染:** `frontend/src/components/layout/DashboardLayout.tsx:6-24` - 渲染 Sidebar + Header + Outlet。
2. **页面加载:** `frontend/src/pages/dashboard/Jobs.tsx:39-49` - useEffect 触发数据加载。
3. **状态更新:** 页面组件使用 useState 管理本地状态，触发重新渲染。
4. **消息通知:** `frontend/src/store/message.ts:22-32` - showMessage 添加消息，4 秒后自动移除。

## 4. Design Rationale

- **Zustand vs Redux:** 选择 Zustand 因其轻量级和简洁的 API，适合中小型应用。
- **路由守卫模式:** 使用组件包装而非路由配置，便于灵活控制和扩展。
- **Token 双存储:** 支持 localStorage (记住登录) 和 sessionStorage (会话级)，提升用户体验。
- **API 拦截器:** 统一处理认证和错误，减少重复代码。
- **组件变体系统:** UI 组件使用 variants/sizes 模式，提供一致的设计语言。
