from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.machine import Machine
from app.models.process import ProcessStep, ProductionStepExecution
from app.schemas.machine import (
    MachineCreate, MachineUpdate, Machine as MachineSchema, PaginatedMachines,
    ProcessStepCreate, ProcessStepUpdate, ProcessStep as StepSchema,
    StepExecutionCreate, StepExecutionUpdate, StepExecution
)
from app.services.id_generator import generate_machine_id
import math

router = APIRouter()


@router.get("/", response_model=PaginatedMachines)
def list_machines(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    machine_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Machine)
    if search:
        q = q.filter(
            Machine.name.ilike(f"%{search}%") |
            Machine.machine_id.ilike(f"%{search}%")
        )
    if machine_type:
        q = q.filter(Machine.machine_type == machine_type)
    if status:
        q = q.filter(Machine.current_status == status)

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "pages": math.ceil(total / page_size) if total > 0 else 1}


@router.post("/", response_model=MachineSchema, status_code=201)
def create_machine(
    data: MachineCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    machine_id = generate_machine_id(db)
    machine = Machine(**data.dict(), machine_id=machine_id)
    db.add(machine)
    db.commit()
    db.refresh(machine)
    return machine


@router.get("/all/simple")
def list_machines_simple(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.machine import MachineStatus
    machines = db.query(Machine).filter(
        Machine.current_status == MachineStatus.OPERATIONAL
    ).all()
    return [{"id": m.id, "machine_id": m.machine_id, "name": m.name, "machine_type": m.machine_type}
            for m in machines]


@router.get("/{machine_id}", response_model=MachineSchema)
def get_machine(
    machine_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
    if not machine:
        raise HTTPException(404, f"Machine '{machine_id}' not found")
    return machine


@router.put("/{machine_id}", response_model=MachineSchema)
def update_machine(
    machine_id: str,
    data: MachineUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
    if not machine:
        raise HTTPException(404, f"Machine '{machine_id}' not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(machine, field, value)
    db.commit()
    db.refresh(machine)
    return machine
