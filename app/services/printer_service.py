from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import Printer

try:
    import win32print  # type: ignore
    import pywintypes  # type: ignore
except ImportError:  # pragma: no cover
    win32print = None
    pywintypes = None


def fetch_system_printers() -> List[str]:
    if not win32print:
        return []
    flags = 2
    printers = win32print.EnumPrinters(flags)
    return [printer[2] for printer in printers if printer[2]]


def get_default_system_printer() -> Optional[str]:
    if not win32print:
        return None
    try:
        return win32print.GetDefaultPrinter()
    except Exception:
        return None


def set_default_system_printer(printer_name: str) -> None:
    if not win32print:
        raise RuntimeError("win32print 未安装，无法设置默认打印机")
    try:
        win32print.SetDefaultPrinter(printer_name)
    except Exception as exc:
        raise RuntimeError(f"无法设置默认打印机 '{printer_name}'") from exc


def sync_printers(db: Session) -> List[Printer]:
    system_printers = fetch_system_printers()
    default_printer = get_default_system_printer()

    existing = {printer.name: printer for printer in db.query(Printer).all()}

    for name in system_printers:
        printer = existing.get(name)
        if not printer:
            printer = Printer(name=name)
            db.add(printer)
        printer.is_default = bool(default_printer and name == default_printer)
        printer.status = "online"

    for name, printer in existing.items():
        if name not in system_printers:
            printer.status = "offline"

    db.commit()
    return db.query(Printer).all()


def set_default_printer(db: Session, printer: Printer) -> Printer:
    for item in db.query(Printer).all():
        item.is_default = False
    printer.is_default = True
    db.add(printer)
    db.commit()
    db.refresh(printer)
    if printer.name and win32print:
        set_default_system_printer(printer.name)
    return printer


def get_printer_status_details(printer_name: str) -> dict:
    """获取打印机详细状态"""
    if not win32print:
        return {"code": 0, "messages": ["win32print not installed"]}
    
    try:
        handle = win32print.OpenPrinter(printer_name)
        try:
            info = win32print.GetPrinter(handle, 2)
            status_code = info['Status']
            
            # 常见状态码映射
            status_map = {
                0x00000001: "暂停",
                0x00000002: "错误",
                0x00000004: "正在删除",
                0x00000008: "卡纸",
                0x00000010: "缺纸",
                0x00000020: "需手动送纸",
                0x00000040: "纸张问题",
                0x00000080: "脱机",
                0x00000100: "正在传输",
                0x00000200: "输出仓满",
                0x00000400: "未响应",
                0x00000800: "被用户跳过",
                0x00001000: "需用户干预",
                0x00002000: "正在处理",
                0x00004000: "正在初始化",
                0x00008000: "预热中",
                0x00010000: "墨粉不足",
                0x00020000: "无墨粉",
                0x00040000: "页面无法打印",
                0x00080000: "需用户干预",
                0x00100000: "内存不足",
                0x00200000: "门打开",
                0x00400000: "服务器未知",
                0x00800000: "节能模式",
            }
            
            messages = []
            if status_code == 0:
                messages.append("就绪")
            else:
                for code, msg in status_map.items():
                    if status_code & code:
                        messages.append(msg)
            
            return {
                "code": status_code,
                "messages": messages,
                "jobs_count": info['cJobs']
            }
        finally:
            win32print.ClosePrinter(handle)
    except Exception as e:
        return {"code": -1, "messages": [f"获取状态失败: {str(e)}"]}


def fetch_printer_jobs(printer_name: str) -> List[dict]:
    """获取打印机任务队列"""
    if not win32print:
        return []
    
    try:
        handle = win32print.OpenPrinter(printer_name)
        try:
            # EnumJobs(hPrinter, FirstJob, NoJobs, Level)
            jobs = win32print.EnumJobs(handle, 0, -1, 1)
            result = []
            for job in jobs:
                result.append({
                    "id": job['JobId'],
                    "document": job['pDocument'],
                    "user": job['pUserName'],
                    "status": job['Status'], # 简单状态描述，也可以进一步解析
                    "status_string": job.get('pStatus', ''),
                    "submitted": job['Submitted'],
                    "pages": job['TotalPages'],
                    "size": job['Size']
                })
            return result
        finally:
            win32print.ClosePrinter(handle)
    except Exception:
        return []


def purge_printer_jobs(printer_name: str) -> bool:
    """清空打印机任务队列"""
    if not win32print:
        return False
        
    try:
        handle = win32print.OpenPrinter(printer_name, {"DesiredAccess": win32print.PRINTER_ALL_ACCESS})
        try:
            # PRINTER_CONTROL_PURGE = 3
            win32print.SetPrinter(handle, 0, None, 3) 
            return True
        finally:
            win32print.ClosePrinter(handle)
    except Exception:
        return False


def print_test_page(printer_name: str) -> bool:
    """打印测试页"""
    if not win32print:
        return False
        
    try:
        handle = win32print.OpenPrinter(printer_name)
        try:
            job = win32print.StartDocPrinter(handle, 1, ("测试页", None, "RAW"))
            win32print.StartPagePrinter(handle)
            win32print.WritePrinter(handle, b"Hello World! This is a test page from PrintProxy.\r\n\f")
            win32print.EndPagePrinter(handle)
            win32print.EndDocPrinter(handle)
            return True
        finally:
            win32print.ClosePrinter(handle)
    except Exception:
        return False
