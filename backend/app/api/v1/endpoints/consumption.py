from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.consumption import MaterialConsumption
from app.models.material_lot import MaterialLot, MaterialTransaction, TransactionType, LotStatus
from app.models.production import ProductionOrder
from app.models.bom import BOMComponent, BOMStatus
from app.schemas.capa import ConsumptionCreate, Consumption
from app.services.id_generator import generate_consumption_id
import math

router = APIRouter()


@router.get("/", response_model=List[Consumption])
def list_consumptions(
    production_order_id: Optional[int] = None,
    lot_id: Optional[int] = None,
    material_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(MaterialConsumption)
    if production_order_id:
        q = q.filter(MaterialConsumption.production_order_id == production_order_id)
    if lot_id:
        q = q.filter(MaterialConsumption.lot_id == lot_id)
    if material_id:
        q = q.filter(MaterialConsumption.material_id == material_id)
    return q.all()


@router.post("/", response_model=Consumption, status_code=201)
def record_consumption(
    data: ConsumptionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Validate production order exists
    order = db.query(ProductionOrder).filter(
        ProductionOrder.id == data.production_order_id
    ).first()
    if not order:
        raise HTTPException(404, f"Production order ID {data.production_order_id} not found")

    # Validate lot exists and has available quantity
    lot = db.query(MaterialLot).filter(MaterialLot.id == data.lot_id).first()
    if not lot:
        raise HTTPException(404, f"Material lot ID {data.lot_id} not found")
    if lot.lot_status == LotStatus.QUARANTINED:
        raise HTTPException(400, f"Lot {lot.lot_id} is QUARANTINED and cannot be consumed")
    if lot.available_quantity < data.consumed_quantity:
        raise HTTPException(
            400,
            f"Insufficient quantity: lot has {lot.available_quantity} {lot.unit}, "
            f"requested {data.consumed_quantity}"
        )

    # Validate material matches BOM (informational - not blocking if no BOM)
    bom_comp = db.query(BOMComponent).filter(
        BOMComponent.product_id == order.product_id,
        BOMComponent.material_id == data.material_id,
        BOMComponent.bom_status == BOMStatus.ACTIVE,
    ).first()
    if not bom_comp:
        # Log warning but allow with note
        pass  # Will show as exception in validation engine

    # Create consumption record
    consumption_id = generate_consumption_id(db)
    consumption = MaterialConsumption(
        consumption_id=consumption_id,
        production_order_id=data.production_order_id,
        lot_id=data.lot_id,
        material_id=data.material_id,
        consumed_quantity=data.consumed_quantity,
        unit=data.unit,
        consumption_date=data.consumption_date,
        recorded_by=data.recorded_by,
        notes=data.notes,
    )
    db.add(consumption)

    # Update lot available quantity
    lot.available_quantity -= data.consumed_quantity
    if lot.available_quantity <= 0:
        lot.lot_status = LotStatus.CONSUMED
    else:
        lot.lot_status = LotStatus.PARTIALLY_CONSUMED

    # Record transaction
    txn = MaterialTransaction(
        lot_id=lot.id,
        transaction_type=TransactionType.CONSUMPTION,
        quantity=-data.consumed_quantity,
        reference_id=order.order_id,
        notes=f"Consumption for {order.order_id}",
    )
    db.add(txn)
    db.commit()
    db.refresh(consumption)
    return consumption


@router.post("/{consumption_id}/reverse", status_code=201)
def reverse_consumption(
    consumption_id: str,
    reason: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Reverse a material consumption - creates reversal transaction."""
    consumption = db.query(MaterialConsumption).filter(
        MaterialConsumption.consumption_id == consumption_id
    ).first()
    if not consumption:
        raise HTTPException(404, f"Consumption '{consumption_id}' not found")
    if consumption.is_reversal:
        raise HTTPException(400, "Cannot reverse a reversal transaction")

    # Create reversal record
    new_id = generate_consumption_id(db)
    reversal = MaterialConsumption(
        consumption_id=new_id,
        production_order_id=consumption.production_order_id,
        lot_id=consumption.lot_id,
        material_id=consumption.material_id,
        consumed_quantity=consumption.consumed_quantity,
        unit=consumption.unit,
        consumption_date=consumption.consumption_date,
        is_reversal=1,
        original_consumption_id=consumption_id,
        notes=f"Reversal: {reason}",
    )
    db.add(reversal)

    # Restore lot quantity
    lot = consumption.lot
    lot.available_quantity += consumption.consumed_quantity
    if lot.lot_status == LotStatus.CONSUMED:
        lot.lot_status = LotStatus.PARTIALLY_CONSUMED

    txn = MaterialTransaction(
        lot_id=lot.id,
        transaction_type=TransactionType.REVERSAL,
        quantity=consumption.consumed_quantity,
        reference_id=consumption_id,
        notes=f"Reversal: {reason}",
    )
    db.add(txn)
    db.commit()
    return {"message": f"Consumption {consumption_id} reversed successfully", "reversal_id": new_id}
