from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date
from app.models.defect import DefectCategory, Severity, DefectStatus, ContainmentStatus


class DefectBase(BaseModel):
    inspection_id: Optional[int] = None
    product_id: Optional[int] = None
    production_order_id: Optional[int] = None
    material_lot_id: Optional[int] = None
    process_step_id: Optional[int] = None
    machine_id: Optional[int] = None
    defect_category: DefectCategory
    description: str
    defect_quantity: float
    severity: Severity
    detection_date: date
    defect_status: DefectStatus = DefectStatus.OPEN
    root_cause: Optional[str] = None
    lot_link_confirmed: int = 0
    machine_link_confirmed: int = 0


class DefectCreate(DefectBase):
    pass


class DefectUpdate(BaseModel):
    material_lot_id: Optional[int] = None
    process_step_id: Optional[int] = None
    machine_id: Optional[int] = None
    defect_category: Optional[DefectCategory] = None
    description: Optional[str] = None
    defect_quantity: Optional[float] = None
    severity: Optional[Severity] = None
    defect_status: Optional[DefectStatus] = None
    root_cause: Optional[str] = None
    lot_link_confirmed: Optional[int] = None
    machine_link_confirmed: Optional[int] = None


class Defect(DefectBase):
    id: int
    defect_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DefectContainmentBase(BaseModel):
    defect_id: int
    action_description: str
    affected_quantity: Optional[float] = None
    quarantined_quantity: Optional[float] = None
    responsible_person: Optional[str] = None
    start_date: Optional[date] = None
    completion_date: Optional[date] = None
    containment_status: ContainmentStatus = ContainmentStatus.INITIATED
    decision: Optional[str] = None
    notes: Optional[str] = None


class DefectContainmentCreate(DefectContainmentBase):
    pass


class DefectContainmentUpdate(BaseModel):
    action_description: Optional[str] = None
    affected_quantity: Optional[float] = None
    quarantined_quantity: Optional[float] = None
    responsible_person: Optional[str] = None
    completion_date: Optional[date] = None
    containment_status: Optional[ContainmentStatus] = None
    decision: Optional[str] = None
    notes: Optional[str] = None


class DefectContainment(DefectContainmentBase):
    id: int
    containment_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedDefects(BaseModel):
    items: List[Defect]
    total: int
    page: int
    page_size: int
    pages: int
