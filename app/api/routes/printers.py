from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models import Printer, User, MaintenanceLog
from app.schemas import PrinterRead, PrinterUpdate, MaintenanceLogRead, MaintenanceLogCreate
from app.services import printer_service


router = APIRouter()


@router.get("/", response_model=List[PrinterRead])
def list_printers(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> List[PrinterRead]:
    printers = db.query(Printer).all()
    return [PrinterRead.from_orm(p) for p in printers]


@router.post("/sync", response_model=List[PrinterRead])
def sync_printers(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> List[PrinterRead]:
    printers = printer_service.sync_printers(db)
    return [PrinterRead.from_orm(p) for p in printers]


@router.put("/{printer_id}", response_model=PrinterRead)
def update_printer(
    printer_id: int,
    update_in: PrinterUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> PrinterRead:
    printer = db.query(Printer).filter(Printer.id == printer_id).first()
    if not printer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打印机不存在")
    data = update_in.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(printer, field, value)
    db.add(printer)
    db.commit()
    db.refresh(printer)
    return PrinterRead.from_orm(printer)


@router.post("/{printer_id}/default", response_model=PrinterRead)
def set_default_printer(
    printer_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> PrinterRead:
    printer = db.query(Printer).filter(Printer.id == printer_id).first()
    if not printer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打印机不存在")
    printer = printer_service.set_default_printer(db, printer)
    return PrinterRead.from_orm(printer)


@router.get("/{printer_id}/status")
def get_printer_status(
    printer_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """获取打印机增强状态"""
    printer = db.query(Printer).filter(Printer.id == printer_id).first()
    if not printer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打印机不存在")
    return printer_service.get_printer_status_details(printer.name)


@router.post("/{printer_id}/test-page")
def print_test_page(
    printer_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
):
    """打印测试页"""
    printer = db.query(Printer).filter(Printer.id == printer_id).first()
    if not printer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打印机不存在")
    
    success = printer_service.print_test_page(printer.name)
    if not success:
         raise HTTPException(status_code=500, detail="打印测试页失败")
    return {"message": "测试页已发送"}


@router.get("/{printer_id}/jobs")
def get_printer_jobs(
    printer_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """获取打印队列"""
    printer = db.query(Printer).filter(Printer.id == printer_id).first()
    if not printer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打印机不存在")
    return printer_service.fetch_printer_jobs(printer.name)


@router.delete("/{printer_id}/jobs")
def purge_printer_queue(
    printer_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
):
    """清空打印队列"""
    printer = db.query(Printer).filter(Printer.id == printer_id).first()
    if not printer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打印机不存在")
    
    success = printer_service.purge_printer_jobs(printer.name)
    if not success:
        raise HTTPException(status_code=500, detail="清空队列失败")
    return {"message": "队列已清空"}


@router.get("/{printer_id}/maintenance", response_model=List[MaintenanceLogRead])
def list_maintenance_logs(
    printer_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> List[MaintenanceLogRead]:
    """获取维护记录"""
    printer = db.query(Printer).filter(Printer.id == printer_id).first()
    if not printer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打印机不存在")
    return db.query(MaintenanceLog).filter(MaintenanceLog.printer_id == printer_id).order_by(MaintenanceLog.created_at.desc()).all()


@router.post("/{printer_id}/maintenance", response_model=MaintenanceLogRead)
def create_maintenance_log(
    printer_id: int,
    log_in: MaintenanceLogCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> MaintenanceLogRead:
    """添加维护记录"""
    printer = db.query(Printer).filter(Printer.id == printer_id).first()
    if not printer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="打印机不存在")
    
    log = MaintenanceLog(**log_in.dict(), printer_id=printer_id)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.delete("/{printer_id}/maintenance/{log_id}")
def delete_maintenance_log(
    printer_id: int,
    log_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
):
    """删除维护记录"""
    log = db.query(MaintenanceLog).filter(
        MaintenanceLog.id == log_id, 
        MaintenanceLog.printer_id == printer_id
    ).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="记录不存在")
    
    db.delete(log)
    db.commit()
    return {"message": "记录已删除"}
