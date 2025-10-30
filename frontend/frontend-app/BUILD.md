# 生产环境构建配置文档

## 概述

本文档描述了前端应用的生产环境构建配置、优化策略和部署指南。

## 构建命令

### 开发环境
```bash
npm run dev
```
启动开发服务器，支持热模块替换 (HMR)。

### 生产构建
```bash
npm run build
```
执行类型检查并构建生产版本到 `dist/` 目录。

### 预览生产构建
```bash
npm run preview
```
本地预览生产构建结果。

## 环境变量管理

### 环境文件

- `.env` - 所有环境的默认配置
- `.env.development` - 开发环境特定配置
- `.env.production` - 生产环境特定配置

### 环境变量规则

1. **命名规范**: 所有暴露给客户端的变量必须以 `VITE_` 开头
2. **类型安全**: 在 `env.d.ts` 中定义 TypeScript 类型
3. **安全性**: 不要在环境变量中存储敏感信息（如密钥、密码）

### 可用环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_API_BASE_URL` | API 基础 URL | `/api` (生产) 或 `http://localhost:8000` (开发) |
| `VITE_APP_TITLE` | 应用标题 | `打印代理控制台` |

### 使用环境变量

```typescript
// 在代码中访问环境变量
const apiUrl = import.meta.env.VITE_API_BASE_URL
const appTitle = import.meta.env.VITE_APP_TITLE

// 访问构建时注入的常量
console.log('App Version:', __APP_VERSION__)
console.log('Build Time:', __BUILD_TIME__)
```

## 构建优化策略

### 1. 代码分割

#### 自动代码分割
- 路由级别的懒加载
- 动态 import() 语句

#### 手动代码分割
配置在 `vite.config.ts` 中的 `manualChunks`:

- `vue-core` - Vue 核心库
- `vue-router` - Vue Router
- `pinia` - Pinia 状态管理
- `naive-ui` - Naive UI 组件库
- `vicons` - 图标库
- `axios` - HTTP 客户端
- `date-fns` - 日期处理库
- `vendor` - 其他第三方库

### 2. 资源优化

#### 图片优化
- 小于 4KB 的图片自动内联为 base64
- 大图片使用内容哈希命名，支持长期缓存

#### CSS 优化
- CSS 代码分割 (`cssCodeSplit: true`)
- 生产环境自动压缩 CSS
- 移除未使用的 CSS (通过 Tailwind CSS 的 purge 功能)

#### JavaScript 优化
- 使用 esbuild 进行快速压缩
- 生产环境自动移除 `console` 和 `debugger`
- Tree-shaking 移除未使用的代码

### 3. 缓存策略

#### 文件命名策略
所有构建产物使用内容哈希命名:
```
js/[name]-[hash].js
images/[name]-[hash].[ext]
fonts/[name]-[hash].[ext]
assets/[name]-[hash].[ext]
```

#### 缓存建议
在 Web 服务器配置中设置以下缓存策略:

```nginx
# Nginx 示例
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location = /index.html {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### 4. 性能优化

#### 依赖预构建
在 `optimizeDeps` 中预先配置常用依赖:
- vue
- vue-router
- pinia
- axios
- naive-ui
- date-fns

#### 构建目标
- 目标浏览器: ES2015+
- 支持现代浏览器，减小包体积

## 构建产物结构

```
dist/
├── index.html              # 入口 HTML (无缓存)
├── favicon.ico             # 网站图标
├── assets/                 # 其他资源文件
│   └── [name]-[hash].[ext]
├── images/                 # 图片资源
│   └── [name]-[hash].[ext]
├── fonts/                  # 字体文件
│   └── [name]-[hash].[ext]
└── js/                     # JavaScript 文件
    ├── index-[hash].js     # 入口文件
    ├── vue-core-[hash].js  # Vue 核心
    ├── vue-router-[hash].js
    ├── pinia-[hash].js
    ├── naive-ui-[hash].js
    ├── vicons-[hash].js
    ├── axios-[hash].js
    └── vendor-[hash].js    # 其他第三方库
```

## 部署指南

### 1. 构建生产版本

```bash
# 安装依赖
npm install

# 执行构建
npm run build
```

### 2. 验证构建

```bash
# 本地预览
npm run preview
```

### 3. 部署到服务器

#### 方案 A: 集成到 FastAPI 应用

将 `dist/` 目录内容复制到 FastAPI 应用的静态文件目录:

```python
# FastAPI 配置示例
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="frontend")
```

#### 方案 B: 独立部署

使用 Nginx 或其他 Web 服务器托管 `dist/` 目录:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. 环境配置

确保生产环境的环境变量正确配置:

```bash
# .env.production
VITE_API_BASE_URL=/api
VITE_APP_TITLE=打印代理控制台
```

## 性能监控

### 构建分析

使用 Vite 的构建分析工具:

```bash
# 安装 rollup-plugin-visualizer
npm install -D rollup-plugin-visualizer

# 在 vite.config.ts 中添加插件
import { visualizer } from 'rollup-plugin-visualizer'

plugins: [
  visualizer({
    open: true,
    gzipSize: true,
    brotliSize: true,
  })
]
```

### 性能指标

关注以下指标:
- **首次内容绘制 (FCP)**: < 1.8s
- **最大内容绘制 (LCP)**: < 2.5s
- **首次输入延迟 (FID)**: < 100ms
- **累积布局偏移 (CLS)**: < 0.1
- **总包大小**: < 500KB (gzipped)

## 故障排除

### 构建失败

1. **类型检查错误**: 运行 `npm run type-check` 查看详细错误
2. **依赖问题**: 删除 `node_modules` 和 `package-lock.json`，重新安装
3. **内存不足**: 增加 Node.js 内存限制 `NODE_OPTIONS=--max-old-space-size=4096 npm run build`

### 运行时错误

1. **API 连接失败**: 检查 `VITE_API_BASE_URL` 配置
2. **路由 404**: 确保服务器配置了 SPA 回退
3. **资源加载失败**: 检查静态资源路径和服务器配置

## 版本管理

### 版本号

版本号自动从 `package.json` 注入到构建中:

```typescript
console.log('Current Version:', __APP_VERSION__)
```

### 构建时间

每次构建都会记录构建时间:

```typescript
console.log('Build Time:', __BUILD_TIME__)
```

## 安全建议

1. **不要在环境变量中存储敏感信息**
2. **使用 HTTPS** 部署生产应用
3. **配置 CSP (Content Security Policy)** 头
4. **启用 CORS** 保护
5. **定期更新依赖** 修复安全漏洞

## 持续集成 (CI/CD)

### GitHub Actions 示例

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

## 参考资源

- [Vite 官方文档](https://vitejs.dev/)
- [Vue 3 文档](https://vuejs.org/)
- [Naive UI 文档](https://www.naiveui.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
