# 配置系统更新日志

## 版本更新说明

本次更新为 Print Proxy Service 添加了完整的配置管理系统，使服务端口、主机地址等参数可以通过配置文件灵活配置。

## 主要改动

### 1. 核心配置系统 (`app/core/config.py`)

**新增配置项：**
- `server_host`: 服务器主机地址（默认：0.0.0.0）
- `server_port`: 服务器端口（默认：8568）
- `server_reload`: 自动重载开关（默认：false）
- `server_workers`: Worker 进程数（默认：1）
- `max_file_size_mb`: 最大文件大小限制（默认：50MB）
- `log_level`: 日志级别（默认：INFO）

**功能增强：**
- 支持 YAML 配置文件 (`config.yaml`)
- 支持 .env 环境变量文件
- 支持传统环境变量
- 向后兼容旧版 `PRINT_PROXY_*` 环境变量
- 配置优先级：环境变量 > .env > config.yaml > 默认值

### 2. 配置文件模板

**新增文件：**
- `.env.example` - 环境变量配置模板（推荐使用）
- `config.yaml.example` - YAML 配置模板
- 两种格式可根据喜好选择使用

### 3. 启动脚本增强 (`scripts/windows/run_app.py`)

**改进：**
- 自动从配置系统读取服务器参数
- 支持新旧环境变量
- 更好的错误处理和日志记录

### 4. 工具脚本

**新增脚本：**

1. **`scripts/windows/start_server.ps1`** - 快速启动脚本
   ```powershell
   .\scripts\windows\start_server.ps1                    # 使用默认配置
   .\scripts\windows\start_server.ps1 -Host 127.0.0.1    # 指定主机
   .\scripts\windows\start_server.ps1 -Port 9000         # 指定端口
   .\scripts\windows\start_server.ps1 -ShowConfig        # 显示配置
   .\scripts\windows\start_server.ps1 -Help              # 帮助信息
   ```

2. **`scripts/show_config.py`** - 显示当前配置
   ```powershell
   python scripts\show_config.py
   ```

3. **`scripts/validate_config.py`** - 验证配置
   ```powershell
   python scripts\validate_config.py
   ```

### 5. 配置辅助工具 (`app/utils/config_helper.py`)

**新增函数：**
- `get_server_config()` - 获取服务器配置
- `get_server_url()` - 获取服务器 URL
- `get_api_url()` - 获取 API URL
- `print_config_info()` - 打印配置信息

### 6. 文档

**新增文档：**
- `docs/配置说明.md` - 详细的配置文档
- `docs/配置迁移指南.md` - 版本升级指南
- `CHANGELOG_配置系统.md` - 本文件

**更新文档：**
- `README.md` - 添加配置相关说明

### 7. 测试

**新增测试：**
- `tests/test_config.py` - 配置系统单元测试

### 8. 依赖更新

**新增依赖：**
- `pyyaml` - YAML 配置文件支持

## 使用方法

### 快速开始

1. **复制配置模板**
   ```powershell
   copy .env.example .env
   ```

2. **编辑配置**
   ```powershell
   notepad .env
   ```

3. **启动服务**
   ```powershell
   .\scripts\windows\start_server.ps1
   ```

### 配置示例

#### 使用 .env 文件（推荐）

```env
# 服务器配置
SERVER_HOST=0.0.0.0
SERVER_PORT=8568

# 安全配置
JWT_SECRET_KEY=your_secret_key_here

# 日志配置
LOG_LEVEL=INFO
```

#### 使用 config.yaml 文件

```yaml
server:
  host: "0.0.0.0"
  port: 8568

security:
  jwt_secret_key: "your_secret_key_here"

logging:
  level: "INFO"
```

#### 使用环境变量

```powershell
$env:SERVER_HOST = "127.0.0.1"
$env:SERVER_PORT = "9000"
```

## 向后兼容性

### 旧版环境变量仍然支持

| 旧变量 | 新变量 | 状态 |
|--------|--------|------|
| `PRINT_PROXY_HOST` | `SERVER_HOST` | ✓ 兼容 |
| `PRINT_PROXY_PORT` | `SERVER_PORT` | ✓ 兼容 |
| `PRINT_PROXY_RELOAD` | `SERVER_RELOAD` | ✓ 兼容 |

