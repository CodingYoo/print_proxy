# 打印代理服务（Print Proxy Service）

## 项目简介

该项目提供一个基于 FastAPI 的打印代理服务，封装 Windows 打印接口并通过 HTTP API 暴露打印任务管理、打印机管理、安全认证、任务队列以及日志记录等功能，同时附带一个简易的 Web 管理界面用于演示和调试。

## 环境要求

- Windows 10 及以上版本
- Python 3.11（已在 Anaconda/venv 环境中验证）
- 具备访问系统打印机的权限（需安装 `pywin32` 对应的依赖）

## 初始化步骤

1. 克隆或下载项目代码后进入目录：
   ```powershell
   cd C:\Users\CodingYooo\Desktop\print_proxy
   ```
2. 安装所需依赖：
   ```powershell
   python -m pip install -r requirements.txt
   ```
3. （可选）配置环境变量：
   - `DATABASE_URL`：自定义数据库连接，默认使用 `sqlite:///./print_proxy.db`
   - `PRINT_PROXY_DISABLE_PRINT=1`：在测试环境中禁用真实打印执行

## 配置服务

服务支持多种配置方式，详见 [配置说明文档](docs/配置说明.md)。

快速配置示例：

```powershell
# 复制配置文件模板
copy .env.example .env

# 编辑 .env 文件修改配置
# 主要配置项：
# - SERVER_HOST: 服务器地址（默认 0.0.0.0）
# - SERVER_PORT: 服务器端口（默认 8568）
# - JWT_SECRET_KEY: JWT 密钥（生产环境必须修改）
```

## 运行服务

### 方式 1：开发模式（推荐开发时使用）

```powershell
# 使用默认配置运行
uvicorn app.main:app --reload

# 或使用环境变量指定配置
$env:SERVER_HOST = "127.0.0.1"
$env:SERVER_PORT = "8568"
uvicorn app.main:app --reload
```

### 方式 2：Windows EXE（推荐生产环境）

```powershell
# 一键打包（双击运行或命令行执行）
build.bat

# 或使用 PowerShell 脚本
powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1

# 运行打包的 EXE
dist\PrintProxy.exe
```

详细打包说明请查看：[Windows 打包指南](scripts/windows/README.md)

### 访问服务

启动后访问：
- API 根路径示例：`http://localhost:8568/api`
- 管理界面：`http://localhost:8568/admin`
- API 文档：`http://localhost:8568/docs`

首次启动会自动创建默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

## 运行测试

1. 确保已安装依赖并设置 `PRINT_PROXY_DISABLE_PRINT=1`，以避免真实打印。
2. 在项目根目录执行：
   ```powershell
   pytest
   ```
3. 若使用自定义 Python 解释器，可通过 `python -m pytest` 运行。

## 常见问题

- **缺少 `win32print` 或 `win32api`**：确认已经安装 `pywin32`，并在对应 Python 解释器中运行 `pywin32_postinstall.py -install`（如有需要）。
- **预览 PDF 失败**：确认已安装 `pymupdf`；若环境限制无法安装，可暂时禁用预览功能。

## 目录结构（节选）

```
app/
  api/            # API 路由与依赖
  core/           # 配置与数据库
  models/         # SQLAlchemy 模型
  schemas/        # Pydantic 模型
  services/       # 业务逻辑
  tasks/          # 队列与后台任务
  utils/          # 工具函数
  web/            # Web 管理界面
docs/             # 文档
  配置说明.md      # 详细配置文档
  配置迁移指南.md   # 版本升级指南
scripts/          # 脚本工具
tests/            # 自动化测试
.env.example      # 环境变量配置模板
config.yaml.example  # YAML 配置模板
requirements.txt  # 依赖列表
scripts/windows/start_server.ps1  # 快速启动脚本
```

## 主要特性

- ✅ 支持多种文件格式（PDF、图片、Word、Excel、TXT）
- ✅ **自定义打印尺寸**：支持标签打印机、小票打印机等非标准纸张
- ✅ **灵活的分辨率设置**：支持 203dpi、300dpi 等多种分辨率
- ✅ **智能质量增强**：自动锐化、对比度优化、抖动算法，打印更清晰
- ✅ **自动旋转适配**：智能判断图片方向，自动旋转以充分利用纸张
- ✅ 打印任务队列管理
- ✅ 多打印机支持
- ✅ JWT 和 API Key 双重认证
- ✅ 完整的日志记录
- ✅ Web 管理界面

## 文档

- [配置说明](docs/配置说明.md) - 详细的配置选项和使用方法
- [配置迁移指南](docs/配置迁移指南.md) - 从旧版本升级的指南
- [API 文档](docs/API文档.md) - API 接口说明
- [快速测试指南](docs/快速测试指南.md) - 测试和验证指南
- [自定义打印尺寸使用指南](docs/自定义打印尺寸使用指南.md) - 标签打印机配置指南
- [打印质量优化说明](docs/打印质量优化说明.md) - 质量增强技术详解
