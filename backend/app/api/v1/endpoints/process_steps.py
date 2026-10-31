from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.process import ProcessStep, ProductionStepExecution
from app.schemas.machine import (
    ProcessStepCreate, ProcessStepUpdate, ProcessStep as StepSchema,
    StepExecutionCreate, StepExecutionUpdate, StepExecution
)
from app.services.id_generator import generate_step_id, generate_execution_id

router = APIRouter()


@router.get("/", response_model=List[StepSchema])
def list_process_steps(
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(ProcessStep)
    if product_id:
        q = q.filter(ProcessStep.product_id == product_id)
    return q.order_by(ProcessStep.sequence_number).all()


@router.post("/", response_model=StepSchema, status_code=201)
def create_process_step(
    data: ProcessStepCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    step_id = generate_step_id(db)
    step = ProcessStep(**data.dict(), step_id=step_id)
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


@router.get("/all/simple")
def list_steps_simple(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    steps = db.query(ProcessStep).filter(
        ProcessStep.lifecycle_status == "ACTIVE"
    ).order_by(ProcessStep.sequence_number).all()
    return [{"id": s.id, "step_id": s.step_id, "name": s.name, "sequence_number": s.sequence_number}
            for s in steps]


@router.get("/executions", response_model=List[StepExecution])
def list_executions(
    production_order_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(ProductionStepExecution)
    if production_order_id:
        q = q.filter(ProductionStepExecution.production_order_id == production_order_id)
    return q.all()


@router.post("/executions", response_model=StepExecution, status_code=201)
def create_execution(
    data: StepExecutionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    execution_id = generate_execution_id(db)

    # Detect parameter drift
    step = db.query(ProcessStep).filter(ProcessStep.id == data.process_step_id).first()
    drift = 0
    if step and data.temperature is not None:
        if step.expected_temperature_min and step.expected_temperature_max:
            if not (step.expected_temperature_min <= data.temperature <= step.expected_temperature_max):
                drift = 1
    if step and data.pressure is not None:
        if step.expected_pressure_min and step.expected_pressure_max:
            if not (step.expected_pressure_min <= data.pressure <= step.expected_pressure_max):
                drift = 1

    execution = ProductionStepExecution(
        **data.dict(),
        execution_id=execution_id,
        drift_detected=drift,
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    return execution


@router.put("/executions/{execution_id}", response_model=StepExecution)
def update_execution(
    execution_id: str,
    data: StepExecutionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    execution = db.query(ProductionStepExecution).filter(
        ProductionStepExecution.execution_id == execution_id
    ).first()
    if not execution:
        raise HTTPException(404, f"Execution '{execution_id}' not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(execution, field, value)
    db.commit()
    db.refresh(execution)
    return execution


@router.put("/{step_id}", response_model=StepSchema)
def update_step(
    step_id: str,
    data: ProcessStepUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    step = db.query(ProcessStep).filter(ProcessStep.step_id == step_id).first()
    if not step:
        raise HTTPException(404, f"Process step '{step_id}' not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(step, field, value)
    db.commit()
    db.refresh(step)
    return step
