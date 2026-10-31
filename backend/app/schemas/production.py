from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date
from app.models.production import ProductionStatus, Priority


class ProductionOrderBase(BaseModel):
    product_id: int
    bom_revision: str = "REV-1"
    planned_quantity: float
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    production_status: ProductionStatus = ProductionStatus.PLANNED
    priority: Priority = Priority.NORMAL
    responsible_team: Optional[str] = None
    notes: Optional[str] = None


class ProductionOrderCreate(ProductionOrderBase):
    pass


class ProductionOrderUpdate(BaseModel):
    bom_revision: Optional[str] = None
    planned_quantity: Optional[float] = None
    actual_quantity: Optional[float] = None
    scrap_quantity: Optional[float] = None
    rework_quantity: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    production_status: Optional[ProductionStatus] = None
    priority: Optional[Priority] = None
    responsible_team: Optional[str] = None
    notes: Optional[str] = None


class ProductBrief(BaseModel):
    id: int
    product_id: str
    name: str
    sku: str

    class Config:
        from_attributes = True


class ProductionOrder(ProductionOrderBase):
    id: int
    order_id: str
    actual_quantity: float = 0
    scrap_quantity: float = 0
    rework_quantity: float = 0
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    product: Optional[ProductBrief] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductionOutputCreate(BaseModel):
    output_type: str  # GOOD, SCRAP, REWORK
    quantity: float
    notes: Optional[str] = None
    recorded_by: Optional[str] = None


class PaginatedOrders(BaseModel):
    items: List[ProductionOrder]
    total: int
    page: int
    page_size: int
    pages: int
