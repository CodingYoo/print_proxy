from __future__ import annotations

import base64
import io
import os
import tempfile
from typing import List, Optional

from fastapi import HTTPException, status
from loguru import logger
from PIL import Image

try:  # pragma: no cover
    from PIL import ImageWin
except ImportError:  # pragma: no cover
    ImageWin = None
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import session_scope
from app.models import PrintJob, Printer
from app.schemas import PrintJobCreate, PrintJobUpdate
from app.schemas.print_job import ALLOWED_FILE_TYPES
from app.services.log_service import create_job_log
from app.tasks.manager import job_queue
from app.utils.print_utils import (
    parse_media_size, 
    calculate_scale_ratio, 
    should_rotate_image,
    optimize_image_for_print,
    get_optimal_resampling_filter,
    # process_svg_for_print  # SVG 支持已移除
)

try:
    import win32print  # type: ignore
    import win32api  # type: ignore
except ImportError:  # pragma: no cover
    win32print = None
    win32api = None

try:
    import fitz  # type: ignore
except ImportError:  # pragma: no cover
    fitz = None

try:  # pragma: no cover
    import pythoncom  # type: ignore
except ImportError:  # pragma: no cover
    pythoncom = None

try:  # pragma: no cover
    import win32com.client as win32com_client  # type: ignore
except ImportError:  # pragma: no cover
    win32com_client = None

try:  # pragma: no cover
    import win32ui  # type: ignore
    import win32con  # type: ignore
except ImportError:  # pragma: no cover
    win32ui = None
    win32con = None


SUPPORTED_IMAGE_TYPES = {"png", "jpg", "jpeg", "bmp"}
# SVG 支持已移除
RAW_COMPATIBLE_TYPES = {"txt"}
WORD_FILE_TYPES = {"doc", "docx"}
EXCEL_FILE_TYPES = {"xls", "xlsx"}


def _resolve_com_active_printer(printer_name: str) -> str:
    if not win32print:
        return printer_name
    try:
        handle = win32print.OpenPrinter(printer_name)
    except Exception:
        return printer_name
    active_name = printer_name
    try:
        info = win32print.GetPrinter(handle, 2)
        port = info.get("pPortName") if isinstance(info, dict) else None
        if port:
            active_name = f"{printer_name} on {port}"
    except Exception:
        active_name = printer_name
    finally:
        try:
            win32print.ClosePrinter(handle)
        except Exception:
            pass
    return active_name


def _decode_job_content(job_in: PrintJobCreate) -> bytes:
    try:
        return base64.b64decode(job_in.content_base64)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="打印内容格式错误") from exc


