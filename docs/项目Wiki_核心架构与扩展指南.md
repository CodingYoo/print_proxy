# 打印代理服务 - 核心架构与扩展指南

## 📋 目录

1. [项目架构概览](#项目架构概览)
2. [核心控制逻辑](#核心控制逻辑)
3. [底层API交互机制](#底层api交互机制)
4. [数据流转过程](#数据流转过程)
5. [扩展功能指南](#扩展功能指南)
6. [技术栈详解](#技术栈详解)

---

## 项目架构概览

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      HTTP API Layer                          │
│  (FastAPI Routes: /api/jobs, /api/printers, /api/auth)      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ job_service  │  │printer_service│  │ user_service │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Task Queue Layer                            │
│              (JobQueueManager - 优先级队列)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Windows Print API Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  win32print  │  │   win32api   │  │  win32com    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 核心模块说明

| 模块 | 路径 | 职责 |
|------|------|------|
| **API路由** | `app/api/routes/` | 接收HTTP请求，参数验证，权限控制 |
| **业务服务** | `app/services/` | 核心业务逻辑，打印任务处理 |
| **任务队列** | `app/tasks/manager.py` | 异步任务调度，优先级管理 |
| **数据模型** | `app/models/` | SQLAlchemy ORM模型 |
| **配置管理** | `app/core/config.py` | 多源配置加载（YAML/ENV） |
| **安全认证** | `app/core/security.py` | JWT + API Key双认证 |

---

## 核心控制逻辑

### 1. 打印任务生命周期

```
创建任务 → 入队列 → 等待调度 → 处理中 → 完成/失败/取消
  ↓         ↓         ↓          ↓         ↓
queued  → queued → processing → completed/failed/cancelled
```

#### 关键代码位置：`app/services/job_service.py`

**任务创建流程**：

```python
# 1. 接收API请求 (app/api/routes/jobs.py)
@router.post("/", response_model=PrintJobRead)
def create_job(job_in: PrintJobCreate, db: Session, current_user: User):
    job = job_service.create_print_job(db, job_in, owner_id=current_user.id)
    return PrintJobRead.from_orm(job)

# 2. 业务逻辑处理 (app/services/job_service.py)
def create_print_job(db: Session, job_in: PrintJobCreate, owner_id: int):
    # 2.1 解码Base64内容
    content = base64.b64decode(job_in.content_base64)
    
    # 2.2 验证文件类型
    if job_in.file_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(400, "文件类型不受支持")
    
    # 2.3 选择打印机（指定或默认）
    printer = db.query(Printer).filter(...).first()
    
    # 2.4 创建数据库记录
    job = PrintJob(title=..., content=content, ...)
    db.add(job)
    db.commit()
    
    # 2.5 加入任务队列
    job_queue.enqueue(job.id, job.priority)
    return job
```

### 2. 任务队列调度机制

**核心文件**：`app/tasks/manager.py`

```python
class JobQueueManager:
    def __init__(self):
        self._queue = PriorityQueue()  # 优先级队列
        self._processor = None          # 处理函数
        self._worker_thread = None      # 后台工作线程
        self._cancelled = set()         # 取消任务集合
    
    def enqueue(self, job_id: int, priority: int):
        # 优先级越小越先执行
        self._queue.put((priority, time.time(), job_id))
    
    def _worker_loop(self):
        while self._running:
            priority, _, job_id = self._queue.get(timeout=1)
            if job_id in self._cancelled:
                continue
            self._processor(job_id)  # 调用 process_print_job
```

**特点**：
- ✅ 基于优先级的任务调度（数字越小优先级越高）
- ✅ 单线程顺序执行，避免打印冲突
- ✅ 支持任务取消（通过cancelled集合）
- ✅ 守护线程，随主进程退出

---
## 底层API交互机制

### Windows打印API调用层次

项目使用 **pywin32** 库封装Windows打印API，支持多种打印方式：

#### 1. 打印机管理 API

**文件**：`app/services/printer_service.py`

```python
import win32print

# 枚举系统打印机
def fetch_system_printers() -> List[str]:
    flags = 2  # PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS
    printers = win32print.EnumPrinters(flags)
    return [printer[2] for printer in printers]

# 获取默认打印机
def get_default_system_printer() -> str:
    return win32print.GetDefaultPrinter()

# 设置默认打印机
def set_default_system_printer(printer_name: str):
    win32print.SetDefaultPrinter(printer_name)
```

**底层Windows API映射**：
- `EnumPrinters` → `EnumPrintersW` (Win32 API)
- `GetDefaultPrinter` → `GetDefaultPrinterW`
- `SetDefaultPrinter` → `SetDefaultPrinterW`

#### 2. 打印任务执行 API

**文件**：`app/services/job_service.py`

根据文件类型选择不同的打印方式：

##### 方式1：RAW数据打印（文本文件）

```python
def _send_to_printer_raw(content: bytes, printer_name: str, copies: int):
    handle = win32print.OpenPrinter(printer_name)
    try:
        job_info = (title, None, "RAW")
        win32print.StartDocPrinter(handle, 1, job_info)
        for _ in range(copies):
            win32print.StartPagePrinter(handle)
            win32print.WritePrinter(handle, content)
            win32print.EndPagePrinter(handle)
        win32print.EndDocPrinter(handle)
    finally:
        win32print.ClosePrinter(handle)
```

**底层调用链**：
```
OpenPrinter → StartDocPrinter → StartPagePrinter → WritePrinter → EndPagePrinter → EndDocPrinter → ClosePrinter
```

##### 方式2：GDI图像打印（PNG/JPG/BMP）

```python
def _print_image_with_gdi(content: bytes, printer_name: str, copies: int):
    # 1. 加载图像
    image = Image.open(io.BytesIO(content)).convert("RGB")
    
    # 2. 创建打印机设备上下文
    hdc = win32ui.CreateDC()
    hdc.CreatePrinterDC(printer_name)
    
    # 3. 获取打印机可打印区域
    printable_width = hdc.GetDeviceCaps(win32con.HORZRES)
    printable_height = hdc.GetDeviceCaps(win32con.VERTRES)
    
    # 4. 缩放图像适应纸张
    scale_ratio = min(printable_width/image.width, printable_height/image.height)
    image = image.resize((scaled_width, scaled_height), Image.LANCZOS)
    
    # 5. 转换为DIB格式并打印
    dib = ImageWin.Dib(image)
    hdc.StartDoc(title)
    for _ in range(copies):
        hdc.StartPage()
        dib.draw(hdc.GetHandleOutput(), (left, top, right, bottom))
        hdc.EndPage()
    hdc.EndDoc()
```

**关键技术点**：
- 使用 `win32ui` 创建设备上下文（Device Context）
- 通过 `GetDeviceCaps` 获取打印机物理参数
- 使用 `ImageWin.Dib` 将PIL图像转换为Windows DIB格式
- 自动缩放图像适应纸张尺寸

##### 方式3：Shell打印（PDF文件）

```python
def _print_pdf_file(path: str, printer_name: str, copies: int):
    for _ in range(copies):
        win32api.ShellExecute(
            0,                    # hwnd
            "printto",            # 操作
            path,                 # 文件路径
            f'"{printer_name}"',  # 参数
            ".",                  # 工作目录
            0                     # 显示方式
        )
```

**原理**：调用Windows Shell关联的PDF阅读器（如Adobe Reader）进行打印

##### 方式4：COM自动化（Word/Excel）

```python
def _print_with_word(path: str, printer_name: str, copies: int):
    pythoncom.CoInitialize()  # 初始化COM
    word = win32com_client.Dispatch("Word.Application")
    word.Visible = False
    doc = word.Documents.Open(path, ReadOnly=True)
    
    # 设置打印机并打印
    word.ActivePrinter = printer_name
    doc.PrintOut(Background=False, Copies=copies)
    
    doc.Close(False)
    word.Quit()
    pythoncom.CoUninitialize()
```

**支持的Office文档**：
- Word: `.doc`, `.docx`
- Excel: `.xls`, `.xlsx`

---
## 数据流转过程

### 完整打印流程时序图

```
客户端                API层              服务层              队列层              打印层
  │                   │                  │                   │                   │
  ├─POST /api/jobs───>│                  │                   │                   │
  │                   ├─验证JWT/APIKey──>│                   │                   │
  │                   │                  │                   │                   │
  │                   │<─────────────────┤                   │                   │
  │                   │                  │                   │                   │
  │                   ├─create_print_job>│                   │                   │
  │                   │                  ├─解码Base64        │                   │
  │                   │                  ├─验证文件类型      │                   │
  │                   │                  ├─选择打印机        │                   │
  │                   │                  ├─保存到数据库      │                   │
  │                   │                  │                   │                   │
  │                   │                  ├─enqueue(job_id)──>│                   │
  │                   │                  │                   ├─加入优先级队列    │
  │                   │                  │                   │                   │
  │<──返回job_id──────┤<─────────────────┤                   │                   │
  │                   │                  │                   │                   │
  │                   │                  │                   ├─worker_loop       │
  │                   │                  │                   ├─取出任务          │
  │                   │                  │                   │                   │
  │                   │                  │<─process_print_job┤                   │
  │                   │                  ├─更新状态:processing                   │
  │                   │                  │                   │                   │
  │                   │                  ├─_send_to_printer─────────────────────>│
  │                   │                  │                   │                   ├─调用win32print
  │                   │                  │                   │                   ├─执行打印
  │                   │                  │                   │                   │
  │                   │                  │<──────────────────────────────────────┤
  │                   │                  ├─更新状态:completed                    │
  │                   │                  ├─记录日志          │                   │
  │                   │                  │                   │                   │
  ├─GET /api/jobs/{id}/status──────────>│                   │                   │
  │<──返回状态────────┤<─────────────────┤                   │                   │
```

### 关键数据结构

#### 1. PrintJob 模型

```python
class PrintJob(Base):
    id: int                    # 任务ID
    title: str                 # 任务标题
    status: str                # queued/processing/completed/failed/cancelled
    priority: int              # 优先级（1-10，越小越优先）
    copies: int                # 打印份数
    media_size: str            # 纸张大小（A4/A3/Letter等）
    color_mode: str            # 颜色模式（color/mono）
    duplex: str                # 双面打印（none/long-edge/short-edge）
    file_type: str             # 文件类型（pdf/png/jpg/txt/doc/xls等）
    content: bytes             # 文件二进制内容
    owner_id: int              # 所有者用户ID
    printer_id: int            # 打印机ID
    error_message: str         # 错误信息
    created_at: datetime       # 创建时间
    updated_at: datetime       # 更新时间
```

#### 2. Printer 模型

```python
class Printer(Base):
    id: int                    # 打印机ID
    name: str                  # 打印机名称（系统名称）
    is_default: bool           # 是否默认打印机
    status: str                # online/offline/unknown
    location: str              # 物理位置
    created_at: datetime       # 创建时间
```

---
## 扩展功能指南

### 🚀 可扩展的打印机控制功能

基于现有架构，以下是可以轻松添加的功能：

#### 1. 打印机状态实时监控

**需求**：实时获取打印机状态（纸张、墨盒、错误等）

**实现方案**：

```python
# 在 app/services/printer_service.py 添加

def get_printer_status_detail(printer_name: str) -> dict:
    """获取打印机详细状态"""
    import win32print
    import pywintypes
    
    try:
        handle = win32print.OpenPrinter(printer_name)
        info = win32print.GetPrinter(handle, 2)
        
        status_code = info.get('Status', 0)
        attributes = info.get('Attributes', 0)
        
        status_detail = {
            'name': printer_name,
            'status': _parse_printer_status(status_code),
            'is_online': not (status_code & 0x00000400),  # PRINTER_STATUS_OFFLINE
            'is_paused': bool(status_code & 0x00000001),  # PRINTER_STATUS_PAUSED
            'is_error': bool(status_code & 0x00000002),   # PRINTER_STATUS_ERROR
            'is_paper_jam': bool(status_code & 0x00000008),  # PRINTER_STATUS_PAPER_JAM
            'is_paper_out': bool(status_code & 0x00000010),  # PRINTER_STATUS_PAPER_OUT
            'is_toner_low': bool(status_code & 0x00040000),  # PRINTER_STATUS_TONER_LOW
            'jobs_count': info.get('cJobs', 0),
            'port': info.get('pPortName', ''),
            'driver': info.get('pDriverName', ''),
        }
        
        win32print.ClosePrinter(handle)
        return status_detail
    except Exception as e:
        return {'error': str(e)}

def _parse_printer_status(status_code: int) -> str:
    """解析打印机状态码"""
    if status_code == 0:
        return 'ready'
    if status_code & 0x00000001:
        return 'paused'
    if status_code & 0x00000002:
        return 'error'
    if status_code & 0x00000008:
        return 'paper_jam'
    if status_code & 0x00000010:
        return 'paper_out'
    if status_code & 0x00000400:
        return 'offline'
    return 'unknown'
```

**API接口**：

```python
# 在 app/api/routes/printers.py 添加

@router.get("/{printer_id}/status", response_model=PrinterStatusDetail)
def get_printer_status(
    printer_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    printer = db.query(Printer).filter(Printer.id == printer_id).first()
    if not printer:
        raise HTTPException(404, "打印机不存在")
    
    status = printer_service.get_printer_status_detail(printer.name)
    return status
```

#### 2. 打印任务暂停/恢复

**需求**：支持暂停和恢复打印队列中的任务

**实现方案**：

```python
# 在 app/tasks/manager.py 扩展

class JobQueueManager:
    def __init__(self):
        # ... 现有代码 ...
        self._paused_jobs: dict[int, tuple] = {}  # 暂停的任务
    
    def pause_job(self, job_id: int) -> bool:
        """暂停任务（从队列移除但保留状态）"""
        # 标记为取消，但保存到暂停列表
        self._cancelled.add(job_id)
        # 实际实现需要遍历队列找到任务
        return True
    
    def resume_job(self, job_id: int, priority: int) -> bool:
        """恢复任务"""
        if job_id in self._paused_jobs:
            self.enqueue(job_id, priority)
            del self._paused_jobs[job_id]
            return True
        return False
```

**API接口**：

```python
# 在 app/api/routes/jobs.py 添加

@router.post("/{job_id}/pause", response_model=PrintJobRead)
def pause_job(job_id: int, db: Session = Depends(deps.get_db)):
    job = job_service.get_print_job(db, job_id)
    if job.status != "queued":
        raise HTTPException(400, "只能暂停排队中的任务")
    
    job_queue.pause_job(job.id)
    job.status = "paused"
    db.commit()
    return PrintJobRead.from_orm(job)

@router.post("/{job_id}/resume", response_model=PrintJobRead)
def resume_job(job_id: int, db: Session = Depends(deps.get_db)):
    job = job_service.get_print_job(db, job_id)
    if job.status != "paused":
        raise HTTPException(400, "只能恢复暂停的任务")
    
    job_queue.resume_job(job.id, job.priority)
    job.status = "queued"
    db.commit()
    return PrintJobRead.from_orm(job)
```

#### 3. 打印机配置管理

**需求**：设置打印机默认参数（纸张、颜色、双面等）

**实现方案**：

```python
# 在 app/services/printer_service.py 添加

def get_printer_capabilities(printer_name: str) -> dict:
    """获取打印机支持的功能"""
    import win32print
    
    handle = win32print.OpenPrinter(printer_name)
    try:
        # 获取打印机驱动信息
        driver_info = win32print.GetPrinter(handle, 2)
        
        # 获取设备能力
        capabilities = {
            'supported_paper_sizes': _get_supported_paper_sizes(handle),
            'supports_color': _check_color_support(handle),
            'supports_duplex': _check_duplex_support(handle),
            'max_copies': 999,
            'resolutions': _get_supported_resolutions(handle),
        }
        
        return capabilities
    finally:
        win32print.ClosePrinter(handle)

def set_printer_defaults(printer_name: str, defaults: dict):
    """设置打印机默认配置"""
    import win32print
    import pywintypes
    
    handle = win32print.OpenPrinter(printer_name)
    try:
        # 获取当前配置
        devmode = win32print.GetPrinter(handle, 2)['pDevMode']
        
        # 修改配置
        if 'paper_size' in defaults:
            devmode.PaperSize = defaults['paper_size']
        if 'orientation' in defaults:
            devmode.Orientation = defaults['orientation']
        if 'color' in defaults:
            devmode.Color = defaults['color']
        if 'duplex' in defaults:
            devmode.Duplex = defaults['duplex']
        
        # 应用配置
        win32print.SetPrinter(handle, 2, {'pDevMode': devmode}, 0)
    finally:
        win32print.ClosePrinter(handle)
```

#### 4. 打印预览增强

**需求**：支持多页预览、缩略图生成

**实现方案**：

```python
# 在 app/services/job_service.py 扩展

def generate_preview_multipage(job: PrintJob, max_pages: int = 5) -> List[bytes]:
    """生成多页预览"""
    if job.file_type.lower() == "pdf":
        import fitz
        doc = fitz.open(stream=job.content, filetype="pdf")
        
        previews = []
        for page_num in range(min(doc.page_count, max_pages)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            previews.append(pix.tobytes("png"))
        
        return previews
    
    # 其他类型返回单页
    return [generate_preview(job)]

def generate_thumbnail(job: PrintJob, size: tuple = (200, 200)) -> bytes:
    """生成缩略图"""
    preview = generate_preview(job)
    
    from PIL import Image
    import io
    
    img = Image.open(io.BytesIO(preview))
    img.thumbnail(size, Image.LANCZOS)
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()
```

#### 5. 打印统计与报表

**需求**：统计打印量、成本、用户使用情况

**实现方案**：

```python
# 新建 app/services/statistics_service.py

from sqlalchemy import func
from datetime import datetime, timedelta

def get_print_statistics(db: Session, start_date: datetime, end_date: datetime) -> dict:
    """获取打印统计"""
    
    # 总任务数
    total_jobs = db.query(func.count(PrintJob.id)).filter(
        PrintJob.created_at.between(start_date, end_date)
    ).scalar()
    
    # 成功/失败任务数
    completed = db.query(func.count(PrintJob.id)).filter(
        PrintJob.status == 'completed',
        PrintJob.created_at.between(start_date, end_date)
    ).scalar()
    
    failed = db.query(func.count(PrintJob.id)).filter(
        PrintJob.status == 'failed',
        PrintJob.created_at.between(start_date, end_date)
    ).scalar()
    
    # 按用户统计
    user_stats = db.query(
        User.username,
        func.count(PrintJob.id).label('job_count'),
        func.sum(PrintJob.copies).label('total_copies')
    ).join(PrintJob).filter(
        PrintJob.created_at.between(start_date, end_date)
    ).group_by(User.username).all()
    
    # 按打印机统计
    printer_stats = db.query(
        Printer.name,
        func.count(PrintJob.id).label('job_count')
    ).join(PrintJob).filter(
        PrintJob.created_at.between(start_date, end_date)
    ).group_by(Printer.name).all()
    
    return {
        'total_jobs': total_jobs,
        'completed': completed,
        'failed': failed,
        'success_rate': completed / total_jobs if total_jobs > 0 else 0,
        'user_statistics': [{'username': u, 'jobs': j, 'copies': c} for u, j, c in user_stats],
        'printer_statistics': [{'printer': p, 'jobs': j} for p, j in printer_stats],
    }
```

---
#### 6. 打印机驱动管理

**需求**：安装、更新、卸载打印机驱动

**实现方案**：

```python
# 在 app/services/printer_service.py 添加

def install_printer_driver(driver_path: str, driver_name: str) -> bool:
    """安装打印机驱动"""
    import win32print
    
    driver_info = {
        'Name': driver_name,
        'Environment': 'Windows x64',
        'DriverPath': driver_path,
        'DataFile': driver_path,
        'ConfigFile': driver_path,
    }
    
    try:
        win32print.AddPrinterDriver(None, 3, driver_info)
        return True
    except Exception as e:
        raise RuntimeError(f"驱动安装失败: {e}")

def add_network_printer(printer_name: str, port_name: str, driver_name: str) -> bool:
    """添加网络打印机"""
    import win32print
    
    printer_info = {
        'pPrinterName': printer_name,
        'pPortName': port_name,
        'pDriverName': driver_name,
        'pPrintProcessor': 'winprint',
        'pDatatype': 'RAW',
    }
    
    try:
        win32print.AddPrinter(None, 2, printer_info)
        return True
    except Exception as e:
        raise RuntimeError(f"添加打印机失败: {e}")

def remove_printer(printer_name: str) -> bool:
    """删除打印机"""
    import win32print
    
    try:
        handle = win32print.OpenPrinter(printer_name)
        win32print.DeletePrinter(handle)
        win32print.ClosePrinter(handle)
        return True
    except Exception as e:
        raise RuntimeError(f"删除打印机失败: {e}")
```

#### 7. 打印任务批量操作

**需求**：批量提交、批量取消、批量重试

**实现方案**：

```python
# 在 app/services/job_service.py 添加

def create_batch_print_jobs(
    db: Session, 
    jobs_in: List[PrintJobCreate], 
    owner_id: int
) -> List[PrintJob]:
    """批量创建打印任务"""
    jobs = []
    
    for job_in in jobs_in:
        try:
            job = create_print_job(db, job_in, owner_id)
            jobs.append(job)
        except Exception as e:
            # 记录错误但继续处理其他任务
            logger.error(f"批量任务创建失败: {e}")
            continue
    
    return jobs

def cancel_batch_jobs(db: Session, job_ids: List[int]) -> dict:
    """批量取消任务"""
    results = {'success': [], 'failed': []}
    
    for job_id in job_ids:
        try:
            job = get_print_job(db, job_id)
            cancel_print_job(db, job)
            results['success'].append(job_id)
        except Exception as e:
            results['failed'].append({'job_id': job_id, 'error': str(e)})
    
    return results

def retry_failed_jobs(db: Session, hours: int = 24) -> List[PrintJob]:
    """重试失败的任务"""
    from datetime import datetime, timedelta
    
    cutoff_time = datetime.now() - timedelta(hours=hours)
    
    failed_jobs = db.query(PrintJob).filter(
        PrintJob.status == 'failed',
        PrintJob.created_at >= cutoff_time
    ).all()
    
    retried = []
    for job in failed_jobs:
        job.status = 'queued'
        job.error_message = None
        db.add(job)
        job_queue.enqueue(job.id, job.priority)
        retried.append(job)
    
    db.commit()
    return retried
```

**API接口**：

```python
# 在 app/api/routes/jobs.py 添加

@router.post("/batch", response_model=List[PrintJobRead])
def create_batch_jobs(
    jobs_in: List[PrintJobCreate],
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    jobs = job_service.create_batch_print_jobs(db, jobs_in, current_user.id)
    return [PrintJobRead.from_orm(job) for job in jobs]

@router.post("/batch/cancel")
def cancel_batch_jobs(
    job_ids: List[int],
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
):
    return job_service.cancel_batch_jobs(db, job_ids)

@router.post("/retry-failed")
def retry_failed_jobs(
    hours: int = 24,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
):
    jobs = job_service.retry_failed_jobs(db, hours)
    return {'retried_count': len(jobs)}
```

#### 8. 打印任务调度策略

**需求**：支持定时打印、条件触发打印

**实现方案**：

```python
# 新建 app/services/scheduler_service.py

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

scheduler = BackgroundScheduler()

def schedule_print_job(
    db: Session,
    job_in: PrintJobCreate,
    owner_id: int,
    scheduled_time: datetime
) -> int:
    """定时打印任务"""
    
    def execute_scheduled_job():
        with session_scope() as db:
            create_print_job(db, job_in, owner_id)
    
    job = scheduler.add_job(
        execute_scheduled_job,
        'date',
        run_date=scheduled_time,
        id=f'print_job_{scheduled_time.timestamp()}'
    )
    
    return job.id

def schedule_recurring_job(
    db: Session,
    job_in: PrintJobCreate,
    owner_id: int,
    cron_expression: str
) -> int:
    """周期性打印任务"""
    
    def execute_recurring_job():
        with session_scope() as db:
            create_print_job(db, job_in, owner_id)
    
    job = scheduler.add_job(
        execute_recurring_job,
        'cron',
        **_parse_cron(cron_expression)
    )
    
    return job.id

# 在 app/main.py 启动调度器
@app.on_event("startup")
def start_scheduler():
    scheduler.start()
```

#### 9. 打印质量控制

**需求**：设置打印质量、分辨率、色彩管理

**实现方案**：

```python
# 在 app/services/job_service.py 扩展

def _apply_print_settings(job: PrintJob, printer_name: str):
    """应用打印设置到打印机"""
    import win32print
    
    handle = win32print.OpenPrinter(printer_name)
    try:
        devmode = win32print.GetPrinter(handle, 2)['pDevMode']
        
        # 设置打印质量
        if job.quality:
            quality_map = {
                'draft': -1,    # DMRES_DRAFT
                'low': -2,      # DMRES_LOW
                'medium': -3,   # DMRES_MEDIUM
                'high': -4,     # DMRES_HIGH
            }
            devmode.PrintQuality = quality_map.get(job.quality, -3)
        
        # 设置颜色模式
        if job.color_mode:
            devmode.Color = 2 if job.color_mode == 'color' else 1
        
        # 设置双面打印
        if job.duplex:
            duplex_map = {
                'none': 1,       # DMDUP_SIMPLEX
                'long-edge': 2,  # DMDUP_VERTICAL
                'short-edge': 3, # DMDUP_HORIZONTAL
            }
            devmode.Duplex = duplex_map.get(job.duplex, 1)
        
        # 设置纸张大小
        if job.media_size:
            paper_map = {
                'A4': 9,      # DMPAPER_A4
                'A3': 8,      # DMPAPER_A3
                'Letter': 1,  # DMPAPER_LETTER
                'Legal': 5,   # DMPAPER_LEGAL
            }
            devmode.PaperSize = paper_map.get(job.media_size, 9)
        
        win32print.SetPrinter(handle, 2, {'pDevMode': devmode}, 0)
    finally:
        win32print.ClosePrinter(handle)
```

#### 10. 打印机共享与权限管理

**需求**：控制用户对特定打印机的访问权限

**实现方案**：

```python
# 新建 app/models/printer_permission.py

class PrinterPermission(Base):
    __tablename__ = "printer_permissions"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    printer_id = Column(Integer, ForeignKey("printers.id"))
    can_print = Column(Boolean, default=True)
    can_manage = Column(Boolean, default=False)
    daily_quota = Column(Integer, nullable=True)  # 每日打印配额
    used_quota = Column(Integer, default=0)
    
    user = relationship("User")
    printer = relationship("Printer")

# 在 app/services/printer_service.py 添加

def check_printer_permission(db: Session, user_id: int, printer_id: int) -> bool:
    """检查用户打印权限"""
    
    # 管理员有所有权限
    user = db.query(User).filter(User.id == user_id).first()
    if user.is_admin:
        return True
    
    # 检查权限表
    permission = db.query(PrinterPermission).filter(
        PrinterPermission.user_id == user_id,
        PrinterPermission.printer_id == printer_id
    ).first()
    
    if not permission:
        return False
    
    # 检查配额
    if permission.daily_quota:
        if permission.used_quota >= permission.daily_quota:
            raise HTTPException(403, "今日打印配额已用完")
    
    return permission.can_print
```

---
## 技术栈详解

### 核心依赖库

| 库名 | 版本 | 用途 | 关键API |
|------|------|------|---------|
| **FastAPI** | 最新 | Web框架 | 路由、依赖注入、自动文档 |
| **SQLAlchemy** | 2.x | ORM | 数据库模型、会话管理 |
| **pywin32** | 最新 | Windows API | win32print, win32api, win32com |
| **Pillow** | 最新 | 图像处理 | Image, ImageWin |
| **PyMuPDF** | 最新 | PDF处理 | fitz (PDF渲染) |
| **python-jose** | 最新 | JWT认证 | jwt.encode/decode |
| **pydantic** | 2.x | 数据验证 | BaseModel, Field |
| **loguru** | 最新 | 日志记录 | logger |

### Windows打印API参考

#### 常用常量

```python
# 打印机状态标志
PRINTER_STATUS_PAUSED = 0x00000001
PRINTER_STATUS_ERROR = 0x00000002
PRINTER_STATUS_PENDING_DELETION = 0x00000004
PRINTER_STATUS_PAPER_JAM = 0x00000008
PRINTER_STATUS_PAPER_OUT = 0x00000010
PRINTER_STATUS_MANUAL_FEED = 0x00000020
PRINTER_STATUS_PAPER_PROBLEM = 0x00000040
PRINTER_STATUS_OFFLINE = 0x00000080
PRINTER_STATUS_IO_ACTIVE = 0x00000100
PRINTER_STATUS_BUSY = 0x00000200
PRINTER_STATUS_PRINTING = 0x00000400
PRINTER_STATUS_OUTPUT_BIN_FULL = 0x00000800
PRINTER_STATUS_NOT_AVAILABLE = 0x00001000
PRINTER_STATUS_WAITING = 0x00002000
PRINTER_STATUS_PROCESSING = 0x00004000
PRINTER_STATUS_INITIALIZING = 0x00008000
PRINTER_STATUS_WARMING_UP = 0x00010000
PRINTER_STATUS_TONER_LOW = 0x00020000
PRINTER_STATUS_NO_TONER = 0x00040000
PRINTER_STATUS_PAGE_PUNT = 0x00080000
PRINTER_STATUS_USER_INTERVENTION = 0x00100000
PRINTER_STATUS_OUT_OF_MEMORY = 0x00200000
PRINTER_STATUS_DOOR_OPEN = 0x00400000
PRINTER_STATUS_SERVER_UNKNOWN = 0x00800000
PRINTER_STATUS_POWER_SAVE = 0x01000000

# 纸张大小
DMPAPER_LETTER = 1
DMPAPER_LEGAL = 5
DMPAPER_A3 = 8
DMPAPER_A4 = 9
DMPAPER_A5 = 11

# 打印方向
DMORIENT_PORTRAIT = 1   # 纵向
DMORIENT_LANDSCAPE = 2  # 横向

# 双面打印
DMDUP_SIMPLEX = 1      # 单面
DMDUP_VERTICAL = 2     # 长边翻转
DMDUP_HORIZONTAL = 3   # 短边翻转

# 颜色模式
DMCOLOR_MONOCHROME = 1  # 黑白
DMCOLOR_COLOR = 2       # 彩色
```

#### 关键API函数

```python
# 打印机枚举
win32print.EnumPrinters(flags, name=None, level=2)
# flags: 2=本地+网络打印机, 4=本地打印机

# 打开/关闭打印机
handle = win32print.OpenPrinter(printer_name)
win32print.ClosePrinter(handle)

# 获取打印机信息
info = win32print.GetPrinter(handle, level)
# level: 1=基本信息, 2=详细信息, 5=端口信息

# 设置打印机属性
win32print.SetPrinter(handle, level, printer_info, command)

# 打印文档
win32print.StartDocPrinter(handle, level, doc_info)
win32print.StartPagePrinter(handle)
win32print.WritePrinter(handle, data)
win32print.EndPagePrinter(handle)
win32print.EndDocPrinter(handle)

# 获取/设置默认打印机
default = win32print.GetDefaultPrinter()
win32print.SetDefaultPrinter(printer_name)

# 枚举打印任务
jobs = win32print.EnumJobs(handle, first_job, num_jobs, level)

# 删除打印任务
win32print.SetJob(handle, job_id, level, job_info, command)
# command: 0=取消任务
```

### 数据库设计

#### ER图

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    User     │         │  PrintJob   │         │   Printer   │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ id (PK)     │1      * │ id (PK)     │*      1 │ id (PK)     │
│ username    │────────>│ owner_id(FK)│<────────│ name        │
│ password    │         │ printer_id  │         │ is_default  │
│ is_admin    │         │ title       │         │ status      │
│ api_key     │         │ status      │         │ location    │
└─────────────┘         │ priority    │         └─────────────┘
                        │ content     │
                        │ file_type   │                │
                        └─────────────┘                │
                              │                        │
                              │1                       │
                              │                        │
                              │*                       │
                        ┌─────────────┐                │
                        │   JobLog    │                │
                        ├─────────────┤                │
                        │ id (PK)     │                │
                        │ job_id (FK) │                │
                        │ level       │                │
                        │ message     │                │
                        └─────────────┘                │
                                                       │
                        ┌──────────────────────────────┘
                        │
                        │*
                  ┌─────────────────┐
                  │PrinterPermission│
                  ├─────────────────┤
                  │ id (PK)         │
                  │ user_id (FK)    │
                  │ printer_id (FK) │
                  │ can_print       │
                  │ daily_quota     │
                  └─────────────────┘
```

### 配置系统

项目支持三层配置优先级：

```
环境变量 > .env文件 > config.yaml > 默认值
```

**配置文件示例**：

```yaml
# config.yaml
app:
  name: "Print Proxy Service"
  api_prefix: "/api"

server:
  host: "0.0.0.0"
  port: 8568
  reload: false
  workers: 1

database:
  url: "sqlite:///./print_proxy.db"
  echo: false

security:
  jwt_secret_key: "your-secret-key-here"
  jwt_algorithm: "HS256"
  access_token_expire_minutes: 10080

files:
  allowed_preview_formats: ["pdf", "png", "jpg", "jpeg"]
  max_file_size_mb: 50

logging:
  directory: "logs"
  level: "INFO"
```

### 性能优化建议

#### 1. 数据库优化

```python
# 添加索引
class PrintJob(Base):
    status = Column(String(50), default="queued", index=True)  # 状态索引
    priority = Column(Integer, default=5, index=True)          # 优先级索引
    created_at = Column(DateTime, index=True)                  # 时间索引

# 使用连接池
engine = create_engine(
    settings.database_url,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
```

#### 2. 任务队列优化

```python
# 使用多线程处理（需修改 JobQueueManager）
class JobQueueManager:
    def __init__(self, num_workers: int = 3):
        self._workers = []
        for _ in range(num_workers):
            thread = threading.Thread(target=self._worker_loop, daemon=True)
            thread.start()
            self._workers.append(thread)
```

#### 3. 缓存优化

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_printer_capabilities(printer_name: str):
    # 缓存打印机能力信息
    pass
```

#### 4. 异步处理

```python
# 使用 FastAPI 的后台任务
from fastapi import BackgroundTasks

@router.post("/")
async def create_job(
    job_in: PrintJobCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db)
):
    job = create_print_job(db, job_in, owner_id)
    background_tasks.add_task(process_print_job, job.id)
    return job
```

---
## 常见问题与解决方案

### Q1: 如何支持新的文件类型？

**步骤**：

1. 在 `app/schemas/print_job.py` 添加文件类型：

```python
ALLOWED_FILE_TYPES = {
    "pdf", "png", "jpg", "jpeg", "bmp", "txt",
    "doc", "docx", "xls", "xlsx",
    "ppt", "pptx"  # 新增PowerPoint支持
}
```

2. 在 `app/services/job_service.py` 添加处理逻辑：

```python
POWERPOINT_FILE_TYPES = {"ppt", "pptx"}

def _print_with_powerpoint(path: str, printer_name: str, copies: int):
    pythoncom.CoInitialize()
    ppt = win32com_client.Dispatch("PowerPoint.Application")
    ppt.Visible = False
    presentation = ppt.Presentations.Open(path, ReadOnly=True)
    
    try:
        ppt.ActivePrinter = printer_name
        presentation.PrintOut(Copies=copies)
    finally:
        presentation.Close()
        ppt.Quit()
        pythoncom.CoUninitialize()

# 在 _prepare_print_payload 中添加
if file_type in POWERPOINT_FILE_TYPES:
    path = _prepare_temp_file(job.content, suffix=f".{file_type}")
    return "powerpoint", path

# 在 _send_to_printer 中添加
elif mode == "powerpoint":
    _print_with_powerpoint(path, printer_name, job.copies)
```

### Q2: 如何实现打印机负载均衡？

**方案**：

```python
# 新建 app/services/load_balancer.py

def select_printer_by_load(db: Session, printer_ids: List[int]) -> Printer:
    """根据负载选择打印机"""
    
    # 统计每台打印机的排队任务数
    printer_loads = {}
    for printer_id in printer_ids:
        queued_count = db.query(func.count(PrintJob.id)).filter(
            PrintJob.printer_id == printer_id,
            PrintJob.status.in_(['queued', 'processing'])
        ).scalar()
        printer_loads[printer_id] = queued_count
    
    # 选择负载最小的打印机
    min_load_printer_id = min(printer_loads, key=printer_loads.get)
    return db.query(Printer).filter(Printer.id == min_load_printer_id).first()

# 在创建任务时使用
def create_print_job_with_balancing(db: Session, job_in: PrintJobCreate, owner_id: int):
    # 获取可用打印机组
    available_printers = db.query(Printer).filter(
        Printer.status == 'online',
        Printer.name.like('Group-A-%')  # 打印机组
    ).all()
    
    # 负载均衡选择
    printer = select_printer_by_load(db, [p.id for p in available_printers])
    
    # 创建任务
    job = PrintJob(printer_id=printer.id, ...)
    # ...
```

### Q3: 如何实现打印任务的断点续传？

**方案**：

```python
# 在 PrintJob 模型添加字段
class PrintJob(Base):
    # ...
    progress = Column(Integer, default=0)  # 打印进度（页数）
    total_pages = Column(Integer, nullable=True)

# 修改打印逻辑支持断点续传
def _print_pdf_with_resume(job: PrintJob, printer_name: str):
    import fitz
    
    doc = fitz.open(stream=job.content, filetype="pdf")
    job.total_pages = doc.page_count
    
    # 从上次中断的页面继续
    start_page = job.progress
    
    for page_num in range(start_page, doc.page_count):
        try:
            # 打印单页
            page = doc.load_page(page_num)
            _print_single_page(page, printer_name)
            
            # 更新进度
            job.progress = page_num + 1
            db.add(job)
            db.commit()
        except Exception as e:
            # 保存进度后抛出异常
            raise
```

### Q4: 如何监控打印机墨盒/纸张状态？

**方案**：

```python
def get_printer_supplies(printer_name: str) -> dict:
    """获取打印机耗材状态"""
    import win32print
    
    handle = win32print.OpenPrinter(printer_name)
    try:
        # 获取打印机属性
        info = win32print.GetPrinter(handle, 2)
        status = info.get('Status', 0)
        
        supplies = {
            'toner_level': 'unknown',
            'paper_status': 'unknown',
            'warnings': []
        }
        
        # 检查墨粉状态
        if status & 0x00020000:  # PRINTER_STATUS_TONER_LOW
            supplies['toner_level'] = 'low'
            supplies['warnings'].append('墨粉不足')
        elif status & 0x00040000:  # PRINTER_STATUS_NO_TONER
            supplies['toner_level'] = 'empty'
            supplies['warnings'].append('墨粉已耗尽')
        else:
            supplies['toner_level'] = 'normal'
        
        # 检查纸张状态
        if status & 0x00000010:  # PRINTER_STATUS_PAPER_OUT
            supplies['paper_status'] = 'out'
            supplies['warnings'].append('缺纸')
        elif status & 0x00000040:  # PRINTER_STATUS_PAPER_PROBLEM
            supplies['paper_status'] = 'problem'
            supplies['warnings'].append('纸张问题')
        else:
            supplies['paper_status'] = 'normal'
        
        return supplies
    finally:
        win32print.ClosePrinter(handle)

# 定期检查并发送告警
def monitor_printer_supplies():
    """监控打印机耗材并发送告警"""
    from apscheduler.schedulers.background import BackgroundScheduler
    
    scheduler = BackgroundScheduler()
    
    def check_all_printers():
        with session_scope() as db:
            printers = db.query(Printer).filter(Printer.status == 'online').all()
            
            for printer in printers:
                supplies = get_printer_supplies(printer.name)
                
                if supplies['warnings']:
                    # 发送告警（邮件/webhook等）
                    send_alert(printer.name, supplies['warnings'])
    
    # 每小时检查一次
    scheduler.add_job(check_all_printers, 'interval', hours=1)
    scheduler.start()
```

### Q5: 如何实现打印审批流程？

**方案**：

```python
# 新建 app/models/print_approval.py

class PrintApproval(Base):
    __tablename__ = "print_approvals"
    
    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("print_jobs.id"))
    requester_id = Column(Integer, ForeignKey("users.id"))
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default="pending")  # pending/approved/rejected
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_shanghai)
    approved_at = Column(DateTime, nullable=True)
    
    job = relationship("PrintJob")
    requester = relationship("User", foreign_keys=[requester_id])
    approver = relationship("User", foreign_keys=[approver_id])

# 在 app/services/approval_service.py

def create_approval_request(db: Session, job_id: int, requester_id: int) -> PrintApproval:
    """创建审批请求"""
    approval = PrintApproval(
        job_id=job_id,
        requester_id=requester_id,
        status="pending"
    )
    db.add(approval)
    
    # 更新任务状态为待审批
    job = db.query(PrintJob).filter(PrintJob.id == job_id).first()
    job.status = "pending_approval"
    db.add(job)
    
    db.commit()
    return approval

def approve_print_job(db: Session, approval_id: int, approver_id: int) -> PrintApproval:
    """审批通过"""
    approval = db.query(PrintApproval).filter(PrintApproval.id == approval_id).first()
    
    approval.status = "approved"
    approval.approver_id = approver_id
    approval.approved_at = now_shanghai()
    
    # 将任务加入打印队列
    job = approval.job
    job.status = "queued"
    job_queue.enqueue(job.id, job.priority)
    
    db.commit()
    return approval

def reject_print_job(db: Session, approval_id: int, approver_id: int, reason: str):
    """审批拒绝"""
    approval = db.query(PrintApproval).filter(PrintApproval.id == approval_id).first()
    
    approval.status = "rejected"
    approval.approver_id = approver_id
    approval.reason = reason
    approval.approved_at = now_shanghai()
    
    job = approval.job
    job.status = "rejected"
    
    db.commit()
    return approval
```

---

## 部署建议

### 生产环境配置

```yaml
# config.yaml (生产环境)
server:
  host: "0.0.0.0"
  port: 8568
  workers: 4  # 多进程

database:
  url: "postgresql://user:pass@localhost/printproxy"  # 使用PostgreSQL

security:
  jwt_secret_key: "使用强随机密钥"
  access_token_expire_minutes: 1440  # 24小时

logging:
  level: "WARNING"  # 减少日志量
  directory: "C:/ProgramData/PrintProxy/logs"
```

### Windows服务部署

使用 NSSM (Non-Sucking Service Manager)：

```powershell
# 下载 NSSM
# https://nssm.cc/download

# 安装服务
nssm install PrintProxyService "C:\Python311\python.exe"
nssm set PrintProxyService AppParameters "-m uvicorn app.main:app --host 0.0.0.0 --port 8568"
nssm set PrintProxyService AppDirectory "C:\PrintProxy"
nssm set PrintProxyService DisplayName "Print Proxy Service"
nssm set PrintProxyService Description "打印代理服务"
nssm set PrintProxyService Start SERVICE_AUTO_START

# 启动服务
nssm start PrintProxyService
```

### Docker部署（实验性）

```dockerfile
# Dockerfile
FROM python:3.11-windowsservercore

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8568"]
```

**注意**：Docker on Windows 需要特殊配置才能访问打印机。

---

## 总结

本项目采用**分层架构**设计，核心控制逻辑清晰：

1. **API层**：接收HTTP请求，进行认证和参数验证
2. **服务层**：实现业务逻辑，处理打印任务
3. **队列层**：管理任务调度，支持优先级
4. **打印层**：调用Windows API，执行实际打印

**扩展能力强**：
- ✅ 支持多种文件格式（图片、PDF、Office文档）
- ✅ 灵活的认证机制（JWT + API Key）
- ✅ 完善的日志和监控
- ✅ 易于添加新功能（状态监控、审批流程、负载均衡等）

**技术亮点**：
- 使用 pywin32 深度集成Windows打印系统
- 优先级队列保证重要任务优先处理
- 支持多种打印方式（RAW、GDI、COM自动化）
- 配置灵活，支持多源配置加载

通过本Wiki，你可以快速理解项目架构，并根据需求扩展更多打印机控制功能！
