from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models import Printer, User
from app.schemas import PrinterRead, PrinterUpdate
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
