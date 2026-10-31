from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.defect import Defect, DefectStatus
from app.models.inspection import InspectionResult
from app.schemas.defect import DefectCreate, DefectUpdate, Defect as DefectSchema, PaginatedDefects
from app.services.id_generator import generate_defect_id
from app.models.audit import EntityEventHistory
import math
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=PaginatedDefects)
def list_defects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    product_id: Optional[int] = None,
    production_order_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Defect)
    if search:
        q = q.filter(Defect.defect_id.ilike(f"%{search}%"))
    if severity:
        q = q.filter(Defect.severity == severity)
    if status:
        q = q.filter(Defect.defect_status == status)
    if category:
        q = q.filter(Defect.defect_category == category)
    if product_id:
        q = q.filter(Defect.product_id == product_id)
    if production_order_id:
        q = q.filter(Defect.production_order_id == production_order_id)

    q = q.order_by(Defect.detection_date.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "pages": math.ceil(total / page_size) if total > 0 else 1}


@router.post("/", response_model=DefectSchema, status_code=201)
def create_defect(
    data: DefectCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Validate inspection exists if provided
    if data.inspection_id:
        inspection = db.query(InspectionResult).filter(
            InspectionResult.id == data.inspection_id
        ).first()
        if not inspection:
            raise HTTPException(404, f"Inspection ID {data.inspection_id} not found")
        # Enforce: defect qty <= quantity_failed of inspection
        existing_defects_qty = sum(
            d.defect_quantity for d in db.query(Defect).filter(
                Defect.inspection_id == data.inspection_id
            ).all()
        )
        if existing_defects_qty + data.defect_quantity > inspection.quantity_failed:
            raise HTTPException(
                400,
                f"Total defect quantity would exceed failed quantity "
                f"({inspection.quantity_failed}) of inspection"
            )

    defect_id = generate_defect_id(db)
    defect = Defect(**data.dict(), defect_id=defect_id)
    db.add(defect)
    db.flush()

    # Record event
    event = EntityEventHistory(
        entity_type="Defect",
        entity_id=defect_id,
        event_type="CREATED",
        from_status=None,
        to_status=DefectStatus.OPEN.value,
        description="Defect created",
        performed_by=current_user.email,
    )
    db.add(event)
    db.commit()
    db.refresh(defect)
    return defect


@router.get("/{defect_id}", response_model=DefectSchema)
def get_defect(
    defect_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    defect = db.query(Defect).filter(Defect.defect_id == defect_id).first()
    if not defect:
        raise HTTPException(404, f"Defect '{defect_id}' not found")
    return defect


@router.put("/{defect_id}", response_model=DefectSchema)
def update_defect(
    defect_id: str,
    data: DefectUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    defect = db.query(Defect).filter(Defect.defect_id == defect_id).first()
    if not defect:
        raise HTTPException(404, f"Defect '{defect_id}' not found")

    old_status = defect.defect_status
    for field, value in data.dict(exclude_unset=True).items():
        setattr(defect, field, value)

    # Record status change event
    if data.defect_status and data.defect_status != old_status:
        event = EntityEventHistory(
            entity_type="Defect",
            entity_id=defect_id,
            event_type="STATUS_CHANGE",
            from_status=old_status.value if old_status else None,
            to_status=data.defect_status.value,
            performed_by=current_user.email,
        )
        db.add(event)

    db.commit()
    db.refresh(defect)
    return defect


@router.get("/{defect_id}/history")
def get_defect_history(
    defect_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    events = db.query(EntityEventHistory).filter(
        EntityEventHistory.entity_type == "Defect",
        EntityEventHistory.entity_id == defect_id,
    ).order_by(EntityEventHistory.created_at).all()
    return [{"event_type": e.event_type, "from_status": e.from_status,
             "to_status": e.to_status, "description": e.description,
             "performed_by": e.performed_by, "created_at": e.created_at}
            for e in events]
