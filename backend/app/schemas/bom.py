from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from app.models.bom import BOMStatus


class BOMComponentBase(BaseModel):
    product_id: int
    material_id: int
    required_quantity: float
    unit: str
    revision: str = "REV-1"
    effective_from: date
    effective_to: Optional[date] = None
    bom_status: BOMStatus = BOMStatus.ACTIVE


class BOMComponentCreate(BOMComponentBase):
    pass


class BOMComponentUpdate(BaseModel):
    required_quantity: Optional[float] = None
    unit: Optional[str] = None
    revision: Optional[str] = None
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None
    bom_status: Optional[BOMStatus] = None


class MaterialBrief(BaseModel):
    id: int
    material_id: str
    name: str
    category: str
    unit_of_measurement: str

    class Config:
        from_attributes = True


class BOMComponent(BOMComponentBase):
    id: int
    bom_id: str
    material: Optional[MaterialBrief] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BOMSummary(BaseModel):
    product_id: int
    product_name: str
    product_sku: str
    revision: str
    components: List[BOMComponent]
    total_components: int
