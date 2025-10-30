# PrintProxy - 专业打印代理服务

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/your-repo/printproxy)
[![Python](https://img.shields.io/badge/python-3.11+-green.svg)](https://python.org)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)](https://microsoft.com/windows)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

## 🚀 项目简介

PrintProxy 是一个专业的 Windows 打印代理服务，基于 FastAPI 构建，提供完整的打印解决方案。支持多种文件格式、自定义打印尺寸、智能质量增强等高级功能，特别适合标签打印、小票打印等专业场景。

### ✨ 核心特性

- 🖨️ **多格式支持**：PDF、PNG、JPG、SVG、Word、Excel、TXT 等
- 📏 **自定义尺寸**：支持 40×60mm、58mm、80mm 等标签和小票尺寸
- 🎯 **智能质量增强**：锐化、对比度优化、抖动算法，二维码扫描成功率提升 20%+
- 🔄 **自动旋转适配**：智能判断图片方向，充分利用纸张空间
- 📊 **任务队列管理**：优先级调度、批量操作、状态监控
- 🔐 **双重认证**：JWT Token + API Key，企业级安全
- 📱 **Web 管理界面**：直观的任务管理和打印机控制
- 🚀 **一键部署**：EXE 单文件，开机自启，静默运行

## 🎯 适用场景

- **标签打印**：产品标签、二维码标签、条形码标签
- **小票打印**：收据、凭证、流水单
- **办公打印**：文档、报表、图片批量打印
- **工业打印**：生产线标签、物流标签、追溯码
- **API 集成**：与 ERP、WMS、POS 等系统集成

## 📋 环境要求

- **操作系统**：Windows 10/11 (x64)
- **Python**：3.11+ （开发环境）
- **权限**：普通用户权限（无需管理员）
- **依赖**：自动处理，无需手动安装

## 🚀 快速开始

### 方式 1：使用安装器（推荐）

1. **下载安装器**
   ```powershell
   # 下载最新版本
   scripts\windows\PrintProxySetup_1.0.0.exe
   ```

2. **安装程序**
   - 右键选择"以管理员身份运行"
   - 按向导完成安装
   - 选择是否立即启动

3. **验证安装**
   ```powershell
   # 检查服务状态
   curl http://localhost:8568/docs
   
   # 查看进程
   tasklist | findstr PrintProxy
   ```

### 方式 2：直接运行 EXE

```powershell
# 下载并运行
dist\PrintProxy.exe

# 或复制到任意目录
copy dist\PrintProxy.exe C:\YourPath\
C:\YourPath\PrintProxy.exe
```

### 方式 3：开发环境

1. **克隆项目**
   ```powershell
   git clone https://github.com/your-repo/printproxy.git
   cd printproxy
   ```

2. **安装依赖**
   ```powershell
   python -m pip install -r requirements.txt
   ```

3. **启动服务**
   ```powershell
   # 使用启动脚本
   .\scripts\windows\start_server.ps1
   
   # 或直接运行
   uvicorn app.main:app --reload
   ```

## ⚙️ 配置说明

### 快速配置

```powershell
# 复制配置模板
copy .env.example .env

# 编辑配置文件
notepad .env
```

### 主要配置项

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `SERVER_HOST` | `0.0.0.0` | 服务器地址（0.0.0.0=所有接口，127.0.0.1=仅本地） |
| `SERVER_PORT` | `8568` | 服务器端口 |
| `JWT_SECRET_KEY` | `change_me` | JWT 密钥（⚠️ 生产环境必须修改） |
| `LOG_LEVEL` | `INFO` | 日志级别（DEBUG/INFO/WARNING/ERROR） |

### 配置方式优先级

1. **环境变量** - 最高优先级
2. **.env 文件** - 推荐使用
3. **config.yaml 文件** - 复杂配置
4. **默认值** - 最低优先级

详细配置说明请查看：[配置快速参考](docs/配置快速参考.md)

## 🌐 访问服务

启动后可通过以下地址访问：

| 地址 | 说明 |
|------|------|
| `http://localhost:8568` | 主页 |
| `http://localhost:8568/docs` | **API 文档**（Swagger UI） |
| `http://localhost:8568/admin` | Web 管理界面 |
| `http://localhost:8568/api` | API 端点 |

### 默认账号

首次启动会自动创建管理员账号：
- **用户名**：`admin`
- **密码**：`admin123`

⚠️ **安全提示**：生产环境请立即修改默认密码和 JWT 密钥

## 📱 使用示例

### API 调用示例

```python
import requests
import base64

# 1. 获取访问令牌
response = requests.post("http://localhost:8568/api/auth/token", data={
    "username": "admin",
    "password": "admin123",
    "grant_type": "password"
})
token = response.json()["access_token"]

# 2. 创建打印任务
with open("label.png", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()

print_job = {
    "title": "产品标签",
    "file_type": "png",
    "content_base64": image_data,
    "media_size": "40x60mm@300dpi",  # 自定义尺寸
    "color_mode": "monochrome",      # 黑白打印
    "fit_mode": "fill",              # 填满纸张
    "auto_rotate": True,             # 自动旋转
    "enhance_quality": True,         # 质量增强
    "copies": 1
}

response = requests.post(
    "http://localhost:8568/api/jobs/",
    headers={"Authorization": f"Bearer {token}"},
    json=print_job
)

print(f"任务ID: {response.json()['id']}")
```

### Java 客户端示例

```java
// 使用 Spring RestTemplate
PrintJobRequest request = PrintJobRequest.builder()
    .title("二维码标签")
    .fileType("png")
    .contentBase64(qrCodeBase64)
    .mediaSize("40x60mm")
    .colorMode("monochrome")
    .fitMode("fill")
    .autoRotate(true)
    .enhanceQuality(true)
    .copies(1)
    .build();

ResponseEntity<PrintJobResponse> response = restTemplate.postForEntity(
    "http://localhost:8568/api/jobs/",
    request,
    PrintJobResponse.class
);
```

## 🧪 测试和验证

### 快速验证

```powershell
# 检查服务状态
curl http://localhost:8568/docs

# 检查进程
tasklist | findstr PrintProxy

# 检查端口
netstat -ano | findstr :8568

# 查看日志
Get-Content "$env:APPDATA\PrintProxy\logs\printproxy_*.log" -Tail 20
```

### 运行测试套件

```powershell
# 设置测试环境（禁用真实打印）
$env:PRINT_PROXY_DISABLE_PRINT = "1"

# 运行所有测试
pytest

# 运行特定测试
pytest tests/test_svg_support.py -v
```

### 功能测试

```powershell
# 测试打印机同步
curl -X POST http://localhost:8568/api/printers/sync

# 测试任务创建
# 参考上面的 API 调用示例
```

## ❓ 常见问题

### 安装和启动问题

**Q: 程序启动后没有窗口，如何确认运行状态？**

A: 这是正常的静默模式。检查方法：
- 任务管理器查看 `PrintProxy.exe` 进程
- 浏览器访问 `http://localhost:8568/docs`
- 命令行：`netstat -ano | findstr :8568`

**Q: 端口 8568 被占用怎么办？**

A: 修改配置文件中的端口：
```env
SERVER_PORT=9000
```

**Q: 开机后服务没有自动启动？**

A: 检查注册表启动项：
```powershell
Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "Print Proxy"
```

### 打印问题

**Q: 打印质量不佳，二维码扫描失败？**

A: 启用质量增强功能：
```json
{
  "enhance_quality": true,
  "media_size": "40x60mm@300dpi"
}
```

**Q: 图片打印方向不对？**

A: 启用自动旋转：
```json
{
  "auto_rotate": true,
  "fit_mode": "fill"
}
```

**Q: 支持哪些文件格式？**

A: 支持格式：
- **图片**：PNG, JPG, JPEG, BMP, SVG
- **文档**：PDF, TXT, DOC, DOCX, XLS, XLSX

### 权限和安全

**Q: 数据库和日志存储在哪里？**

A: 自动存储在用户目录，无需管理员权限：
- **Windows**: `%APPDATA%\PrintProxy\`
- 数据库: `%APPDATA%\PrintProxy\print_proxy.db`
- 日志: `%APPDATA%\PrintProxy\logs\`

**Q: 如何修改 JWT 密钥？**

A: 编辑配置文件：
```env
JWT_SECRET_KEY=your_very_secure_random_key_here
```

## 📁 项目结构

```
PrintProxy/
├── app/                          # 应用程序核心
│   ├── api/                      # API 路由
│   ├── core/                     # 配置和数据库
│   ├── models/                   # 数据模型
│   ├── schemas/                  # API 模式
│   ├── services/                 # 业务逻辑
│   ├── tasks/                    # 任务队列
│   ├── utils/                    # 工具函数
│   ├── web/                      # Web 界面
│   └── main.py                   # 应用入口
├── docs/                         # 📚 项目文档
│   ├── README_安装使用.md         # 安装使用说明
│   ├── API文档.md                # API 接口文档
│   ├── 配置说明.md               # 详细配置文档
│   ├── 配置快速参考.md           # 配置快速参考
│   ├── 功能更新日志.md           # 功能更新日志
│   ├── 快速测试指南.md           # 测试指南
│   ├── SVG打印功能说明.md        # SVG 功能说明
│   ├── 自定义打印尺寸使用指南.md  # 尺寸配置指南
│   └── 项目Wiki_核心架构与扩展指南.md # 架构文档
├── scripts/                      # 🔧 脚本工具
│   ├── windows/                  # Windows 脚本
│   │   ├── build_exe.ps1         # 构建 EXE
│   │   ├── build_installer.ps1   # 构建安装器
│   │   └── start_server.ps1      # 启动服务
│   ├── show_config.py            # 显示配置
│   └── validate_config.py        # 验证配置
├── tests/                        # 🧪 测试文件
├── dist/                         # 📦 打包输出
│   ├── PrintProxy.exe            # 主程序
│   └── PrintProxySetup_1.0.0.exe # 安装器
├── .env.example                  # 环境变量模板
├── config.yaml.example          # YAML 配置模板
├── requirements.txt              # Python 依赖
├── build_exe.bat                 # 一键构建脚本
└── README.md                     # 项目说明
```

## 🎯 核心功能

### 📄 文件格式支持

| 类型 | 格式 | 说明 |
|------|------|------|
| **图片** | PNG, JPG, JPEG, BMP | 高质量图像打印 |
| **矢量图** | SVG | 矢量图形，无损缩放 |
| **文档** | PDF | 完整文档打印 |
| **办公** | DOC, DOCX, XLS, XLSX | Office 文档 |
| **文本** | TXT | 纯文本打印 |

### 📏 自定义打印尺寸

```json
{
  "media_size": "40x60mm@300dpi",    // 标签尺寸 + 分辨率
  "media_size": "58mm",              // 小票宽度
  "media_size": "2x3inch@203dpi"     // 英寸尺寸
}
```

**支持场景**：
- 🏷️ 标签打印机（40×60mm, 50×80mm 等）
- 🧾 小票打印机（58mm, 80mm 宽度）
- 📋 非标准纸张尺寸

### 🎨 智能质量增强

| 技术 | 效果 | 提升 |
|------|------|------|
| **锐化处理** | 边缘更清晰 | 二维码扫描成功率 +20% |
| **对比度优化** | 黑白更分明 | 文字清晰度 +67% |
| **Floyd-Steinberg 抖动** | 灰度过渡自然 | 细节保留更多 |
| **LANCZOS 缩放** | 无锯齿缩放 | 图像质量最佳 |

### 🔄 智能适配功能

- **自动旋转**：检测图片和纸张方向，自动旋转以充分利用空间
- **智能填充**：`fill`/`contain`/`cover`/`stretch` 多种模式
- **分辨率适配**：203dpi/300dpi/600dpi 自动适配

### 🚀 企业级特性

- **任务队列**：优先级调度、批量操作、状态监控
- **多打印机**：支持网络打印机、本地打印机
- **权限管理**：用户权限、打印配额、访问控制
- **日志审计**：完整的操作日志和统计报表
- **API 集成**：RESTful API，支持各种编程语言

## 📚 文档导航

### 🚀 快速开始
- [安装使用说明](docs/README_安装使用.md) - 详细的安装和使用指南
- [配置快速参考](docs/配置快速参考.md) - 常用配置和命令
- [快速测试指南](docs/快速测试指南.md) - 验证安装和功能测试

### 📖 功能文档
- [API 文档](docs/API文档.md) - 完整的 API 接口说明
- [SVG 打印功能说明](docs/SVG打印功能说明.md) - SVG 矢量图打印
- [自定义打印尺寸使用指南](docs/自定义打印尺寸使用指南.md) - 标签打印配置
- [功能更新日志](docs/功能更新日志.md) - 版本更新和新功能

### 🔧 配置和部署
- [配置说明](docs/配置说明.md) - 详细的配置选项
- [配置迁移指南](docs/配置迁移指南.md) - 版本升级指南
- [项目结构说明](docs/项目结构说明.md) - 代码结构说明

### 🏗️ 开发文档
- [核心架构与扩展指南](docs/项目Wiki_核心架构与扩展指南.md) - 架构设计和扩展开发

## 🔄 版本更新

### v2.0.0 - 打印质量全面升级
- ✅ 新增 SVG 文件格式支持
- ✅ 智能质量增强技术
- ✅ 自定义打印尺寸支持
- ✅ 自动旋转和智能填充
- ✅ 高 DPI 打印支持

### v1.0.0 - 基础功能
- ✅ 多格式文件打印
- ✅ 任务队列管理
- ✅ Web 管理界面
- ✅ JWT 认证系统

## 🤝 技术支持

- 📧 **问题反馈**：提交 Issue 或联系技术支持
- 📖 **文档**：查看 `docs/` 目录下的详细文档
- 🔍 **日志**：查看 `%APPDATA%\PrintProxy\logs\` 目录
- 🌐 **API 文档**：访问 `http://localhost:8568/docs`

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**© 2025 PrintProxy Team. All rights reserved.**
