# 如何添加新的前端页面

本指南说明如何在 PrintProxy 前端添加新页面，包括路由配置、组件创建和 API 集成。

## 1. 创建页面组件

在 `frontend/src/pages/dashboard/` 目录下创建新的页面组件文件。

**参考模板:** `frontend/src/pages/dashboard/Jobs.tsx:17-49` - 标准页面结构，包含状态定义和数据加载。

**关键要素:**
- 使用 `useState` 管理页面状态
- 使用 `useEffect` 触发数据加载
- 使用 `useMessageStore` 显示操作反馈

## 2. 导出页面组件

在 `frontend/src/pages/dashboard/index.ts` 中添加导出。

在 `frontend/src/pages/index.ts` 中添加统一导出。

## 3. 配置路由

在 `frontend/src/router/index.tsx:40-46` 的 children 数组中添加新路由。

**路由配置格式:**
```tsx
{ path: 'your-path', element: <YourPage /> }
```

## 4. 添加侧边栏导航

在 `frontend/src/components/layout/Sidebar.tsx` 的导航菜单数组中添加新菜单项。

**菜单项格式:** 包含 name、href、icon 属性。

## 5. 使用 UI 组件库

从 `@/components/ui` 导入所需组件。

**可用组件:**
- `Button` - 按钮 (variants: primary/secondary/danger/ghost/outline/link)
- `Card` - 卡片容器 (padding: none/sm/md/lg)
- `Table` - 数据表格 (支持列定义、行选择、分页)
- `Modal` - 模态框
- `Input` / `Select` - 表单控件
- `Badge` - 状态徽章

**组件参考:** `frontend/src/components/ui/Button.tsx:4-8` - ButtonProps 接口定义。

## 6. 集成 API

**步骤 A:** 在 `frontend/src/api/` 目录下创建 API 模块或扩展现有模块。

**步骤 B:** 使用 `apiClient` 发送请求，参考 `frontend/src/api/jobs.ts:33-41`。

**步骤 C:** 在 `frontend/src/api/index.ts` 中导出新 API。

## 7. 验证

1. 运行 `cd frontend && npm run dev` 启动开发服务器
2. 访问新页面路由，确认页面正常渲染
3. 测试 API 调用和用户交互功能
4. 检查消息通知是否正常显示