def create_print_job(db: Session, job_in: PrintJobCreate, owner_id: Optional[int]) -> PrintJob:
    content = _decode_job_content(job_in)

    if job_in.file_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="文件类型不受支持")

    printer: Optional[Printer] = None
    if job_in.printer_name:
        printer = db.query(Printer).filter(Printer.name == job_in.printer_name).first()
        if not printer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="指定的打印机不存在")
    else:
        printer = db.query(Printer).filter(Printer.is_default.is_(True)).first()

    # 存储 DPI 信息到 media_size 中（如果客户端单独指定了 DPI）
    media_size_with_dpi = job_in.media_size
    if job_in.media_size and hasattr(job_in, 'dpi') and job_in.dpi:
        # 如果 media_size 中没有 @dpi 后缀，添加上
        if '@' not in job_in.media_size:
            media_size_with_dpi = f"{job_in.media_size}@{job_in.dpi}dpi"
    
    # 获取打印选项参数
    fit_mode = getattr(job_in, 'fit_mode', 'fill') or 'fill'
    auto_rotate = getattr(job_in, 'auto_rotate', True)
    enhance_quality = getattr(job_in, 'enhance_quality', True)
    
    if auto_rotate is None:
        auto_rotate = True
    if enhance_quality is None:
        enhance_quality = True
    
    job = PrintJob(
        title=job_in.title,
        content=content,
        file_type=job_in.file_type,
        copies=job_in.copies,
        priority=job_in.priority,
        media_size=media_size_with_dpi,
        color_mode=job_in.color_mode,
        duplex=job_in.duplex,
        fit_mode=fit_mode,
        auto_rotate=1 if auto_rotate else 0,  # 转换为整数存储
        enhance_quality=1 if enhance_quality else 0,  # 转换为整数存储
        owner_id=owner_id,
        printer_id=printer.id if printer else None,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    create_job_log(db, job.id, "info", "打印任务已创建并进入队列")
    job_queue.enqueue(job.id, job.priority)
    return job


def list_print_jobs(db: Session, skip: int = 0, limit: int = 20) -> List[PrintJob]:
    return db.query(PrintJob).order_by(PrintJob.created_at.desc()).offset(skip).limit(limit).all()


def get_print_job(db: Session, job_id: int) -> PrintJob:
    job = db.query(PrintJob).filter(PrintJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打印任务不存在")
    return job


def update_print_job(db: Session, job: PrintJob, job_in: PrintJobUpdate) -> PrintJob:
    if job.status not in {"queued", "processing"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前任务状态不允许修改")
    data = job_in.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(job, field, value)
    db.add(job)
    db.commit()
    db.refresh(job)
    if "priority" in data:
        job_queue.enqueue(job.id, job.priority)
        create_job_log(db, job.id, "info", "任务优先级已更新，重新进入队列")
    return job


def cancel_print_job(db: Session, job: PrintJob) -> PrintJob:
    if job.status not in {"queued", "processing"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无法取消已完成的任务")
    job_queue.cancel(job.id)
    job.status = "cancelled"
    db.add(job)
    db.commit()
    db.refresh(job)
    create_job_log(db, job.id, "warning", "任务已被取消")
    return job


def _prepare_temp_file(content: bytes, suffix: str) -> str:
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as tmp:
        tmp.write(content)
    return path


def _prepare_print_payload(job: PrintJob) -> tuple[str, str | bytes]:
    file_type = job.file_type.lower()
    if file_type in RAW_COMPATIBLE_TYPES:
        return "raw", job.content
    if file_type in SUPPORTED_IMAGE_TYPES:
        return "image_gdi", job.content
    # SVG 支持已移除
    if file_type == "pdf":
        path = _prepare_temp_file(job.content, suffix=".pdf")
        return "file", path
    if file_type in WORD_FILE_TYPES:
        path = _prepare_temp_file(job.content, suffix=f".{file_type}")
        return "word", path
    if file_type in EXCEL_FILE_TYPES:
        path = _prepare_temp_file(job.content, suffix=f".{file_type}")
        return "excel", path
    raise RuntimeError(f"暂不支持的文件类型: {file_type}")


def _print_with_word(path: str, printer_name: str, copies: int) -> None:
    if not win32com_client:
        raise RuntimeError("缺少 win32com.client，无法打印 Word 文档")
    if not pythoncom:
        raise RuntimeError("缺少 pythoncom 模块，无法打印 Word 文档")

    initialized = False
    word = None
    doc = None
    try:
        pythoncom.CoInitialize()
        initialized = True
        word = win32com_client.Dispatch("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(path, ReadOnly=True)
        try:
            active_name = _resolve_com_active_printer(printer_name)
            word.ActivePrinter = active_name
            doc.PrintOut(Background=False, Copies=copies, ActivePrinter=active_name)
        finally:
            if doc:
                doc.Close(False)
    finally:
        if word:
            word.Quit()
        if initialized:
            pythoncom.CoUninitialize()


def _print_with_excel(path: str, printer_name: str, copies: int) -> None:
    if not win32com_client:
        raise RuntimeError("缺少 win32com.client，无法打印 Excel 文档")
    if not pythoncom:
        raise RuntimeError("缺少 pythoncom 模块，无法打印 Excel 文档")

    initialized = False
    excel = None
    workbook = None
    try:
        pythoncom.CoInitialize()
        initialized = True
        excel = win32com_client.Dispatch("Excel.Application")
        excel.Visible = False
        workbook = excel.Workbooks.Open(path, ReadOnly=True)
        try:
            active_name = _resolve_com_active_printer(printer_name)
            excel.ActivePrinter = active_name
            workbook.PrintOut(Copies=copies, ActivePrinter=active_name)
        finally:
            if workbook:
                workbook.Close(False)
    finally:
        if excel:
            excel.Quit()
        if initialized:
            pythoncom.CoUninitialize()
def _print_image_with_gdi(
    content: bytes, 
    printer_name: str, 
    copies: int, 
    title: Optional[str],
    media_size: Optional[str] = None,
    color_mode: Optional[str] = None,
    fit_mode: str = "fill",
    auto_rotate: bool = True,
    enhance_quality: bool = True
) -> None:
    if not win32print or not win32ui or not win32con:
        raise RuntimeError("缺少打印所需的 Win32 模块")
    if not ImageWin:
        raise RuntimeError("缺少 Pillow ImageWin 模块，无法打印图片")

    try:
        with Image.open(io.BytesIO(content)) as img:
            # 先转换为 RGB 以便后续处理
            image = img.convert("RGB")
    except Exception as exc:
        raise RuntimeError("无法解析图片内容") from exc

    printable_title = title or "Print Job"

    hdc = win32ui.CreateDC()
    try:
        hdc.CreatePrinterDC(printer_name)

        # 尝试解析自定义尺寸
        custom_size = parse_media_size(media_size)
        
        if custom_size:
            # 使用自定义尺寸
            printable_width, printable_height = custom_size
            logger.info(f"使用自定义打印尺寸: {printable_width}x{printable_height} 像素 (来自 {media_size})")
        else:
            # 使用打印机默认尺寸
            printable_width = hdc.GetDeviceCaps(win32con.HORZRES)
            printable_height = hdc.GetDeviceCaps(win32con.VERTRES)
            logger.info(f"使用打印机默认尺寸: {printable_width}x{printable_height} 像素")
        
        if printable_width <= 0 or printable_height <= 0:
            raise RuntimeError("打印机可打印区域无效")

        offset_x = hdc.GetDeviceCaps(win32con.PHYSICALOFFSETX)
        offset_y = hdc.GetDeviceCaps(win32con.PHYSICALOFFSETY)

        # 自动旋转图片以更好地适配纸张
        if auto_rotate and should_rotate_image(image.width, image.height, printable_width, printable_height):
            logger.info(f"自动旋转图片 90 度以适配纸张方向 (图片: {image.width}x{image.height}, 纸张: {printable_width}x{printable_height})")
            image = image.rotate(90, expand=True)
            logger.info(f"旋转后图片尺寸: {image.width}x{image.height}")

        # 保持原始尺寸，不进行缩放
        logger.info(f"保持原始尺寸打印: {image.width}x{image.height} (纸张: {printable_width}x{printable_height})")

        # 优化图片质量（锐化、对比度增强、颜色转换）
        if enhance_quality:
            logger.info(f"应用质量增强: 锐化、对比度优化、颜色模式={color_mode}")
            # 解析 DPI（用于优化）
            target_dpi = 203  # 默认值
            if media_size and '@' in media_size:
                try:
                    dpi_str = media_size.split('@')[1].replace('dpi', '')
                    target_dpi = int(dpi_str)
                except:
                    pass
            
            image = optimize_image_for_print(
                image,
                target_dpi=target_dpi,
                color_mode=color_mode,
                enhance_quality=True
            )
        else:
            # 不增强质量，只做基本颜色转换
            if color_mode and color_mode.lower() in ["monochrome", "mono", "bw"]:
                image = image.convert("1")
            elif color_mode and color_mode.lower() in ["grayscale", "gray"]:
                image = image.convert("L")
            else:
                image = image.convert("RGB")

        # 居中对齐打印
        draw_left = offset_x + max(0, (printable_width - image.width) // 2)
        draw_top = offset_y + max(0, (printable_height - image.height) // 2)
        draw_right = draw_left + image.width
        draw_bottom = draw_top + image.height
        logger.info(f"居中对齐打印位置: ({draw_left}, {draw_top}) 到 ({draw_right}, {draw_bottom})")

        dib = ImageWin.Dib(image)

        doc_started = False
        try:
            hdc.StartDoc(printable_title)
            doc_started = True
            for _ in range(max(1, copies)):
                hdc.StartPage()
                try:
                    dib.draw(hdc.GetHandleOutput(), (draw_left, draw_top, draw_right, draw_bottom))
                finally:
                    hdc.EndPage()
            hdc.EndDoc()
        except Exception:
            if doc_started:
                hdc.AbortDoc()
            raise
    finally:
        hdc.DeleteDC()


def _send_to_printer(job: PrintJob) -> None:
    if os.environ.get("PRINT_PROXY_DISABLE_PRINT") == "1":
        logger.info("测试模式下跳过实际打印: {}", job.id)
        return
    if not win32print:
        raise RuntimeError("win32print 未安装，无法执行打印")

    printer_name = None
    if job.printer and job.printer.name:
        printer_name = job.printer.name
    else:
        try:
            printer_name = win32print.GetDefaultPrinter()
        except Exception as exc:  # pragma: no cover
            raise RuntimeError("系统没有默认打印机") from exc

    if not printer_name:
        raise RuntimeError("未找到可用打印机")

    mode, payload = _prepare_print_payload(job)

    if mode == "raw":
        try:
            handle = win32print.OpenPrinter(printer_name)
        except Exception as exc:
            raise RuntimeError(f"无法打开打印机 '{printer_name}'") from exc
        try:
            job_info = (job.title, None, "RAW")
            try:
                win32print.StartDocPrinter(handle, 1, job_info)
                for _ in range(job.copies):
                    win32print.StartPagePrinter(handle)
                    win32print.WritePrinter(handle, payload)
                    win32print.EndPagePrinter(handle)
                win32print.EndDocPrinter(handle)
            except Exception as exc:
                raise RuntimeError(f"打印过程失败: {exc}") from exc
        finally:
            win32print.ClosePrinter(handle)
    elif mode == "file":
        if not win32api:
            raise RuntimeError("缺少 win32api，无法处理文件打印")
        if not isinstance(payload, str):
            raise RuntimeError("无效的打印内容类型")
        path = payload
        try:
            for _ in range(job.copies):
                win32api.ShellExecute(0, "printto", path, f'"{printer_name}"', ".", 0)
        finally:
            if os.path.exists(path):
                os.remove(path)
    elif mode == "image_gdi":
        if not isinstance(payload, (bytes, bytearray)):
            raise RuntimeError("无效的打印内容类型")
        
        # 从数据库模型中获取打印选项
        fit_mode = getattr(job, 'fit_mode', 'fill') or 'fill'
        auto_rotate_value = getattr(job, 'auto_rotate', 1)
        enhance_quality_value = getattr(job, 'enhance_quality', 1)
        
        # 将整数转换为布尔值
        auto_rotate = bool(auto_rotate_value) if auto_rotate_value is not None else True
        enhance_quality = bool(enhance_quality_value) if enhance_quality_value is not None else True
        
        _print_image_with_gdi(
            bytes(payload), 
            printer_name, 
            job.copies, 
            job.title,
            media_size=job.media_size,
            color_mode=job.color_mode,
            fit_mode=fit_mode,
            auto_rotate=auto_rotate,
            enhance_quality=enhance_quality
        )
    # SVG 支持已移除
    else:
        if not isinstance(payload, str):
            raise RuntimeError("无效的打印内容类型")
        path = payload
        try:
            if mode == "word":
                _print_with_word(path, printer_name, job.copies)
            elif mode == "excel":
                _print_with_excel(path, printer_name, job.copies)
            else:
                raise RuntimeError("未知的打印模式")
        finally:
            if os.path.exists(path):
                os.remove(path)


def process_print_job(job_id: int) -> None:
    with session_scope() as db:
        job = db.query(PrintJob).filter(PrintJob.id == job_id).first()
        if not job:
            logger.warning("队列中的任务不存在: {}", job_id)
            return
        if job.status not in {"queued", "processing"}:
            return
        if job.status == "cancelled":
            return
        job.status = "processing"
        db.add(job)
        db.commit()
        db.refresh(job)

        try:
            _send_to_printer(job)
            job.status = "completed"
            job.error_message = None
            create_job_log(db, job.id, "info", "任务打印完成")
        except Exception as exc:  # pragma: no cover
            logger.exception("打印任务失败: {}", job.id)
            job.status = "failed"
            job.error_message = str(exc)
            create_job_log(db, job.id, "error", f"打印失败: {exc}")
        finally:
            db.add(job)
            db.commit()


def generate_preview(job: PrintJob) -> bytes:
    file_type = job.file_type.lower()
    if file_type in SUPPORTED_IMAGE_TYPES:
        try:
            image = Image.open(io.BytesIO(job.content))
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="图片内容无法读取") from exc
        preview = image.copy()
        preview.thumbnail((512, 512))
        buffer = io.BytesIO()
        preview.save(buffer, format="PNG")
        return buffer.getvalue()
    # SVG 支持已移除
    if file_type == "pdf":
        if not fitz:
            raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="缺少 PyMuPDF，无法生成 PDF 预览")
        doc = fitz.open(stream=job.content, filetype="pdf")
        if doc.page_count == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PDF 文件无内容")
        page = doc.load_page(0)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        return pix.tobytes("png")
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前任务不支持预览")
