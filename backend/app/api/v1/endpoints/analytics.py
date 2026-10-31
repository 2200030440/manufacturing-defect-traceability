from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case
from typing import Optional
from datetime import datetime, date, timedelta
from app.core.database import get_db
from app.core.security import get_current_user

router = APIRouter()


@router.get("/defects-over-time")
def defects_over_time(
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.defect import Defect
    cutoff = date.today() - timedelta(days=days)

    results = db.query(
        func.date(Defect.detection_date).label("date"),
        func.count(Defect.id).label("count"),
        func.sum(Defect.defect_quantity).label("quantity"),
    ).filter(
        Defect.detection_date >= cutoff
    ).group_by(func.date(Defect.detection_date)).order_by(
        func.date(Defect.detection_date)
    ).all()

    return [{"date": str(r.date), "count": r.count, "quantity": float(r.quantity or 0)}
            for r in results]


@router.get("/defects-by-category")
def defects_by_category(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.defect import Defect
    results = db.query(
        Defect.defect_category,
        func.count(Defect.id).label("count"),
        func.sum(Defect.defect_quantity).label("quantity"),
    ).group_by(Defect.defect_category).all()
    return [{"category": r.defect_category.value if r.defect_category else "UNKNOWN",
             "count": r.count, "quantity": float(r.quantity or 0)} for r in results]


@router.get("/defects-by-severity")
def defects_by_severity(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.defect import Defect
    results = db.query(
        Defect.severity,
        func.count(Defect.id).label("count"),
    ).group_by(Defect.severity).all()
    return [{"severity": r.severity.value if r.severity else "UNKNOWN", "count": r.count}
            for r in results]


@router.get("/supplier-quality")
def supplier_quality(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.supplier import Supplier
    from app.models.material_lot import MaterialLot
    from app.models.defect import Defect
    from app.models.consumption import MaterialConsumption
    from app.models.inspection import InspectionResult

    suppliers = db.query(Supplier).limit(20).all()
    result = []
    for s in suppliers:
        lot_ids = [row.id for row in db.query(MaterialLot.id).filter(
            MaterialLot.supplier_id == s.id
        ).all()]
        defect_qty = 0
        if lot_ids:
            defect_qty = db.query(func.coalesce(func.sum(Defect.defect_quantity), 0)).filter(
                Defect.material_lot_id.in_(lot_ids)
            ).scalar() or 0
        result.append({
            "supplier_id": s.supplier_id,
            "supplier_name": s.name,
            "quality_rating": s.quality_rating,
            "total_lots": len(lot_ids),
            "defect_quantity": float(defect_qty),
        })
    return sorted(result, key=lambda x: x["defect_quantity"], reverse=True)


@router.get("/machine-defects")
def machine_defects(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.defect import Defect
    from app.models.machine import Machine
    results = db.query(
        Machine.machine_id,
        Machine.name,
        Machine.machine_type,
        func.count(Defect.id).label("defect_count"),
        func.sum(Defect.defect_quantity).label("defect_quantity"),
    ).join(Defect, Defect.machine_id == Machine.id, isouter=True).group_by(
        Machine.machine_id, Machine.name, Machine.machine_type
    ).order_by(func.count(Defect.id).desc()).all()

    return [{"machine_id": r.machine_id, "machine_name": r.name, "machine_type": r.machine_type,
             "defect_count": r.defect_count or 0, "defect_quantity": float(r.defect_quantity or 0)}
            for r in results]


@router.get("/inspection-trends")
def inspection_trends(
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.inspection import InspectionResult
    cutoff = date.today() - timedelta(days=days)
    results = db.query(
        func.date(InspectionResult.inspection_date).label("date"),
        func.sum(InspectionResult.quantity_passed).label("passed"),
        func.sum(InspectionResult.quantity_failed).label("failed"),
        func.sum(InspectionResult.quantity_inspected).label("inspected"),
    ).filter(
        InspectionResult.inspection_date >= cutoff
    ).group_by(func.date(InspectionResult.inspection_date)).order_by(
        func.date(InspectionResult.inspection_date)
    ).all()
    return [{"date": str(r.date), "passed": float(r.passed or 0), "failed": float(r.failed or 0),
             "inspected": float(r.inspected or 0),
             "defect_rate": round(float(r.failed or 0) / max(float(r.inspected or 1), 1) * 100, 2)}
            for r in results]


@router.get("/capa-status")
def capa_status_distribution(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.capa import CorrectiveAction
    results = db.query(
        CorrectiveAction.capa_status,
        func.count(CorrectiveAction.id).label("count"),
    ).group_by(CorrectiveAction.capa_status).all()
    return [{"status": r.capa_status.value if r.capa_status else "UNKNOWN", "count": r.count}
            for r in results]


@router.get("/scrap-rework")
def scrap_rework_analysis(
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.production import ProductionOrder
    from datetime import date, timedelta
    cutoff = date.today() - timedelta(days=days)
    results = db.query(
        func.coalesce(func.sum(ProductionOrder.actual_quantity), 0).label("produced"),
        func.coalesce(func.sum(ProductionOrder.scrap_quantity), 0).label("scrapped"),
        func.coalesce(func.sum(ProductionOrder.rework_quantity), 0).label("reworked"),
    ).filter(ProductionOrder.start_date >= cutoff).first()

    produced = float(results.produced or 0)
    scrapped = float(results.scrapped or 0)
    reworked = float(results.reworked or 0)
    return {
        "produced": produced,
        "scrapped": scrapped,
        "reworked": reworked,
        "scrap_rate": round(scrapped / max(produced, 1) * 100, 2),
        "rework_rate": round(reworked / max(produced, 1) * 100, 2),
    }


@router.get("/production-performance")
def production_performance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.production import ProductionOrder, ProductionStatus
    results = db.query(
        ProductionOrder.production_status,
        func.count(ProductionOrder.id).label("count"),
        func.sum(ProductionOrder.planned_quantity).label("planned"),
        func.sum(ProductionOrder.actual_quantity).label("actual"),
    ).group_by(ProductionOrder.production_status).all()

    return [{"status": r.production_status.value if r.production_status else "UNKNOWN",
             "count": r.count, "planned": float(r.planned or 0), "actual": float(r.actual or 0)}
            for r in results]
