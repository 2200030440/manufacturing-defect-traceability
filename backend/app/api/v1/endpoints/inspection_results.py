from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.inspection import InspectionResult, InspectionPlan, InspectionResultStatus
from app.models.production import ProductionOrder
from app.schemas.inspection import (
    InspectionResultCreate, InspectionResultUpdate,
    InspectionResult as InspSchema, PaginatedInspections
)
from app.services.id_generator import generate_inspection_id
import math

router = APIRouter()


@router.get("/", response_model=PaginatedInspections)
def list_results(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    production_order_id: Optional[int] = None,
    inspection_plan_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(InspectionResult)
    if production_order_id:
        q = q.filter(InspectionResult.production_order_id == production_order_id)
    if inspection_plan_id:
        q = q.filter(InspectionResult.inspection_plan_id == inspection_plan_id)
    if status:
        q = q.filter(InspectionResult.inspection_status == status)

    q = q.order_by(InspectionResult.inspection_date.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "pages": math.ceil(total / page_size) if total > 0 else 1}


@router.post("/", response_model=InspSchema, status_code=201)
def create_result(
    data: InspectionResultCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Validate production order
    order = db.query(ProductionOrder).filter(
        ProductionOrder.id == data.production_order_id
    ).first()
    if not order:
        raise HTTPException(404, f"Production order ID {data.production_order_id} not found")

    # Validate inspection plan
    plan = db.query(InspectionPlan).filter(InspectionPlan.id == data.inspection_plan_id).first()
    if not plan:
        raise HTTPException(404, f"Inspection plan ID {data.inspection_plan_id} not found")

    # Enforce arithmetic constraint
    if abs(data.quantity_inspected - data.quantity_passed - data.quantity_failed) > 0.001:
        raise HTTPException(
            400,
            f"Arithmetic error: inspected ({data.quantity_inspected}) != "
            f"passed ({data.quantity_passed}) + failed ({data.quantity_failed})"
        )

    # Enforce defect qty <= inspected qty
    if data.quantity_failed > data.quantity_inspected:
        raise HTTPException(400, "Failed quantity cannot exceed inspected quantity")

    inspection_id = generate_inspection_id(db, order.order_id)
    result = InspectionResult(**data.dict(), inspection_id=inspection_id)
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@router.get("/{inspection_id}", response_model=InspSchema)
def get_result(
    inspection_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = db.query(InspectionResult).filter(
        InspectionResult.inspection_id == inspection_id
    ).first()
    if not result:
        raise HTTPException(404, f"Inspection '{inspection_id}' not found")
    return result


@router.put("/{inspection_id}", response_model=InspSchema)
def update_result(
    inspection_id: str,
    data: InspectionResultUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = db.query(InspectionResult).filter(
        InspectionResult.inspection_id == inspection_id
    ).first()
    if not result:
        raise HTTPException(404, f"Inspection '{inspection_id}' not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(result, field, value)
    db.commit()
    db.refresh(result)
    return result
