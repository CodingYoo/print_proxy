# PrintProxy 安装使用说明

## 版本信息
- 版本：1.0.0
- 类型：静默后台运行，开机自启动
- 更新日期：2025-10-15

## 主要特点

✅ **完全静默运行** - 无黑窗口，无控制台，完全后台运行  
✅ **零配置安装** - 无需输入密码，无需配置服务  
✅ **开机自启动** - 系统启动后自动运行  
✅ **完整权限** - 以当前用户身份运行，完整打印机访问权限  
✅ **单文件部署** - EXE 包含所有依赖，无需 Python 环境

## 快速安装

### 方式 1：使用安装器（推荐）

1. 右键点击 `scripts\windows\PrintProxySetup_1.0.0.exe`
2. 选择"以管理员身份运行"
3. 点击 Next → 选择安装目录 → 点击 Install
4. 安装完成后选择是否立即启动
5. 完成！

**安装后：**
- 程序将自动添加到开机启动
- 每次登录系统后自动在后台运行
- 访问 http://localhost:8000/docs 查看 API 文档

### 方式 2：直接运行 EXE

如果不想使用安装器，可以直接运行：

```bash
# 复制 EXE 到任意目录
copy dist\PrintProxy.exe C:\YourPath\

# 双击或命令行运行
C:\YourPath\PrintProxy.exe
```

**手动设置开机自启动：**
1. Win+R 打开运行对话框
2. 输入 `shell:startup` 打开启动文件夹
3. 创建 PrintProxy.exe 的快捷方式到该文件夹

## 使用说明

### 访问服务

服务启动后，在浏览器中访问：

- **API 文档**：http://localhost:8000/docs
- **API 端点**：http://localhost:8000

### 手动控制

**启动程序：**
- 桌面快捷方式：Print Proxy
- 开始菜单：PrintProxy → Print Proxy
- 直接运行：`C:\Program Files\PrintProxy\PrintProxy.exe`

**停止程序：**
```powershell
# 方法 1：快捷方式
开始菜单 → PrintProxy → Stop Print Proxy

# 方法 2：命令行
taskkill /F /IM PrintProxy.exe

# 方法 3：任务管理器
右键 PrintProxy.exe → 结束任务
```

**检查运行状态：**
```powershell
# 检查进程
tasklist | findstr PrintProxy

# 检查端口
netstat -ano | findstr :8000

# 测试 HTTP
curl http://localhost:8000/docs
```

### 查看日志

日志文件位置：

```
C:\Program Files\PrintProxy\logs\
├── printproxy_YYYYMMDD.log  # 主程序日志
└── uvicorn_YYYYMMDD.log     # Web 服务日志
```

查看最新日志：
```powershell
Get-Content "C:\Program Files\PrintProxy\logs\printproxy_*.log" -Tail 50
```

## 环境变量配置（可选）

可以通过环境变量自定义配置：

```powershell
# 修改监听地址
$env:PRINT_PROXY_HOST = "127.0.0.1"

# 修改端口
$env:PRINT_PROXY_PORT = "9000"

# 然后重启程序
```

## 卸载

### 使用安装器卸载
1. 运行安装器或控制面板卸载
2. 或直接运行 `C:\Program Files\PrintProxy\Uninstall.exe`

### 手动卸载
1. 停止进程：`taskkill /F /IM PrintProxy.exe`
2. 删除注册表启动项：
   ```powershell
   Remove-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "Print Proxy"
   ```
3. 删除程序目录：`C:\Program Files\PrintProxy\`
4. 删除快捷方式

## 常见问题

### Q: 程序启动后没有窗口，怎么知道是否在运行？

A: 这是正常的静默模式。检查方法：
   - 任务管理器查看 PrintProxy.exe 进程
   - 浏览器访问 http://localhost:8000/docs
   - 命令行：`netstat -ano | findstr :8000`

### Q: 开机后服务没有自动启动？

A: 检查注册表启动项：
   ```powershell
   Get-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "Print Proxy"
   ```
   如果不存在，重新运行安装器。

### Q: 端口 8000 被占用怎么办？

A: 设置环境变量更改端口：
   ```powershell
   [System.Environment]::SetEnvironmentVariable("PRINT_PROXY_PORT", "9000", "Machine")
   ```
   然后重启程序。

### Q: 打印机权限问题？

A: 程序以当前登录用户身份运行，自动拥有该用户的打印机权限。如果无法访问打印机：
   - 确保当前用户有打印机访问权限
   - 检查打印机驱动是否正常安装

### Q: 如何禁用开机自启动但保留程序？

A: 任务管理器 → 启动 → 禁用 Print Proxy

### Q: 查看详细错误信息？

A: 查看日志文件 `C:\Program Files\PrintProxy\logs\`

## 技术说明

### 实现方式
- **静默运行**：PyInstaller `--noconsole` 模式，stdout/stderr 重定向到 `/dev/null`
- **自启动**：注册表 `HKLM\Software\Microsoft\Windows\CurrentVersion\Run`
- **日志系统**：文件日志，按日期轮转
- **运行方式**：普通应用程序（非 Windows 服务）
- **权限**：当前用户权限

### 文件清单
```
C:\Program Files\PrintProxy\
├── PrintProxy.exe          # 主程序（54MB 单文件）
├── logs\                   # 日志目录
│   ├── printproxy_*.log
│   └── uvicorn_*.log
└── Uninstall.exe          # 卸载程序
```

### 构建信息
- Python: 3.11.13
- PyInstaller: 5.13.0
- 模式: --noconsole --onefile
- 包含: FastAPI, Uvicorn, pywin32, SQLAlchemy, Pillow

## API 使用示例

### 同步打印机列表
```python
import requests
response = requests.get('http://localhost:8000/api/printers/sync')
print(response.json())
```

### 设置默认打印机
```python
response = requests.post('http://localhost:8000/api/printers/1/set-default')
print(response.json())
```

### 创建打印任务
```python
files = {'file': open('document.pdf', 'rb')}
data = {'printer_id': 1, 'copies': 2}
response = requests.post('http://localhost:8000/api/print-jobs', files=files, data=data)
print(response.json())
```

更多 API 信息请访问：http://localhost:8000/docs

## 联系与支持

如有问题，请查看日志文件或提交 Issue。

---

**版权所有 © 2025 PrintProxy**
