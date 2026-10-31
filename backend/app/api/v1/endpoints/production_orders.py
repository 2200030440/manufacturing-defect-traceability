from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.production import ProductionOrder, ProductionOutput, ProductionStatus
from app.models.product import Product
from app.schemas.production import (
    ProductionOrderCreate, ProductionOrderUpdate, ProductionOrder as OrderSchema,
    ProductionOutputCreate, PaginatedOrders
)
from app.services.id_generator import generate_order_id
from datetime import datetime
import math

router = APIRouter()


@router.get("/", response_model=PaginatedOrders)
def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    product_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(ProductionOrder).options(joinedload(ProductionOrder.product))
    if search:
        q = q.filter(ProductionOrder.order_id.ilike(f"%{search}%"))
    if product_id:
        q = q.filter(ProductionOrder.product_id == product_id)
    if status:
        q = q.filter(ProductionOrder.production_status == status)
    if priority:
        q = q.filter(ProductionOrder.priority == priority)

    q = q.order_by(ProductionOrder.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "pages": math.ceil(total / page_size) if total > 0 else 1}


@router.post("/", response_model=OrderSchema, status_code=201)
def create_order(
    data: ProductionOrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not db.query(Product).filter(Product.id == data.product_id).first():
        raise HTTPException(404, f"Product ID {data.product_id} not found")

    order_id = generate_order_id(db)
    order = ProductionOrder(**data.dict(), order_id=order_id)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/all/simple")
def list_orders_simple(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    orders = db.query(ProductionOrder).filter(
        ProductionOrder.production_status.in_([
            ProductionStatus.RELEASED, ProductionStatus.IN_PROGRESS, ProductionStatus.PLANNED
        ])
    ).all()
    return [{"id": o.id, "order_id": o.order_id, "product_id": o.product_id,
             "planned_quantity": o.planned_quantity, "status": o.production_status}
            for o in orders]


@router.get("/{order_id}", response_model=OrderSchema)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    order = db.query(ProductionOrder).options(
        joinedload(ProductionOrder.product)
    ).filter(ProductionOrder.order_id == order_id).first()
    if not order:
        raise HTTPException(404, f"Production order '{order_id}' not found")
    return order


@router.put("/{order_id}", response_model=OrderSchema)
def update_order(
    order_id: str,
    data: ProductionOrderUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    order = db.query(ProductionOrder).filter(ProductionOrder.order_id == order_id).first()
    if not order:
        raise HTTPException(404, f"Production order '{order_id}' not found")

    if data.production_status:
        # Validate status transitions
        valid_transitions = {
            ProductionStatus.PLANNED: [ProductionStatus.RELEASED, ProductionStatus.CANCELLED],
            ProductionStatus.RELEASED: [ProductionStatus.IN_PROGRESS, ProductionStatus.ON_HOLD, ProductionStatus.CANCELLED],
            ProductionStatus.IN_PROGRESS: [ProductionStatus.COMPLETED, ProductionStatus.ON_HOLD],
            ProductionStatus.ON_HOLD: [ProductionStatus.IN_PROGRESS, ProductionStatus.CANCELLED],
            ProductionStatus.COMPLETED: [ProductionStatus.CLOSED],
        }
        current = order.production_status
        allowed = valid_transitions.get(current, [])
        if data.production_status not in allowed and data.production_status != current:
            raise HTTPException(400, f"Cannot transition from {current} to {data.production_status}")

        if data.production_status == ProductionStatus.IN_PROGRESS and not order.actual_start_date:
            order.actual_start_date = datetime.utcnow()
        if data.production_status in [ProductionStatus.COMPLETED, ProductionStatus.CLOSED]:
            order.actual_end_date = datetime.utcnow()

    for field, value in data.dict(exclude_unset=True).items():
        setattr(order, field, value)
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/outputs", status_code=201)
def record_output(
    order_id: str,
    data: ProductionOutputCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    order = db.query(ProductionOrder).filter(ProductionOrder.order_id == order_id).first()
    if not order:
        raise HTTPException(404, f"Production order '{order_id}' not found")

    output = ProductionOutput(
        production_order_id=order.id,
        output_type=data.output_type,
        quantity=data.quantity,
        recorded_by=data.recorded_by,
        notes=data.notes,
    )
    db.add(output)

    # Update order quantities
    if data.output_type == "GOOD":
        order.actual_quantity = (order.actual_quantity or 0) + data.quantity
    elif data.output_type == "SCRAP":
        order.scrap_quantity = (order.scrap_quantity or 0) + data.quantity
    elif data.output_type == "REWORK":
        order.rework_quantity = (order.rework_quantity or 0) + data.quantity

    db.commit()
    return {"message": f"Output recorded: {data.quantity} {data.output_type}"}


@router.get("/{order_id}/bom-requirements")
def get_bom_requirements(
    order_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get BOM requirements for a production order."""
    order = db.query(ProductionOrder).filter(ProductionOrder.order_id == order_id).first()
    if not order:
        raise HTTPException(404, f"Production order '{order_id}' not found")

    from app.models.bom import BOMComponent, BOMStatus
    components = db.query(BOMComponent).filter(
        BOMComponent.product_id == order.product_id,
        BOMComponent.revision == order.bom_revision,
        BOMComponent.bom_status == BOMStatus.ACTIVE,
    ).all()

    requirements = []
    for comp in components:
        required_qty = comp.required_quantity * order.planned_quantity
        from app.models.consumption import MaterialConsumption
        consumed = db.query(
            MaterialConsumption
        ).filter(
            MaterialConsumption.production_order_id == order.id,
            MaterialConsumption.material_id == comp.material_id,
        ).all()
        consumed_qty = sum(c.consumed_quantity for c in consumed)

        requirements.append({
            "material_id": comp.material_id,
            "material_name": comp.material.name if comp.material else "Unknown",
            "required_quantity": required_qty,
            "consumed_quantity": consumed_qty,
            "remaining_quantity": max(required_qty - consumed_qty, 0),
            "unit": comp.unit,
            "bom_id": comp.bom_id,
        })

    return requirements
