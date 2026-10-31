from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date
from app.models.material_lot import InspectionStatus, LotStatus


class MaterialLotBase(BaseModel):
    supplier_id: int
    material_id: int
    received_quantity: float
    unit: str
    received_date: date
    expiry_date: Optional[date] = None
    incoming_inspection_status: InspectionStatus = InspectionStatus.PENDING
    lot_status: LotStatus = LotStatus.AVAILABLE
    notes: Optional[str] = None


class MaterialLotCreate(MaterialLotBase):
    pass


class MaterialLotUpdate(BaseModel):
    received_quantity: Optional[float] = None
    available_quantity: Optional[float] = None
    expiry_date: Optional[date] = None
    incoming_inspection_status: Optional[InspectionStatus] = None
    lot_status: Optional[LotStatus] = None
    notes: Optional[str] = None


class SupplierBrief(BaseModel):
    id: int
    supplier_id: str
    name: str
    country: str

    class Config:
        from_attributes = True


class MaterialBrief(BaseModel):
    id: int
    material_id: str
    name: str
    unit_of_measurement: str

    class Config:
        from_attributes = True


class MaterialLot(MaterialLotBase):
    id: int
    lot_id: str
    available_quantity: float
    supplier: Optional[SupplierBrief] = None
    material: Optional[MaterialBrief] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MaterialTransaction(BaseModel):
    id: int
    transaction_type: str
    quantity: float
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedLots(BaseModel):
    items: List[MaterialLot]
    total: int
    page: int
    page_size: int
    pages: int
