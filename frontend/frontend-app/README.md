# 打印代理控制台前端

基于 Vue 3 + TypeScript + Naive UI + Tailwind CSS 的现代化响应式单页应用。

## 技术栈

- **Vue 3** - 使用 Composition API 和 TypeScript
- **Naive UI** - 现代化的 Vue 3 组件库
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Vue Router** - 单页应用路由管理
- **Pinia** - 现代化的状态管理库
- **Axios** - HTTP 客户端
- **Vite** - 快速的构建工具和开发服务器
- **ESLint + Prettier** - 代码规范和格式化

## 项目结构

```
src/
├── api/                 # API 相关
│   └── client.ts       # Axios 客户端配置
├── components/         # 通用组件
├── views/             # 页面组件
├── router/            # 路由配置
├── stores/            # Pinia 状态管理
├── App.vue            # 根组件
├── main.ts            # 应用入口
├── naive-ui.ts        # Naive UI 配置
└── style.css          # Tailwind CSS 样式
```

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run type-check
```

## 环境配置

- 开发环境：`.env.development`
- 生产环境：`.env.production`
- 通用配置：`.env`

## API 配置

API 客户端已配置自动处理：
- 请求拦截器：自动添加认证 token
- 响应拦截器：处理 401 错误和自动登出
- 开发环境代理：`/api` 路径代理到 `http://localhost:8000`

## 下一步

1. 完成核心架构搭建（路由系统、状态管理）
2. 开发基础组件（布局、通用组件）
3. 实现页面组件（总览、打印机管理、任务管理等）
4. 集成用户认证和权限管理
5. 响应式设计实现
6. 性能优化和用户体验提升