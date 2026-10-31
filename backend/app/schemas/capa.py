from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date
from app.models.capa import CAPAStatus, CAPAPriority, VerificationStatus


class CAPABase(BaseModel):
    defect_id: int
    root_cause: str
    corrective_action: str
    preventive_action: Optional[str] = None
    assigned_engineer: str
    priority: CAPAPriority = CAPAPriority.MEDIUM
    created_date: date
    target_date: date
    notes: Optional[str] = None


class CAPACreate(CAPABase):
    pass


class CAPAUpdate(BaseModel):
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    assigned_engineer: Optional[str] = None
    priority: Optional[CAPAPriority] = None
    target_date: Optional[date] = None
    completion_date: Optional[date] = None
    capa_status: Optional[CAPAStatus] = None
    notes: Optional[str] = None


class CAPA(CAPABase):
    id: int
    capa_id: str
    completion_date: Optional[date] = None
    verification_status: VerificationStatus = VerificationStatus.PENDING
    capa_status: CAPAStatus = CAPAStatus.OPEN
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CAPAVerificationCreate(BaseModel):
    verified_by: str
    verification_date: date
    verification_status: VerificationStatus
    evidence: Optional[str] = None
    notes: Optional[str] = None


class CAPAVerification(CAPAVerificationCreate):
    id: int
    capa_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ConsumptionBase(BaseModel):
    production_order_id: int
    lot_id: int
    material_id: int
    consumed_quantity: float
    unit: str
    consumption_date: date
    recorded_by: Optional[str] = None
    notes: Optional[str] = None


class ConsumptionCreate(ConsumptionBase):
    pass


class Consumption(ConsumptionBase):
    id: int
    consumption_id: str
    is_reversal: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedCAPAs(BaseModel):
    items: List[CAPA]
    total: int
    page: int
    page_size: int
    pages: int
