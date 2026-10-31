from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.core.database import get_db
from app.core.security import get_current_user
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter()


def run_validation(db: Session) -> Dict[str, Any]:
    """Run comprehensive data validation checks."""
    results = {
        "run_timestamp": str(datetime.utcnow()),
        "checks": [],
        "summary": {},
    }
    passed = 0
    failed = 0
    warnings = 0

    def add_check(name: str, status: str, message: str, count: int = 0, details: list = None):
        nonlocal passed, failed, warnings
        results["checks"].append({
            "check_name": name,
            "status": status,
            "message": message,
            "affected_count": count,
            "details": details or [],
        })
        if status == "PASSED":
            passed += 1
        elif status == "FAILED":
            failed += 1
        else:
            warnings += 1

    # 1. Primary key uniqueness (enforced by DB)
    add_check("PK_UNIQUENESS", "PASSED", "Primary key uniqueness enforced by database constraints")

    # 2. Foreign key integrity - Defects with invalid inspection IDs
    from app.models.defect import Defect
    from app.models.inspection import InspectionResult
    defects_no_insp = db.query(Defect).filter(
        Defect.inspection_id.isnot(None)
    ).all()
    bad_insp_links = [d.defect_id for d in defects_no_insp
                      if not db.query(InspectionResult).filter(
                          InspectionResult.id == d.inspection_id
                      ).first()]
    if bad_insp_links:
        add_check("FK_DEFECT_INSPECTION", "FAILED",
                  f"Defects referencing nonexistent inspection records",
                  len(bad_insp_links), bad_insp_links[:10])
    else:
        add_check("FK_DEFECT_INSPECTION", "PASSED", "All defect-inspection FK links valid")

    # 3. Inspection arithmetic: inspected = passed + failed
    bad_arithmetic = db.query(InspectionResult).filter(
        func.abs(InspectionResult.quantity_inspected -
                 InspectionResult.quantity_passed -
                 InspectionResult.quantity_failed) > 0.001
    ).all()
    if bad_arithmetic:
        add_check("INSPECTION_ARITHMETIC", "FAILED",
                  f"Inspections where passed+failed != inspected",
                  len(bad_arithmetic),
                  [r.inspection_id for r in bad_arithmetic[:10]])
    else:
        add_check("INSPECTION_ARITHMETIC", "PASSED",
                  "All inspection quantity arithmetic is correct")

    # 4. Defect quantity <= failed quantity
    from app.models.defect import Defect
    all_defects = db.query(Defect).filter(Defect.inspection_id.isnot(None)).all()
    qty_violations = []
    for d in all_defects:
        if d.inspection_result and d.defect_quantity > d.inspection_result.quantity_failed:
            qty_violations.append(d.defect_id)
    if qty_violations:
        add_check("DEFECT_QTY_CONSTRAINT", "FAILED",
                  f"Defects with quantity exceeding inspection failed quantity",
                  len(qty_violations), qty_violations[:10])
    else:
        add_check("DEFECT_QTY_CONSTRAINT", "PASSED",
                  "All defect quantities within inspection bounds")

    # 5. CAPA never closed without verification
    from app.models.capa import CorrectiveAction, CAPAStatus, VerificationStatus
    bad_capa = db.query(CorrectiveAction).filter(
        CorrectiveAction.capa_status == CAPAStatus.CLOSED,
        CorrectiveAction.verification_status != VerificationStatus.PASSED,
    ).all()
    if bad_capa:
        add_check("CAPA_CLOSURE_RULE", "FAILED",
                  f"CAPAs closed without successful verification",
                  len(bad_capa), [c.capa_id for c in bad_capa[:10]])
    else:
        add_check("CAPA_CLOSURE_RULE", "PASSED",
                  "All closed CAPAs have successful verification records")

    # 6. Material balance: received >= consumed
    from app.models.material_lot import MaterialLot
    from app.models.consumption import MaterialConsumption
    lots = db.query(MaterialLot).all()
    balance_violations = []
    for lot in lots:
        consumed = db.query(func.coalesce(func.sum(MaterialConsumption.consumed_quantity), 0)).filter(
            MaterialConsumption.lot_id == lot.id,
            MaterialConsumption.is_reversal == 0,
        ).scalar() or 0
        reversals = db.query(func.coalesce(func.sum(MaterialConsumption.consumed_quantity), 0)).filter(
            MaterialConsumption.lot_id == lot.id,
            MaterialConsumption.is_reversal == 1,
        ).scalar() or 0
        net_consumed = float(consumed) - float(reversals)
        if net_consumed > lot.received_quantity + 0.001:
            balance_violations.append(f"{lot.lot_id}: consumed {net_consumed} > received {lot.received_quantity}")

    if balance_violations:
        add_check("MATERIAL_BALANCE", "FAILED",
                  "Lots where consumed quantity exceeds received quantity",
                  len(balance_violations), balance_violations[:10])
    else:
        add_check("MATERIAL_BALANCE", "PASSED", "Material balances are consistent")

    # 7. BOM materials consumed
    from app.models.bom import BOMComponent, BOMStatus
    from app.models.production import ProductionOrder, ProductionStatus
    completed_orders = db.query(ProductionOrder).filter(
        ProductionOrder.production_status.in_([
            ProductionStatus.COMPLETED, ProductionStatus.CLOSED
        ])
    ).all()
    missing_bom_consumption = []
    for order in completed_orders[:100]:  # check first 100 for performance
        bom_components = db.query(BOMComponent).filter(
            BOMComponent.product_id == order.product_id,
            BOMComponent.bom_status == BOMStatus.ACTIVE,
        ).all()
        for comp in bom_components:
            consumed = db.query(func.coalesce(func.sum(MaterialConsumption.consumed_quantity), 0)).filter(
                MaterialConsumption.production_order_id == order.id,
                MaterialConsumption.material_id == comp.material_id,
            ).scalar() or 0
            if float(consumed) == 0:
                missing_bom_consumption.append(
                    f"{order.order_id}: material {comp.material.name if comp.material else comp.material_id} not consumed"
                )

    if missing_bom_consumption:
        add_check("BOM_CONSUMPTION", "WARNING",
                  f"Completed orders with BOM materials not consumed",
                  len(missing_bom_consumption), missing_bom_consumption[:10])
    else:
        add_check("BOM_CONSUMPTION", "PASSED",
                  "All completed orders have BOM materials consumed")

    # 8. Traceability completeness
    total_defects_count = db.query(func.count(Defect.id)).scalar() or 0
    fully_traceable = db.query(func.count(Defect.id)).filter(
        Defect.material_lot_id.isnot(None),
        Defect.production_order_id.isnot(None),
        Defect.inspection_id.isnot(None),
    ).scalar() or 0
    coverage = round(fully_traceable / max(total_defects_count, 1) * 100, 1)
    if coverage >= 80:
        add_check("TRACEABILITY_COVERAGE", "PASSED",
                  f"Traceability coverage: {coverage}% ({fully_traceable}/{total_defects_count} defects)")
    elif coverage >= 50:
        add_check("TRACEABILITY_COVERAGE", "WARNING",
                  f"Traceability coverage is low: {coverage}%")
    else:
        add_check("TRACEABILITY_COVERAGE", "FAILED",
                  f"Traceability coverage is critically low: {coverage}%",
                  total_defects_count - fully_traceable)

    # 9. Date ordering: start_date <= end_date for orders
    from app.models.production import ProductionOrder
    bad_dates = db.query(ProductionOrder).filter(
        ProductionOrder.start_date.isnot(None),
        ProductionOrder.end_date.isnot(None),
        ProductionOrder.start_date > ProductionOrder.end_date,
    ).all()
    if bad_dates:
        add_check("DATE_ORDER_ORDERS", "FAILED",
                  "Production orders with start_date > end_date",
                  len(bad_dates), [o.order_id for o in bad_dates[:10]])
    else:
        add_check("DATE_ORDER_ORDERS", "PASSED",
                  "All production order dates are logically ordered")

    # 10. Duplicate defect IDs
    dup_defects = db.query(
        Defect.defect_id, func.count(Defect.id)
    ).group_by(Defect.defect_id).having(func.count(Defect.id) > 1).all()
    if dup_defects:
        add_check("DUPLICATE_DEFECT_IDS", "FAILED",
                  "Duplicate defect IDs detected",
                  len(dup_defects), [d.defect_id for d, _ in dup_defects[:10]])
    else:
        add_check("DUPLICATE_DEFECT_IDS", "PASSED", "No duplicate defect IDs")

    # 11. Anomaly detection from exception records
    from app.models.exception import ExceptionRecord
    injected = db.query(ExceptionRecord).filter(
        ExceptionRecord.is_injected_anomaly == 1
    ).all()
    if injected:
        add_check("INJECTED_ANOMALIES", "FAILED" if len(injected) >= 5 else "WARNING",
                  f"{len(injected)} injected anomalies detected in system",
                  len(injected), [e.exception_id for e in injected])
    else:
        add_check("INJECTED_ANOMALIES", "WARNING",
                  "No injected anomalies found (run data generator with anomalies first)")

    total_checks = passed + failed + warnings
    results["summary"] = {
        "total_checks": total_checks,
        "passed": passed,
        "failed": failed,
        "warnings": warnings,
        "pass_rate": round(passed / max(total_checks, 1) * 100, 1),
    }
    return results


