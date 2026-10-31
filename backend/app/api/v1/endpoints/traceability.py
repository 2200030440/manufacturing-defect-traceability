from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from app.core.database import get_db
from app.core.security import get_current_user

router = APIRouter()


def build_defect_trace(defect, db) -> Dict[str, Any]:
    """Build complete traceability chain for a defect."""
    trace = {
        "defect": {
            "defect_id": defect.defect_id,
            "description": defect.description,
            "severity": defect.severity.value if defect.severity else None,
            "status": defect.defect_status.value if defect.defect_status else None,
            "defect_category": defect.defect_category.value if defect.defect_category else None,
            "defect_quantity": defect.defect_quantity,
            "detection_date": str(defect.detection_date),
        },
        "inspection": None,
        "production_order": None,
        "product": None,
        "bom": [],
        "material_consumptions": [],
        "material_lot": None,
        "supplier": None,
        "process_executions": [],
        "machine": None,
        "containments": [],
        "corrective_actions": [],
        "traceability_score": 0,
        "missing_links": [],
        "downstream_orders": [],
    }

    # Inspection
    if defect.inspection_result:
        insp = defect.inspection_result
        trace["inspection"] = {
            "inspection_id": insp.inspection_id,
            "inspection_date": str(insp.inspection_date),
            "quantity_inspected": insp.quantity_inspected,
            "quantity_passed": insp.quantity_passed,
            "quantity_failed": insp.quantity_failed,
            "status": insp.inspection_status.value if insp.inspection_status else None,
            "inspector": insp.inspector,
        }
    else:
        trace["missing_links"].append("Inspection result not linked")

    # Production Order
    if defect.production_order:
        order = defect.production_order
        trace["production_order"] = {
            "order_id": order.order_id,
            "planned_quantity": order.planned_quantity,
            "actual_quantity": order.actual_quantity,
            "status": order.production_status.value if order.production_status else None,
            "start_date": str(order.start_date) if order.start_date else None,
            "end_date": str(order.end_date) if order.end_date else None,
        }

        # Product
        if order.product:
            p = order.product
            trace["product"] = {
                "product_id": p.product_id,
                "name": p.name,
                "sku": p.sku,
                "category": p.category.value if p.category else None,
            }

            # BOM
            from app.models.bom import BOMComponent, BOMStatus
            bom_components = db.query(BOMComponent).filter(
                BOMComponent.product_id == p.id,
                BOMComponent.revision == order.bom_revision,
                BOMComponent.bom_status == BOMStatus.ACTIVE,
            ).all()
            trace["bom"] = [
                {
                    "bom_id": b.bom_id,
                    "material_name": b.material.name if b.material else "Unknown",
                    "material_id": b.material.material_id if b.material else None,
                    "required_quantity": b.required_quantity,
                    "unit": b.unit,
                    "revision": b.revision,
                }
                for b in bom_components
            ]

        # Material Consumptions for this order
        from app.models.consumption import MaterialConsumption
        consumptions = db.query(MaterialConsumption).filter(
            MaterialConsumption.production_order_id == order.id
        ).all()
        trace["material_consumptions"] = [
            {
                "consumption_id": c.consumption_id,
                "lot_id": c.lot.lot_id if c.lot else "UNKNOWN",
                "material_name": c.material.name if c.material else "Unknown",
                "consumed_quantity": c.consumed_quantity,
                "unit": c.unit,
                "consumption_date": str(c.consumption_date),
            }
            for c in consumptions
        ]

        # Process Executions
        from app.models.process import ProductionStepExecution
        executions = db.query(ProductionStepExecution).filter(
            ProductionStepExecution.production_order_id == order.id
        ).all()
        trace["process_executions"] = [
            {
                "execution_id": e.execution_id,
                "step_name": e.process_step.name if e.process_step else "Unknown",
                "sequence": e.process_step.sequence_number if e.process_step else None,
                "machine_name": e.machine.name if e.machine else None,
                "operator": e.operator,
                "status": e.execution_status.value if e.execution_status else None,
                "drift_detected": bool(e.drift_detected),
                "actual_start": str(e.actual_start) if e.actual_start else None,
                "actual_end": str(e.actual_end) if e.actual_end else None,
            }
            for e in executions
        ]
    else:
        trace["missing_links"].append("Production order not linked")

    # Material Lot (directly on defect)
    if defect.material_lot:
        lot = defect.material_lot
        trace["material_lot"] = {
            "lot_id": lot.lot_id,
            "received_quantity": lot.received_quantity,
            "available_quantity": lot.available_quantity,
            "received_date": str(lot.received_date),
            "lot_status": lot.lot_status.value if lot.lot_status else None,
            "inspection_status": lot.incoming_inspection_status.value if lot.incoming_inspection_status else None,
            "link_confirmed": bool(defect.lot_link_confirmed),
        }

        if lot.supplier:
            sup = lot.supplier
            trace["supplier"] = {
                "supplier_id": sup.supplier_id,
                "name": sup.name,
                "country": sup.country,
                "quality_rating": sup.quality_rating,
                "category": sup.category.value if sup.category else None,
            }
        else:
            trace["missing_links"].append("Supplier not linked to material lot")

        # Downstream: find all production orders that consumed this lot
        from app.models.consumption import MaterialConsumption
        downstream = db.query(MaterialConsumption).filter(
            MaterialConsumption.lot_id == lot.id
        ).all()
        seen_orders = set()
        for c in downstream:
            if c.production_order_id not in seen_orders:
                seen_orders.add(c.production_order_id)
                order = c.production_order
                if order:
                    trace["downstream_orders"].append({
                        "order_id": order.order_id,
                        "product_name": order.product.name if order.product else "Unknown",
                        "status": order.production_status.value if order.production_status else None,
                        "planned_quantity": order.planned_quantity,
                    })
    else:
        trace["missing_links"].append("Material lot not linked to defect")
        trace["missing_links"].append("Supplier cannot be traced (no lot link)")

    # Machine
    if defect.machine:
        m = defect.machine
        trace["machine"] = {
            "machine_id": m.machine_id,
            "name": m.name,
            "machine_type": m.machine_type,
            "location": m.location,
            "link_confirmed": bool(defect.machine_link_confirmed),
        }
    else:
        if not trace["process_executions"]:
            trace["missing_links"].append("Machine not linked to defect")

    # Containments
    trace["containments"] = [
        {
            "containment_id": c.containment_id,
            "action_description": c.action_description,
            "status": c.containment_status.value if c.containment_status else None,
            "decision": c.decision,
            "responsible_person": c.responsible_person,
        }
        for c in defect.containments
    ]

    # Corrective Actions
    trace["corrective_actions"] = [
        {
            "capa_id": ca.capa_id,
            "assigned_engineer": ca.assigned_engineer,
            "status": ca.capa_status.value if ca.capa_status else None,
            "verification_status": ca.verification_status.value if ca.verification_status else None,
            "target_date": str(ca.target_date) if ca.target_date else None,
            "completion_date": str(ca.completion_date) if ca.completion_date else None,
        }
        for ca in defect.corrective_actions
    ]

    # Calculate traceability score
    score = 0
    total_checks = 6
    if trace["inspection"]: score += 1
    if trace["production_order"]: score += 1
    if trace["product"]: score += 1
    if trace["material_lot"]: score += 1
    if trace["supplier"]: score += 1
    if trace["material_consumptions"]: score += 1

    trace["traceability_score"] = round(score / total_checks * 100, 1)
    trace["is_fully_traceable"] = score == total_checks

    return trace


