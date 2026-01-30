# 打印服务架构

## 1. Identity

- **What it is:** PrintProxy 的核心打印服务模块，负责打印任务的创建、处理和执行。
- **Purpose:** 提供统一的打印任务管理接口，支持多种文件格式，与 Windows 打印系统深度集成。

## 2. Core Components

- `app/services/job_service.py` (`create_print_job`, `process_print_job`, `_send_to_printer`): 打印任务服务核心，负责任务创建、处理调度和打印分发。
- `app/services/printer_service.py` (`sync_printers`, `get_printer_status_details`): 打印机管理服务，负责系统打印机同步和状态查询。
- `app/utils/print_utils.py` (`parse_media_size`, `optimize_image_for_print`): 打印工具函数，提供尺寸解析和图片优化。
- `app/tasks/manager.py` (`JobQueueManager`): 任务队列管理器，基于优先级队列的异步任务调度。
- `app/models/print_job.py` (`PrintJob`): 打印任务数据模型，存储任务内容和打印选项。

## 3. Execution Flow (LLM Retrieval Map)

### 3.1 任务创建流程

- **1. API 接收:** `app/api/routes/jobs.py:53` - `create_job` 路由接收请求
- **2. 内容解码:** `app/services/job_service.py:95-99` - `_decode_job_content` 解码 base64 内容
- **3. 打印机分配:** `app/services/job_service.py:108-114` - 查询指定或默认打印机
- **4. 任务存储:** `app/services/job_service.py:136-154` - 创建 `PrintJob` 记录
- **5. 入队调度:** `app/services/job_service.py:157` - `job_queue.enqueue` 加入优先级队列

### 3.2 任务处理流程

- **1. 队列取出:** `app/tasks/manager.py:47-51` - `_worker_loop` 从队列取任务
- **2. 状态更新:** `app/services/job_service.py:758-761` - 更新状态为 `processing`
- **3. 载荷准备:** `app/services/job_service.py:295-314` - `_prepare_print_payload` 根据文件类型准备打印内容
- **4. 打印分发:** `app/services/job_service.py:625-745` - `_send_to_printer` 根据模式调用对应打印函数
- **5. 结果记录:** `app/services/job_service.py:763-775` - 更新任务状态，记录日志

### 3.3 打印模式选择

| 文件类型 | 打印模式 | 处理函数 | 代码位置 |
|---------|---------|---------|---------|
| PNG/JPG/JPEG/BMP | `image_gdi` | `_print_image_with_gdi` | `job_service.py:373-511` |
| PDF | `pdf_gdi` | `_print_pdf_with_gdi` | `job_service.py:514-622` |
| DOC/DOCX | `word` | `_print_with_word` | `job_service.py:317-343` |
| XLS/XLSX | `excel` | `_print_with_excel` | `job_service.py:346-372` |
| TXT | `raw` | `win32print.WritePrinter` | `job_service.py:670-687` |

## 4. Windows 打印系统交互

### 4.1 核心 API 模块

- **win32print:** 打印机枚举、任务管理、RAW 打印
- **win32ui/win32con:** GDI 设备上下文创建和绘制
- **ImageWin:** PIL 图像到 GDI 位图转换
- **win32com.client:** Office 文档 COM 自动化

### 4.2 GDI 打印流程

```
CreateDC → CreatePrinterDC → GetDeviceCaps → StartDoc → StartPage → Dib.draw → EndPage → EndDoc → DeleteDC
```

## 5. Design Rationale

- **GDI 优先:** 图片和 PDF 使用 GDI 打印，避免依赖外部应用程序，提供更精确的打印控制。
- **COM 自动化:** Office 文档使用 COM 调用原生应用，保证格式兼容性。
- **优先级队列:** 支持任务优先级调度，高优先级任务优先处理。
- **质量增强:** 内置图片优化算法，提升打印清晰度。