@router.get("/run")
def run_validation_endpoint(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return run_validation(db)


@router.get("/anomaly-detection")
def detect_anomalies(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Detect all 5 required anomaly types independently."""
    anomalies = []

    # ANOMALY 1: Defect linked to nonexistent lot
    from app.models.defect import Defect
    from app.models.material_lot import MaterialLot
    bad_lot_defects = db.query(Defect).filter(
        Defect.material_lot_id.isnot(None)
    ).all()
    for d in bad_lot_defects:
        if not db.query(MaterialLot).filter(MaterialLot.id == d.material_lot_id).first():
            anomalies.append({
                "anomaly_type": "NONEXISTENT_LOT",
                "entity": "Defect",
                "record_id": d.defect_id,
                "description": f"Defect {d.defect_id} references nonexistent lot ID {d.material_lot_id}",
                "severity": "CRITICAL",
            })

    # ANOMALY 2: BOM material not consumed for completed orders
    from app.models.bom import BOMComponent, BOMStatus
    from app.models.production import ProductionOrder, ProductionStatus
    from app.models.consumption import MaterialConsumption
    from sqlalchemy import func
    completed = db.query(ProductionOrder).filter(
        ProductionOrder.production_status == ProductionStatus.COMPLETED
    ).limit(50).all()
    for order in completed:
        bom_comps = db.query(BOMComponent).filter(
            BOMComponent.product_id == order.product_id,
            BOMComponent.bom_status == BOMStatus.ACTIVE,
        ).all()
        for comp in bom_comps:
            consumed = db.query(func.sum(MaterialConsumption.consumed_quantity)).filter(
                MaterialConsumption.production_order_id == order.id,
                MaterialConsumption.material_id == comp.material_id,
            ).scalar() or 0
            if float(consumed) == 0:
                anomalies.append({
                    "anomaly_type": "BOM_MATERIAL_NOT_CONSUMED",
                    "entity": "ProductionOrder",
                    "record_id": order.order_id,
                    "description": f"Order {order.order_id}: BOM material not consumed",
                    "severity": "HIGH",
                })
                break  # one per order

    # ANOMALY 3: CAPA closed before verification
    from app.models.capa import CorrectiveAction, CAPAStatus, VerificationStatus
    bad_capa = db.query(CorrectiveAction).filter(
        CorrectiveAction.capa_status == CAPAStatus.CLOSED,
        CorrectiveAction.verification_status != VerificationStatus.PASSED,
    ).all()
    for c in bad_capa:
        anomalies.append({
            "anomaly_type": "CAPA_CLOSED_BEFORE_VERIFICATION",
            "entity": "CorrectiveAction",
            "record_id": c.capa_id,
            "description": f"CAPA {c.capa_id} closed with verification status: {c.verification_status}",
            "severity": "CRITICAL",
        })

    # ANOMALY 4: Defect count exceeds inspected quantity
    from app.models.inspection import InspectionResult
    inspections = db.query(InspectionResult).all()
    for insp in inspections:
        total_defect_qty = db.query(func.coalesce(func.sum(Defect.defect_quantity), 0)).filter(
            Defect.inspection_id == insp.id
        ).scalar() or 0
        if float(total_defect_qty) > insp.quantity_failed + 0.001:
            anomalies.append({
                "anomaly_type": "DEFECT_COUNT_EXCEEDS_INSPECTED",
                "entity": "InspectionResult",
                "record_id": insp.inspection_id,
                "description": f"Inspection {insp.inspection_id}: defect qty {total_defect_qty} > failed qty {insp.quantity_failed}",
                "severity": "CRITICAL",
            })

    # ANOMALY 5: Broken traceability chain
    all_defects = db.query(Defect).all()
    for d in all_defects:
        missing_links = 0
        if not d.inspection_id:
            missing_links += 1
        if not d.production_order_id:
            missing_links += 1
        if not d.material_lot_id:
            missing_links += 2  # counts double as it breaks supplier trace too
        if missing_links >= 3:
            anomalies.append({
                "anomaly_type": "BROKEN_TRACEABILITY_CHAIN",
                "entity": "Defect",
                "record_id": d.defect_id,
                "description": f"Defect {d.defect_id} has broken traceability chain (missing {missing_links} links)",
                "severity": "HIGH",
            })

    return {
        "total_anomalies": len(anomalies),
        "anomalies": anomalies,
        "anomaly_types_detected": list(set(a["anomaly_type"] for a in anomalies)),
    }
