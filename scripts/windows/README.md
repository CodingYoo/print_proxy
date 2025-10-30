# Windows 打包脚本使用指南

## 📦 快速开始

### 方法 1：一键打包（推荐）

双击运行项目根目录的 `build.bat` 文件，或在命令行执行：

```cmd
build.bat
```

### 方法 2：使用 PowerShell 脚本

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1
```

## 🛠️ 可用脚本

### 1. build_exe.ps1 - 打包脚本

**功能**：将 Print Proxy 打包为单文件 Windows EXE

**使用方法**：

```powershell
# 标准打包
powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1

# 清理虚拟环境后重新打包
powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1 -Clean

# 跳过测试快速打包
powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1 -SkipTests

# 组合参数
powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1 -Clean -SkipTests
```

**参数说明**：
- `-Clean`: 删除旧的虚拟环境并重新创建
- `-SkipTests`: 跳过单元测试，加快打包速度

**输出**：
- 生成的 EXE 文件位于：`dist\PrintProxy.exe`
- 文件大小：约 50-55 MB
- 打包时间：2-5 分钟（取决于网络速度）

### 2. clean.ps1 - 清理脚本

**功能**：清理构建文件和缓存

**使用方法**：

```powershell
# 清理构建文件和缓存（保留虚拟环境）
powershell -ExecutionPolicy Bypass -File scripts\windows\clean.ps1

# 清理所有内容（包括虚拟环境）
powershell -ExecutionPolicy Bypass -File scripts\windows\clean.ps1 -All
```

**清理内容**：
- `build/` - 构建临时文件
- `dist/` - 输出目录
- `__pycache__/` - Python 缓存
- `.pytest_cache/` - 测试缓存
- `PrintProxy.spec` - PyInstaller 配置
- `.venv_pack/` - 虚拟环境（使用 -All 参数时）

### 3. test_exe.ps1 - 测试脚本

**功能**：启动并测试打包的 EXE 文件

**使用方法**：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\test_exe.ps1
```

**测试内容**：
1. 检查 EXE 文件是否存在
2. 停止旧的运行进程
3. 启动 PrintProxy.exe
4. 验证服务是否正常响应
5. 显示访问地址和默认账号

### 4. start_server.ps1 - 开发服务器

**功能**：启动开发服务器（非打包版本）

**使用方法**：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\start_server.ps1
```

## 📋 完整打包流程

### 首次打包

```powershell
# 1. 清理旧文件（可选）
powershell -ExecutionPolicy Bypass -File scripts\windows\clean.ps1 -All

# 2. 执行打包
powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1

# 3. 测试 EXE
powershell -ExecutionPolicy Bypass -File scripts\windows\test_exe.ps1
```

### 快速重新打包

```powershell
# 使用现有虚拟环境快速打包
powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1 -SkipTests
```

### 完全重新打包

```powershell
# 清理所有内容后重新打包
powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1 -Clean
```

## 🎯 打包后的使用

### 运行 EXE

直接双击 `dist\PrintProxy.exe` 或命令行运行：

```cmd
dist\PrintProxy.exe
```

### 访问服务

- **API 根路径**: http://localhost:8568/api
- **管理界面**: http://localhost:8568/admin
- **API 文档**: http://localhost:8568/docs

### 默认账号

- **用户名**: `admin`
- **密码**: `admin123`

### 数据位置

- **数据库**: `%APPDATA%\PrintProxy\print_proxy.db`
- **日志**: `%APPDATA%\PrintProxy\logs\`
- **配置**: EXE 同目录的 `.env` 或 `config.yaml`

## 🔧 故障排查

### 问题 1：打包失败 - Python 未找到

**解决方案**：
```powershell
# 检查 Python 版本
python --version

# 应该显示 Python 3.11.x 或更高版本
```

### 问题 2：打包失败 - 依赖安装失败

**解决方案**：
```powershell
# 清理虚拟环境后重试
powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1 -Clean
```

### 问题 3：EXE 启动失败

**解决方案**：
1. 查看日志：`%APPDATA%\PrintProxy\logs\error.log`
2. 检查端口占用：`netstat -ano | findstr :8568`
3. 以管理员身份运行

### 问题 4：打包速度慢

**解决方案**：
```powershell
# 跳过测试加快速度
powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1 -SkipTests
```

### 问题 5：磁盘空间不足

**解决方案**：
```powershell
# 清理旧文件
powershell -ExecutionPolicy Bypass -File scripts\windows\clean.ps1 -All
```

## 📊 性能指标

| 项目 | 数值 |
|-----|------|
| EXE 文件大小 | ~51 MB |
| 首次打包时间 | 3-5 分钟 |
| 增量打包时间 | 2-3 分钟 |
| 虚拟环境大小 | ~300 MB |
| 启动时间 | 2-5 秒 |
| 内存占用 | ~80-120 MB |

## 🚀 高级用法

### 自定义打包参数

编辑 `build_exe.ps1` 中的 `$args` 数组：

```powershell
$args = @(
    '--clean',
    '--noconfirm',
    '--onefile',              # 单文件模式
    '--noconsole',            # 无控制台窗口
    '--name', 'PrintProxy',   # EXE 名称
    # 添加自定义参数...
)
```

### 添加图标

```powershell
'--icon', 'path\to\icon.ico',
```

### 修改版本信息

```powershell
'--version-file', 'version.txt',
```

### 打包为目录模式（更快启动）

将 `--onefile` 改为 `--onedir`

## 📝 注意事项

1. **首次打包**需要下载依赖，确保网络连接正常
2. **虚拟环境**会缓存在 `.venv_pack` 目录，可重复使用
3. **打包过程**会占用较多 CPU 和内存，建议关闭其他程序
4. **EXE 文件**包含所有依赖，可以在没有 Python 的机器上运行
5. **杀毒软件**可能误报，需要添加信任

## 🔗 相关文档

- [配置说明](../../docs/配置说明.md)
- [API 文档](../../docs/API文档.md)
- [快速测试指南](../../docs/快速测试指南.md)
- [打印质量优化说明](../../docs/打印质量优化说明.md)

## 💡 提示

- 使用 `build.bat` 最简单，双击即可
- 开发时使用 `start_server.ps1` 而不是打包
- 定期使用 `clean.ps1` 清理缓存
- 打包前先运行测试确保代码正常

---

**更新日期**: 2025-10-25  
**版本**: 2.0