### 旧的启动方式仍然有效

```powershell
# 仍然可以使用
$env:PRINT_PROXY_HOST = "0.0.0.0"
$env:PRINT_PROXY_PORT = "8568"
uvicorn app.main:app --reload
```

## 配置优先级

从高到低：
1. **环境变量** - 最高优先级
2. **.env 文件** - 中等优先级
3. **config.yaml 文件** - 较低优先级
4. **默认值** - 最低优先级

## 迁移指南

### 从旧版本升级

如果您之前使用环境变量配置：

```powershell
# 旧方式
$env:PRINT_PROXY_HOST = "0.0.0.0"
$env:PRINT_PROXY_PORT = "8000"
```

迁移到新方式：

```powershell
# 方式 1：创建 .env 文件（推荐）
copy .env.example .env
# 编辑 .env 文件，设置 SERVER_HOST 和 SERVER_PORT

# 方式 2：继续使用环境变量（兼容）
$env:SERVER_HOST = "0.0.0.0"
$env:SERVER_PORT = "8000"

# 方式 3：使用启动脚本参数
.\scripts\windows\start_server.ps1 -Host "0.0.0.0" -Port 8000
```

详细迁移指南请参考：`docs/配置迁移指南.md`

## 验证配置

### 查看当前配置

```powershell
python scripts\show_config.py
```

### 验证配置是否正确

```powershell
python scripts\validate_config.py
```

### 使用启动脚本查看配置

```powershell
.\scripts\windows\start_server.ps1 -ShowConfig
```

## 常见问题

### Q: 配置不生效怎么办？

A: 检查配置优先级，环境变量会覆盖配置文件。运行 `python scripts\show_config.py` 查看实际使用的配置。

### Q: 端口被占用怎么办？

A: 修改配置文件中的 `SERVER_PORT`，或使用 `.\scripts\windows\start_server.ps1 -Port 9000` 指定其他端口。

### Q: 如何在生产环境使用？

A: 
1. 复制 `.env.example` 为 `.env`
2. 修改 `JWT_SECRET_KEY` 为强随机密钥
3. 设置 `LOG_LEVEL=INFO`
4. 设置 `SERVER_RELOAD=false`

### Q: EXE 版本如何配置？

A: 将 `.env` 或 `config.yaml` 文件放在 `PrintProxy.exe` 同目录下即可。

## 文件清单

### 新增文件
- `.env.example` - 环境变量配置模板
- `config.yaml.example` - YAML 配置模板
- `scripts/windows/start_server.ps1` - 快速启动脚本
- `scripts/show_config.py` - 显示配置工具
- `scripts/validate_config.py` - 配置验证工具
- `app/utils/config_helper.py` - 配置辅助函数
- `tests/test_config.py` - 配置测试
- `docs/配置说明.md` - 配置文档
- `docs/配置迁移指南.md` - 迁移指南
- `CHANGELOG_配置系统.md` - 本文件

### 修改文件
- `app/core/config.py` - 扩展配置系统
- `scripts/windows/run_app.py` - 支持配置系统
- `requirements.txt` - 添加 pyyaml 依赖
- `README.md` - 更新文档
- `.gitignore` - 忽略配置文件

## 技术细节

### 配置加载流程

1. 加载默认值（Settings 类定义）
2. 读取 config.yaml（如果存在）
3. 读取 .env 文件（如果存在）
4. 读取环境变量
5. 处理向后兼容的旧环境变量
6. 合并所有配置（按优先级）

### 配置缓存

配置使用 `@lru_cache` 装饰器缓存，确保配置只加载一次，提高性能。

### 安全考虑

- JWT 密钥默认值会触发警告
- 配置验证脚本会检查常见安全问题
- 敏感信息（如密钥）在显示时会被隐藏

## 后续计划

- [ ] 支持配置热重载
- [ ] 添加 Web 界面配置管理
- [ ] 支持更多配置格式（TOML、JSON）
- [ ] 配置加密支持
- [ ] 配置版本管理

## 反馈

如有问题或建议，请查看文档或运行验证脚本：
```powershell
python scripts\validate_config.py
```
