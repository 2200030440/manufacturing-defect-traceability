from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, Supplier as SupplierSchema, SupplierDetail, PaginatedSuppliers
from app.services.id_generator import generate_supplier_id
import math

router = APIRouter()


@router.get("/", response_model=PaginatedSuppliers)
def list_suppliers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    country: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Supplier)
    if search:
        q = q.filter(
            Supplier.name.ilike(f"%{search}%") |
            Supplier.supplier_id.ilike(f"%{search}%")
        )
    if category:
        q = q.filter(Supplier.category == category)
    if status:
        q = q.filter(Supplier.lifecycle_status == status)
    if country:
        q = q.filter(Supplier.country.ilike(f"%{country}%"))

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "pages": math.ceil(total / page_size) if total > 0 else 1}


@router.post("/", response_model=SupplierSchema, status_code=201)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    supplier_id = generate_supplier_id(db)
    supplier = Supplier(**data.dict(), supplier_id=supplier_id)
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.get("/all/simple")
def list_suppliers_simple(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.supplier import SupplierStatus
    suppliers = db.query(Supplier).filter(
        Supplier.lifecycle_status == SupplierStatus.ACTIVE
    ).all()
    return [{"id": s.id, "supplier_id": s.supplier_id, "name": s.name, "country": s.country}
            for s in suppliers]


@router.get("/{supplier_id}", response_model=SupplierDetail)
def get_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    supplier = db.query(Supplier).filter(Supplier.supplier_id == supplier_id).first()
    if not supplier:
        raise HTTPException(404, f"Supplier '{supplier_id}' not found")

    from app.models.material_lot import MaterialLot, LotStatus
    from app.models.defect import Defect

    total_lots = db.query(MaterialLot).filter(MaterialLot.supplier_id == supplier.id).count()
    active_lots = db.query(MaterialLot).filter(
        MaterialLot.supplier_id == supplier.id,
        MaterialLot.lot_status == LotStatus.AVAILABLE
    ).count()

    lot_ids = [row.id for row in db.query(MaterialLot.id).filter(
        MaterialLot.supplier_id == supplier.id
    ).all()]

    defect_qty = 0
    if lot_ids:
        defect_qty = db.query(func.coalesce(func.sum(Defect.defect_quantity), 0)).filter(
            Defect.material_lot_id.in_(lot_ids)
        ).scalar() or 0

    from app.models.inspection import InspectionResult
    from app.models.production import ProductionOrder
    from app.models.consumption import MaterialConsumption

    order_ids = [row.production_order_id for row in db.query(MaterialConsumption.production_order_id).filter(
        MaterialConsumption.lot_id.in_(lot_ids)
    ).distinct().all()] if lot_ids else []

    insp_qty = 1
    if order_ids:
        insp_qty = db.query(func.coalesce(func.sum(InspectionResult.quantity_inspected), 1)).filter(
            InspectionResult.production_order_id.in_(order_ids)
        ).scalar() or 1

    result = SupplierDetail.from_orm(supplier)
    result.total_lots = total_lots
    result.active_lots = active_lots
    result.defect_rate = round(float(defect_qty) / max(float(insp_qty), 1) * 100, 2)
    return result


@router.put("/{supplier_id}", response_model=SupplierSchema)
def update_supplier(
    supplier_id: str,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    supplier = db.query(Supplier).filter(Supplier.supplier_id == supplier_id).first()
    if not supplier:
        raise HTTPException(404, f"Supplier '{supplier_id}' not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
    return supplier
