from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
import threading
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

_generation_status = {"running": False, "progress": 0, "message": "Idle", "completed": False}


def run_generator(config: dict, db_url: str):
    global _generation_status
    _generation_status = {"running": True, "progress": 0, "message": "Starting generation...", "completed": False}
    try:
        from data_generator.generator import DataGenerator
        gen = DataGenerator(db_url=db_url, seed=config.get("seed", 20261022))
        gen.generate(config)
        _generation_status = {"running": False, "progress": 100, "message": "Generation complete!", "completed": True}
    except Exception as e:
        logger.error(f"Generator error: {e}")
        _generation_status = {"running": False, "progress": 0, "message": f"Error: {str(e)}", "completed": False}


@router.post("/generate")
def generate_data(
    background_tasks: BackgroundTasks,
    seed: int = 20261022,
    n_products: int = 200,
    n_suppliers: int = 50,
    n_lots: int = 2000,
    n_orders: int = 5000,
    n_inspections: int = 20000,
    include_anomalies: bool = True,
    current_user=Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    global _generation_status
    if _generation_status["running"]:
        raise HTTPException(400, "Data generation is already running")

    from app.core.config import settings
    config = {
        "seed": seed,
        "n_products": n_products,
        "n_suppliers": n_suppliers,
        "n_lots": n_lots,
        "n_orders": n_orders,
        "n_inspections": n_inspections,
        "include_anomalies": include_anomalies,
    }
    thread = threading.Thread(target=run_generator, args=(config, settings.DATABASE_URL))
    thread.daemon = True
    thread.start()

    return {"message": "Data generation started in background", "config": config}


@router.get("/status")
def generation_status(current_user=Depends(get_current_user)):
    return _generation_status


@router.post("/reset")
def reset_data(
    current_user=Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Reset all generated data (keeps users and roles)."""
    from app.models.capa import CAPAVerification, CorrectiveAction
    from app.models.defect import DefectContainment, Defect
    from app.models.inspection import InspectionResult, InspectionPlan
    from app.models.process import ProductionStepExecution, ProcessStep
    from app.models.consumption import MaterialConsumption
    from app.models.production import ProductionOutput, ProductionOrder
    from app.models.material_lot import MaterialTransaction, MaterialLot
    from app.models.bom import BOMComponent
    from app.models.exception import ExceptionRecord
    from app.models.audit import EntityEventHistory, AuditLog
    from app.models.machine import Machine
    from app.models.supplier import Supplier
    from app.models.product import Product, Material

    tables = [
        CAPAVerification, CorrectiveAction, DefectContainment, Defect,
        InspectionResult, InspectionPlan, ProductionStepExecution, ProcessStep,
        MaterialConsumption, ProductionOutput, ProductionOrder,
        MaterialTransaction, MaterialLot, BOMComponent, ExceptionRecord,
        EntityEventHistory, AuditLog, Machine, Supplier, Material, Product
    ]

    for table in tables:
        db.query(table).delete()
    db.commit()
    return {"message": "All generated data has been reset"}
