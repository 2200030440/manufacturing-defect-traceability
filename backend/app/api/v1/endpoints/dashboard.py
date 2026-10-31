from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user
from datetime import date, timedelta

router = APIRouter()


@router.get("/kpis")
def dashboard_kpis(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """All dashboard KPIs from actual database records."""
    from app.models.product import Product
    from app.models.supplier import Supplier
    from app.models.material_lot import MaterialLot
    from app.models.production import ProductionOrder
    from app.models.inspection import InspectionResult
    from app.models.defect import Defect, DefectStatus
    from app.models.capa import CorrectiveAction, CAPAStatus, VerificationStatus
    from app.models.exception import ExceptionRecord, ExceptionResolutionStatus

    # Basic counts
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_suppliers = db.query(func.count(Supplier.id)).scalar() or 0
    total_lots = db.query(func.count(MaterialLot.id)).scalar() or 0
    total_orders = db.query(func.count(ProductionOrder.id)).scalar() or 0
    total_inspections = db.query(func.count(InspectionResult.id)).scalar() or 0
    total_defects = db.query(func.count(Defect.id)).scalar() or 0

    # Units produced
    total_produced = db.query(func.coalesce(func.sum(ProductionOrder.actual_quantity), 0)).scalar() or 0
    total_scrap = db.query(func.coalesce(func.sum(ProductionOrder.scrap_quantity), 0)).scalar() or 0
    total_rework = db.query(func.coalesce(func.sum(ProductionOrder.rework_quantity), 0)).scalar() or 0

    # Defect rate
    total_inspected = db.query(func.coalesce(func.sum(InspectionResult.quantity_inspected), 0)).scalar() or 1
    total_failed = db.query(func.coalesce(func.sum(InspectionResult.quantity_failed), 0)).scalar() or 0
    defect_rate = round(float(total_failed) / max(float(total_inspected), 1) * 100, 2)

    # CAPA
    open_capa = db.query(func.count(CorrectiveAction.id)).filter(
        CorrectiveAction.capa_status.in_([CAPAStatus.OPEN, CAPAStatus.IN_PROGRESS])
    ).scalar() or 0
    pending_verification = db.query(func.count(CorrectiveAction.id)).filter(
        CorrectiveAction.capa_status == CAPAStatus.PENDING_VERIFICATION
    ).scalar() or 0

    # Traceability coverage
    defects_with_lot = db.query(func.count(Defect.id)).filter(
        Defect.material_lot_id.isnot(None),
        Defect.production_order_id.isnot(None),
        Defect.inspection_id.isnot(None),
    ).scalar() or 0
    traceability_coverage = round(defects_with_lot / max(total_defects, 1) * 100, 1)

    # Data quality exceptions
    data_exceptions = db.query(func.count(ExceptionRecord.id)).filter(
        ExceptionRecord.resolution_status == ExceptionResolutionStatus.OPEN
    ).scalar() or 0

    return {
        "total_products": total_products,
        "total_suppliers": total_suppliers,
        "total_material_lots": total_lots,
        "total_production_orders": total_orders,
        "total_units_produced": float(total_produced),
        "total_inspections": total_inspections,
        "total_defects": total_defects,
        "overall_defect_rate": defect_rate,
        "scrap_quantity": float(total_scrap),
        "rework_quantity": float(total_rework),
        "open_capa": open_capa,
        "pending_verification": pending_verification,
        "traceability_coverage": traceability_coverage,
        "data_quality_exceptions": data_exceptions,
    }


@router.get("/recent-activity")
def recent_activity(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Recent system events from audit log and entity events."""
    from app.models.audit import EntityEventHistory
    from app.models.defect import Defect
    from app.models.capa import CorrectiveAction
    from app.models.inspection import InspectionResult

    events = db.query(EntityEventHistory).order_by(
        EntityEventHistory.created_at.desc()
    ).limit(20).all()

    activities = []
    for e in events:
        activities.append({
            "entity_type": e.entity_type,
            "entity_id": e.entity_id,
            "event_type": e.event_type,
            "description": e.description or f"{e.entity_type} {e.event_type}",
            "performed_by": e.performed_by,
            "timestamp": str(e.created_at),
        })

    # Also include recent defects
    recent_defects = db.query(Defect).order_by(Defect.created_at.desc()).limit(5).all()
    for d in recent_defects:
        activities.append({
            "entity_type": "Defect",
            "entity_id": d.defect_id,
            "event_type": "CREATED",
            "description": f"Defect {d.defect_id}: {d.description[:60]}",
            "performed_by": None,
            "timestamp": str(d.created_at),
        })

    # Sort by timestamp
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities[:20]
