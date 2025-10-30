# 前端登录问题修复 - 快速开始指南

## 🎯 问题已修复

前端登录无法调用后端接口的问题已经修复。主要修复内容：

1. ✅ 创建了前端环境变量配置文件
2. ✅ 修正了API端口配置
3. ✅ 修复了bcrypt版本兼容性问题

## 🚀 快速启动

### 方法一：使用启动脚本（推荐）

双击运行以下脚本：
```
start_dev.bat
```

这将自动启动：
- 后端服务 (http://localhost:8568)
- 前端开发服务器 (http://localhost:3000)

### 方法二：手动启动

#### 1. 启动后端

```bash
# 方式A：使用现有脚本
start_backend.bat

# 方式B：直接命令
python -m uvicorn app.main:app --host 127.0.0.1 --port 8568 --reload
```

#### 2. 启动前端

```bash
cd frontend/frontend-app
npm run dev
```

## 🔐 登录测试

1. 打开浏览器访问: http://localhost:3000
2. 使用默认管理员账户登录：
   - **用户名**: `admin`
   - **密码**: `admin123`

## ✅ 验证步骤

### 1. 检查后端服务

打开浏览器访问：http://localhost:8568/api/

预期响应：
```json
{
  "service": "Print Proxy Service",
  "status": "ok",
  "timestamp": "...",
  "documentation": "/docs"
}
```

### 2. 测试登录API

可以使用提供的测试脚本：
```bash
python simple_api_test.py
```

预期输出：
```
Test 1: Backend Service Status
SUCCESS - Backend is running

Test 2: Login Endpoint  
SUCCESS - Login successful

Test 3: Get Current User
SUCCESS - Got user info

ALL TESTS PASSED!
```

### 3. 测试前端登录

1. 浏览器访问 http://localhost:3000
2. 输入用户名 `admin` 和密码 `admin123`
3. 点击"登录"按钮
4. 应该成功跳转到控制台首页

## 🔍 故障排查

### 问题：前端无法连接后端

**解决方案：**
1. 确认后端服务正在运行（访问 http://localhost:8568/api/）
2. 检查 `frontend/frontend-app/.env.development` 文件存在
3. 确认文件内容为：
   ```
   VITE_APP_TITLE=打印代理控制台 (开发)
   VITE_API_BASE_URL=/api
   ```

### 问题：登录返回500错误

**解决方案：**
1. 停止后端服务
2. 运行：`pip install "bcrypt==4.0.1" --force-reinstall`
3. 重新启动后端服务

### 问题：用户名或密码错误

**解决方案：**
运行初始化脚本重置管理员账户：
```bash
python init_admin.py
```

### 问题：端口被占用

**解决方案：**

查找占用端口的进程：
```bash
# 后端端口 8568
netstat -ano | findstr :8568

# 前端端口 3000  
netstat -ano | findstr :3000
```

结束占用进程：
```bash
taskkill /PID <进程ID> /F
```

## 📁 关键文件

### 环境配置
- `frontend/frontend-app/.env` - 基础环境配置
- `frontend/frontend-app/.env.development` - 开发环境配置
- `frontend/frontend-app/.env.production` - 生产环境配置

### 配置文件
- `frontend/frontend-app/vite.config.ts` - Vite配置（代理设置）
- `frontend/frontend-app/deploy.config.js` - 部署配置
- `app/core/config.py` - 后端配置

### API相关
- `frontend/frontend-app/src/api/client.ts` - API客户端
- `frontend/frontend-app/src/api/services/auth.ts` - 认证API服务
- `app/api/routes/auth.py` - 后端认证路由

## 📊 开发工具

### API文档
访问 http://localhost:8568/docs 查看交互式API文档

### 数据库位置
`%APPDATA%\PrintProxy\print_proxy.db`

### 日志位置  
`%APPDATA%\PrintProxy\logs\`

## 🔧 高级配置

### 修改后端端口

如需修改后端端口，需要同步修改以下位置：

1. `app/core/config.py`：
   ```python
   server_port: int = Field(default=8568)
   ```

2. `frontend/frontend-app/vite.config.ts`：
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:8568', // 改为新端口
     }
   }
   ```

### 修改前端端口

编辑 `frontend/frontend-app/vite.config.ts`：
```typescript
server: {
  port: 3000, // 改为新端口
}
```

## 📚 更多信息

- 详细修复说明：`.kiro/fix_summary.md`
- 项目文档：`docs/`
- API文档：`docs/API文档.md`

## ❓ 需要帮助？

如果仍然遇到问题：

1. 查看后端控制台输出
2. 查看浏览器开发者工具的Network标签
3. 检查 `.kiro/fix_summary.md` 中的详细说明
4. 运行测试脚本验证后端API

---

**更新时间：** 2025-10-30  
**适用版本：** v1.0.0