@router.get("/defect/{defect_id}")
def trace_defect(
    defect_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Full traceability chain for a defect."""
    from app.models.defect import Defect
    from app.models.production import ProductionOrder
    from app.models.material_lot import MaterialLot
    from sqlalchemy.orm import joinedload

    defect = db.query(Defect).options(
        joinedload(Defect.inspection_result),
        joinedload(Defect.production_order).joinedload(ProductionOrder.product),
        joinedload(Defect.material_lot).joinedload(MaterialLot.supplier),
        joinedload(Defect.machine),
        joinedload(Defect.process_step),
        joinedload(Defect.containments),
        joinedload(Defect.corrective_actions),
    ).filter(Defect.defect_id == defect_id).first()

    if not defect:
        raise HTTPException(404, f"Defect '{defect_id}' not found")

    return build_defect_trace(defect, db)


@router.get("/production-order/{order_id}")
def trace_production_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Traceability for a production order."""
    from app.models.production import ProductionOrder
    from app.models.consumption import MaterialConsumption
    from app.models.process import ProductionStepExecution
    from app.models.inspection import InspectionResult
    from app.models.defect import Defect

    order = db.query(ProductionOrder).filter(ProductionOrder.order_id == order_id).first()
    if not order:
        raise HTTPException(404, f"Production order '{order_id}' not found")

    consumptions = db.query(MaterialConsumption).filter(
        MaterialConsumption.production_order_id == order.id
    ).all()
    executions = db.query(ProductionStepExecution).filter(
        ProductionStepExecution.production_order_id == order.id
    ).all()
    inspections = db.query(InspectionResult).filter(
        InspectionResult.production_order_id == order.id
    ).all()
    defects = db.query(Defect).filter(Defect.production_order_id == order.id).all()

    return {
        "production_order": {
            "order_id": order.order_id,
            "product_name": order.product.name if order.product else "Unknown",
            "product_sku": order.product.sku if order.product else None,
            "planned_quantity": order.planned_quantity,
            "actual_quantity": order.actual_quantity,
            "status": order.production_status.value if order.production_status else None,
        },
        "material_consumptions": [
            {
                "consumption_id": c.consumption_id,
                "lot_id": c.lot.lot_id if c.lot else "UNKNOWN",
                "material_name": c.material.name if c.material else "Unknown",
                "consumed_quantity": c.consumed_quantity,
                "supplier_name": c.lot.supplier.name if c.lot and c.lot.supplier else None,
            }
            for c in consumptions
        ],
        "process_executions": [
            {
                "execution_id": e.execution_id,
                "step_name": e.process_step.name if e.process_step else "Unknown",
                "machine_name": e.machine.name if e.machine else None,
                "status": e.execution_status.value if e.execution_status else None,
                "drift_detected": bool(e.drift_detected),
            }
            for e in executions
        ],
        "inspections": [
            {
                "inspection_id": i.inspection_id,
                "quantity_inspected": i.quantity_inspected,
                "quantity_passed": i.quantity_passed,
                "quantity_failed": i.quantity_failed,
                "status": i.inspection_status.value if i.inspection_status else None,
            }
            for i in inspections
        ],
        "defects": [
            {
                "defect_id": d.defect_id,
                "severity": d.severity.value if d.severity else None,
                "category": d.defect_category.value if d.defect_category else None,
                "quantity": d.defect_quantity,
                "status": d.defect_status.value if d.defect_status else None,
            }
            for d in defects
        ],
    }


@router.get("/lot/{lot_id}")
def trace_lot(
    lot_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Upstream and downstream traceability for a material lot."""
    from app.models.material_lot import MaterialLot
    from app.models.consumption import MaterialConsumption
    from app.models.defect import Defect

    lot = db.query(MaterialLot).filter(MaterialLot.lot_id == lot_id).first()
    if not lot:
        raise HTTPException(404, f"Material lot '{lot_id}' not found")

    consumptions = db.query(MaterialConsumption).filter(
        MaterialConsumption.lot_id == lot.id
    ).all()

    downstream_orders = []
    all_defects = []
    for c in consumptions:
        if c.production_order:
            order = c.production_order
            downstream_orders.append({
                "order_id": order.order_id,
                "product_name": order.product.name if order.product else "Unknown",
                "status": order.production_status.value if order.production_status else None,
                "consumed_quantity": c.consumed_quantity,
            })

    defects = db.query(Defect).filter(Defect.material_lot_id == lot.id).all()

    return {
        "lot": {
            "lot_id": lot.lot_id,
            "material_name": lot.material.name if lot.material else "Unknown",
            "received_quantity": lot.received_quantity,
            "available_quantity": lot.available_quantity,
            "lot_status": lot.lot_status.value if lot.lot_status else None,
        },
        "upstream": {
            "supplier_id": lot.supplier.supplier_id if lot.supplier else None,
            "supplier_name": lot.supplier.name if lot.supplier else None,
            "supplier_country": lot.supplier.country if lot.supplier else None,
            "received_date": str(lot.received_date),
        },
        "downstream_production_orders": downstream_orders,
        "associated_defects": [
            {
                "defect_id": d.defect_id,
                "severity": d.severity.value if d.severity else None,
                "confirmed": bool(d.lot_link_confirmed),
            }
            for d in defects
        ],
    }


@router.get("/supplier/{supplier_id}")
def trace_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Traceability for a supplier."""
    from app.models.supplier import Supplier
    from app.models.material_lot import MaterialLot
    from app.models.defect import Defect
    from sqlalchemy import func

    supplier = db.query(Supplier).filter(Supplier.supplier_id == supplier_id).first()
    if not supplier:
        raise HTTPException(404, f"Supplier '{supplier_id}' not found")

    lots = db.query(MaterialLot).filter(MaterialLot.supplier_id == supplier.id).all()
    lot_ids = [l.id for l in lots]

    defect_count = db.query(func.count(Defect.id)).filter(
        Defect.material_lot_id.in_(lot_ids)
    ).scalar() if lot_ids else 0

    return {
        "supplier": {
            "supplier_id": supplier.supplier_id,
            "name": supplier.name,
            "country": supplier.country,
            "quality_rating": supplier.quality_rating,
        },
        "total_lots": len(lots),
        "defect_count": defect_count,
        "lots": [
            {
                "lot_id": l.lot_id,
                "material_name": l.material.name if l.material else "Unknown",
                "received_quantity": l.received_quantity,
                "available_quantity": l.available_quantity,
                "lot_status": l.lot_status.value if l.lot_status else None,
            }
            for l in lots[:20]  # limit for performance
        ],
    }


@router.get("/capa/{capa_id}")
def trace_capa(
    capa_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Full traceability for a CAPA."""
    from app.models.capa import CorrectiveAction, CAPAVerification
    from app.models.defect import Defect
    from app.models.audit import EntityEventHistory

    capa = db.query(CorrectiveAction).filter(CorrectiveAction.capa_id == capa_id).first()
    if not capa:
        raise HTTPException(404, f"CAPA '{capa_id}' not found")

    defect = capa.defect
    verifications = db.query(CAPAVerification).filter(
        CAPAVerification.capa_id == capa.id
    ).all()
    events = db.query(EntityEventHistory).filter(
        EntityEventHistory.entity_type == "CAPA",
        EntityEventHistory.entity_id == capa_id,
    ).order_by(EntityEventHistory.created_at).all()

    defect_trace = None
    if defect:
        defect_trace = build_defect_trace(defect, db)

    return {
        "capa": {
            "capa_id": capa.capa_id,
            "status": capa.capa_status.value if capa.capa_status else None,
            "priority": capa.priority.value if capa.priority else None,
            "assigned_engineer": capa.assigned_engineer,
            "target_date": str(capa.target_date) if capa.target_date else None,
            "completion_date": str(capa.completion_date) if capa.completion_date else None,
            "verification_status": capa.verification_status.value if capa.verification_status else None,
        },
        "defect_trace": defect_trace,
        "verifications": [
            {
                "verified_by": v.verified_by,
                "verification_date": str(v.verification_date),
                "status": v.verification_status.value if v.verification_status else None,
                "notes": v.notes,
            }
            for v in verifications
        ],
        "lifecycle_events": [
            {
                "event_type": e.event_type,
                "from_status": e.from_status,
                "to_status": e.to_status,
                "performed_by": e.performed_by,
                "timestamp": str(e.created_at),
            }
            for e in events
        ],
    }


@router.get("/search")
def global_trace_search(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Global search across all traceable entities."""
    results = []

    from app.models.defect import Defect
    from app.models.production import ProductionOrder
    from app.models.material_lot import MaterialLot
    from app.models.supplier import Supplier
    from app.models.machine import Machine
    from app.models.capa import CorrectiveAction

    # Search defects
    defects = db.query(Defect).filter(Defect.defect_id.ilike(f"%{q}%")).limit(5).all()
    for d in defects:
        results.append({"type": "defect", "id": d.defect_id, "description": d.description[:80]})

    # Search orders
    orders = db.query(ProductionOrder).filter(ProductionOrder.order_id.ilike(f"%{q}%")).limit(5).all()
    for o in orders:
        results.append({"type": "production_order", "id": o.order_id,
                        "description": f"Product: {o.product.name if o.product else 'Unknown'}"})

    # Search lots
    lots = db.query(MaterialLot).filter(MaterialLot.lot_id.ilike(f"%{q}%")).limit(5).all()
    for l in lots:
        results.append({"type": "material_lot", "id": l.lot_id,
                        "description": f"Material: {l.material.name if l.material else 'Unknown'}"})

    # Search suppliers
    suppliers = db.query(Supplier).filter(
        Supplier.supplier_id.ilike(f"%{q}%") | Supplier.name.ilike(f"%{q}%")
    ).limit(5).all()
    for s in suppliers:
        results.append({"type": "supplier", "id": s.supplier_id, "description": s.name})

    # Search CAPAs
    capas = db.query(CorrectiveAction).filter(CorrectiveAction.capa_id.ilike(f"%{q}%")).limit(5).all()
    for c in capas:
        results.append({"type": "capa", "id": c.capa_id,
                        "description": f"Status: {c.capa_status.value if c.capa_status else 'Unknown'}"})

    return {"query": q, "results": results, "total": len(results)}
