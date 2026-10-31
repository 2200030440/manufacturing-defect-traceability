from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from app.models.machine import MachineStatus


class MachineBase(BaseModel):
    name: str
    machine_type: str
    location: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    installation_date: Optional[date] = None
    current_status: MachineStatus = MachineStatus.OPERATIONAL
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    notes: Optional[str] = None


class MachineCreate(MachineBase):
    pass


class MachineUpdate(BaseModel):
    name: Optional[str] = None
    machine_type: Optional[str] = None
    location: Optional[str] = None
    manufacturer: Optional[str] = None
    current_status: Optional[MachineStatus] = None
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    notes: Optional[str] = None


class Machine(MachineBase):
    id: int
    machine_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedMachines(BaseModel):
    items: List[Machine]
    total: int
    page: int
    page_size: int
    pages: int


class ProcessStepBase(BaseModel):
    name: str
    sequence_number: int
    product_id: Optional[int] = None
    product_category: Optional[str] = None
    description: Optional[str] = None
    expected_temperature_min: Optional[float] = None
    expected_temperature_max: Optional[float] = None
    expected_pressure_min: Optional[float] = None
    expected_pressure_max: Optional[float] = None
    expected_speed_min: Optional[float] = None
    expected_speed_max: Optional[float] = None
    lifecycle_status: str = "ACTIVE"


class ProcessStepCreate(ProcessStepBase):
    pass


class ProcessStepUpdate(BaseModel):
    name: Optional[str] = None
    sequence_number: Optional[int] = None
    description: Optional[str] = None
    expected_temperature_min: Optional[float] = None
    expected_temperature_max: Optional[float] = None
    lifecycle_status: Optional[str] = None


class ProcessStep(ProcessStepBase):
    id: int
    step_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StepExecutionBase(BaseModel):
    production_order_id: int
    process_step_id: int
    machine_id: Optional[int] = None
    operator: Optional[str] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    temperature: Optional[float] = None
    pressure: Optional[float] = None
    speed: Optional[float] = None
    process_parameters: Optional[dict] = None
    execution_status: str = "PENDING"
    notes: Optional[str] = None


class StepExecutionCreate(StepExecutionBase):
    pass


class StepExecutionUpdate(BaseModel):
    machine_id: Optional[int] = None
    operator: Optional[str] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    temperature: Optional[float] = None
    pressure: Optional[float] = None
    speed: Optional[float] = None
    process_parameters: Optional[dict] = None
    execution_status: Optional[str] = None
    drift_detected: Optional[int] = None
    notes: Optional[str] = None


class StepExecution(StepExecutionBase):
    id: int
    execution_id: str
    drift_detected: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
