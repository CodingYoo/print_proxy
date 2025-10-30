# Print Proxy 快速开始

## 🚀 5 分钟快速上手

### 1. 打包 Windows EXE

```cmd
# 双击运行或命令行执行
build.bat
```

等待 2-5 分钟，完成后会在 `dist\` 目录生成 `PrintProxy.exe`

### 2. 运行服务

```cmd
# 双击运行
dist\PrintProxy.exe
```

或命令行运行：
```cmd
cd dist
PrintProxy.exe
```

### 3. 访问服务

打开浏览器访问：
- **管理界面**: http://localhost:8568/admin
- **API 文档**: http://localhost:8568/docs

### 4. 登录

- **用户名**: `admin`
- **密码**: `admin123`

### 5. 测试打印

使用 API 文档页面测试打印功能：

1. 点击 `POST /api/jobs/` 接口
2. 点击 "Try it out"
3. 填写请求参数：

```json
{
  "title": "测试打印",
  "file_type": "png",
  "content_base64": "iVBORw0KGgoAAAANS...",
  "media_size": "40x60mm",
  "color_mode": "monochrome",
  "fit_mode": "fill",
  "auto_rotate": true,
  "enhance_quality": true
}
```

4. 点击 "Execute"

## 📦 常用命令

```powershell
# 打包 EXE
build.bat

# 清理构建文件
powershell -ExecutionPolicy Bypass -File scripts\windows\clean.ps1

# 测试 EXE
powershell -ExecutionPolicy Bypass -File scripts\windows\test_exe.ps1

# 开发模式运行
uvicorn app.main:app --reload
```

## 🔧 配置文件

创建 `.env` 文件（可选）：

```env
SERVER_HOST=0.0.0.0
SERVER_PORT=8568
JWT_SECRET_KEY=your_secret_key_here
LOG_LEVEL=INFO
```

## 📍 重要路径

- **EXE 文件**: `dist\PrintProxy.exe`
- **数据库**: `%APPDATA%\PrintProxy\print_proxy.db`
- **日志**: `%APPDATA%\PrintProxy\logs\`
- **配置**: EXE 同目录的 `.env` 或 `config.yaml`

## 🎯 标签打印最佳配置

```json
{
  "media_size": "40x60mm",
  "color_mode": "monochrome",
  "fit_mode": "fill",
  "auto_rotate": true,
  "enhance_quality": true
}
```

## 📚 更多文档

- [完整 README](README.md)
- [Windows 打包指南](scripts/windows/README.md)
- [配置说明](docs/配置说明.md)
- [API 文档](docs/API文档.md)
- [打印质量优化](docs/打印质量优化说明.md)
- [自定义打印尺寸](docs/自定义打印尺寸使用指南.md)

## ❓ 常见问题

**Q: 打包失败怎么办？**
```powershell
# 清理后重试
powershell -ExecutionPolicy Bypass -File scripts\windows\clean.ps1 -All
build.bat
```

**Q: EXE 启动失败？**
- 查看日志：`%APPDATA%\PrintProxy\logs\error.log`
- 检查端口：`netstat -ano | findstr :8568`

**Q: 如何修改端口？**
- 创建 `.env` 文件，设置 `SERVER_PORT=9000`

**Q: 如何停止服务？**
- 任务管理器结束 `PrintProxy.exe` 进程

## 💡 提示

- ✅ 首次运行会自动创建数据库和日志目录
- ✅ EXE 可以在没有 Python 的机器上运行
- ✅ 支持自定义打印尺寸（如 40×60mm 标签）
- ✅ 内置质量增强，打印更清晰
- ✅ 自动旋转图片以适配纸张

---

**需要帮助？** 查看完整文档或提交 Issue
