from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.material_lot import MaterialLot, MaterialTransaction, TransactionType
from app.models.supplier import Supplier
from app.models.product import Material
from app.schemas.material_lot import MaterialLotCreate, MaterialLotUpdate, MaterialLot as LotSchema, PaginatedLots
from app.services.id_generator import generate_lot_id
import math

router = APIRouter()


@router.get("/", response_model=PaginatedLots)
def list_lots(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    supplier_id: Optional[int] = None,
    material_id: Optional[int] = None,
    status: Optional[str] = None,
    inspection_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(MaterialLot).options(
        joinedload(MaterialLot.supplier),
        joinedload(MaterialLot.material)
    )
    if search:
        q = q.filter(MaterialLot.lot_id.ilike(f"%{search}%"))
    if supplier_id:
        q = q.filter(MaterialLot.supplier_id == supplier_id)
    if material_id:
        q = q.filter(MaterialLot.material_id == material_id)
    if status:
        q = q.filter(MaterialLot.lot_status == status)
    if inspection_status:
        q = q.filter(MaterialLot.incoming_inspection_status == inspection_status)

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "pages": math.ceil(total / page_size) if total > 0 else 1}


@router.post("/", response_model=LotSchema, status_code=201)
def create_lot(
    data: MaterialLotCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    supplier = db.query(Supplier).filter(Supplier.id == data.supplier_id).first()
    if not supplier:
        raise HTTPException(404, f"Supplier ID {data.supplier_id} not found")
    if not db.query(Material).filter(Material.id == data.material_id).first():
        raise HTTPException(404, f"Material ID {data.material_id} not found")

    lot_id = generate_lot_id(db, supplier.supplier_id)
    lot = MaterialLot(
        **data.dict(),
        lot_id=lot_id,
        available_quantity=data.received_quantity,
    )
    db.add(lot)
    db.flush()

    # Record receipt transaction
    txn = MaterialTransaction(
        lot_id=lot.id,
        transaction_type=TransactionType.RECEIPT,
        quantity=data.received_quantity,
        notes="Initial receipt",
    )
    db.add(txn)
    db.commit()
    db.refresh(lot)
    return lot


@router.get("/all/simple")
def list_lots_simple(
    material_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.material_lot import LotStatus
    q = db.query(MaterialLot).filter(
        MaterialLot.lot_status.in_([LotStatus.AVAILABLE, LotStatus.PARTIALLY_CONSUMED]),
        MaterialLot.available_quantity > 0,
    )
    if material_id:
        q = q.filter(MaterialLot.material_id == material_id)
    lots = q.all()
    return [{"id": l.id, "lot_id": l.lot_id, "available_quantity": l.available_quantity,
             "unit": l.unit, "material_id": l.material_id} for l in lots]


@router.get("/{lot_id}", response_model=LotSchema)
def get_lot(
    lot_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    lot = db.query(MaterialLot).options(
        joinedload(MaterialLot.supplier),
        joinedload(MaterialLot.material)
    ).filter(MaterialLot.lot_id == lot_id).first()
    if not lot:
        raise HTTPException(404, f"Material lot '{lot_id}' not found")
    return lot


@router.put("/{lot_id}", response_model=LotSchema)
def update_lot(
    lot_id: str,
    data: MaterialLotUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    lot = db.query(MaterialLot).filter(MaterialLot.lot_id == lot_id).first()
    if not lot:
        raise HTTPException(404, f"Material lot '{lot_id}' not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(lot, field, value)
    db.commit()
    db.refresh(lot)
    return lot


@router.get("/{lot_id}/transactions")
def get_lot_transactions(
    lot_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    lot = db.query(MaterialLot).filter(MaterialLot.lot_id == lot_id).first()
    if not lot:
        raise HTTPException(404, f"Lot '{lot_id}' not found")
    txns = db.query(MaterialTransaction).filter(MaterialTransaction.lot_id == lot.id).all()
    return [{"id": t.id, "type": t.transaction_type, "quantity": t.quantity,
             "reference_id": t.reference_id, "notes": t.notes, "created_at": t.created_at}
            for t in txns]
