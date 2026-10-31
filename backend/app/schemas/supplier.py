from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from app.models.supplier import SupplierCategory, SupplierStatus


class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: str
    category: SupplierCategory
    quality_rating: float = 5.0
    lifecycle_status: SupplierStatus = SupplierStatus.ACTIVE

    @validator("quality_rating")
    def rating_range(cls, v):
        if not 1.0 <= v <= 10.0:
            raise ValueError("Quality rating must be between 1.0 and 10.0")
        return v


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    category: Optional[SupplierCategory] = None
    quality_rating: Optional[float] = None
    lifecycle_status: Optional[SupplierStatus] = None


class Supplier(SupplierBase):
    id: int
    supplier_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SupplierDetail(Supplier):
    total_lots: int = 0
    active_lots: int = 0
    defect_rate: float = 0.0


class PaginatedSuppliers(BaseModel):
    items: List[Supplier]
    total: int
    page: int
    page_size: int
    pages: int
