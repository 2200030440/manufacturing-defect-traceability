"""
ID generation service for all entities.
Provides deterministic, sequential IDs with proper formatting.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func


def next_seq(db: Session, model, id_column: str, prefix: str, pad: int = 6) -> str:
    """Generate next sequential ID for a model."""
    from sqlalchemy import text
    last = db.query(model).order_by(model.id.desc()).first()
    if last:
        last_id = getattr(last, id_column)
        # Extract number from ID
        try:
            num_part = last_id.split("-")[-1]
            num = int(num_part) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"{prefix}{str(num).zfill(pad)}"


def generate_product_id(db: Session) -> str:
    from app.models.product import Product
    return next_seq(db, Product, "product_id", "PROD-")


def generate_material_id(db: Session) -> str:
    from app.models.product import Material
    return next_seq(db, Material, "material_id", "MAT-")


def generate_bom_id(db: Session) -> str:
    from app.models.bom import BOMComponent
    return next_seq(db, BOMComponent, "bom_id", "BOM-")


def generate_supplier_id(db: Session) -> str:
    from app.models.supplier import Supplier
    return next_seq(db, Supplier, "supplier_id", "SUP-")


def generate_lot_id(db: Session, supplier_id: str, year: int = 2026) -> str:
    from app.models.material_lot import MaterialLot
    supplier_short = supplier_id.replace("SUP-", "")
    prefix = f"LOT-{supplier_short}-{year}-"
    last = db.query(MaterialLot).filter(
        MaterialLot.lot_id.like(f"{prefix}%")
    ).order_by(MaterialLot.id.desc()).first()
    if last:
        try:
            num = int(last.lot_id.split("-")[-1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"{prefix}{str(num).zfill(6)}"


def generate_order_id(db: Session, year: int = 2026) -> str:
    from app.models.production import ProductionOrder
    prefix = f"WO-{year}-"
    last = db.query(ProductionOrder).filter(
        ProductionOrder.order_id.like(f"{prefix}%")
    ).order_by(ProductionOrder.id.desc()).first()
    if last:
        try:
            num = int(last.order_id.split("-")[-1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"{prefix}{str(num).zfill(6)}"


def generate_machine_id(db: Session) -> str:
    from app.models.machine import Machine
    return next_seq(db, Machine, "machine_id", "MCH-")


def generate_step_id(db: Session) -> str:
    from app.models.process import ProcessStep
    return next_seq(db, ProcessStep, "step_id", "STP-")


def generate_execution_id(db: Session) -> str:
    from app.models.process import ProductionStepExecution
    return next_seq(db, ProductionStepExecution, "execution_id", "EXE-")


def generate_plan_id(db: Session) -> str:
    from app.models.inspection import InspectionPlan
    return next_seq(db, InspectionPlan, "plan_id", "PLAN-")


def generate_inspection_id(db: Session, order_id: str) -> str:
    from app.models.inspection import InspectionResult
    order_short = order_id.replace("WO-", "").replace("-", "")
    prefix = f"INSP-{order_short}-"
    last = db.query(InspectionResult).filter(
        InspectionResult.inspection_id.like(f"{prefix}%")
    ).order_by(InspectionResult.id.desc()).first()
    if last:
        try:
            num = int(last.inspection_id.split("-")[-1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"{prefix}{str(num).zfill(3)}"


def generate_defect_id(db: Session, year: int = 2026) -> str:
    from app.models.defect import Defect
    prefix = f"DEF-{year}-"
    last = db.query(Defect).filter(
        Defect.defect_id.like(f"{prefix}%")
    ).order_by(Defect.id.desc()).first()
    if last:
        try:
            num = int(last.defect_id.split("-")[-1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"{prefix}{str(num).zfill(6)}"


def generate_containment_id(db: Session) -> str:
    from app.models.defect import DefectContainment
    return next_seq(db, DefectContainment, "containment_id", "CON-")


def generate_capa_id(db: Session, year: int = 2026) -> str:
    from app.models.capa import CorrectiveAction
    prefix = f"CAPA-{year}-"
    last = db.query(CorrectiveAction).filter(
        CorrectiveAction.capa_id.like(f"{prefix}%")
    ).order_by(CorrectiveAction.id.desc()).first()
    if last:
        try:
            num = int(last.capa_id.split("-")[-1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"{prefix}{str(num).zfill(6)}"


def generate_consumption_id(db: Session) -> str:
    from app.models.consumption import MaterialConsumption
    return next_seq(db, MaterialConsumption, "consumption_id", "CON-MC-")


def generate_exception_id(db: Session) -> str:
    from app.models.exception import ExceptionRecord
    return next_seq(db, ExceptionRecord, "exception_id", "EXC-")
