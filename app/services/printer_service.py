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
