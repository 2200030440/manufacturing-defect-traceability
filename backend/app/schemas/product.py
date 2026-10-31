from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date
from app.models.product import ProductCategory, LifecycleStatus, MaterialCategory


class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    category: ProductCategory
    unit_of_measurement: str = "UNIT"
    standard_production_time: Optional[float] = None
    lifecycle_status: LifecycleStatus = LifecycleStatus.ACTIVE


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ProductCategory] = None
    unit_of_measurement: Optional[str] = None
    standard_production_time: Optional[float] = None
    lifecycle_status: Optional[LifecycleStatus] = None


class Product(ProductBase):
    id: int
    product_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductDetail(Product):
    bom_component_count: int = 0
    production_order_count: int = 0
    open_defect_count: int = 0


class MaterialBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: MaterialCategory
    unit_of_measurement: str = "KG"
    lifecycle_status: LifecycleStatus = LifecycleStatus.ACTIVE


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[MaterialCategory] = None
    unit_of_measurement: Optional[str] = None
    lifecycle_status: Optional[LifecycleStatus] = None


class Material(MaterialBase):
    id: int
    material_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedProducts(BaseModel):
    items: List[Product]
    total: int
    page: int
    page_size: int
    pages: int


class PaginatedMaterials(BaseModel):
    items: List[Material]
    total: int
    page: int
    page_size: int
    pages: int
