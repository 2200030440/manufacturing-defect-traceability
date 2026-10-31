from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class ProductCategory(str, enum.Enum):
    ELECTRICAL = "ELECTRICAL"
    MECHANICAL = "MECHANICAL"
    ELECTRONIC = "ELECTRONIC"
    PNEUMATIC = "PNEUMATIC"
    HYDRAULIC = "HYDRAULIC"
    OPTICAL = "OPTICAL"
    CHEMICAL = "CHEMICAL"
    OTHER = "OTHER"


class LifecycleStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    DISCONTINUED = "DISCONTINUED"
    DRAFT = "DRAFT"


class MaterialCategory(str, enum.Enum):
    RAW_MATERIAL = "RAW_MATERIAL"
    COMPONENT = "COMPONENT"
    SEMI_FINISHED = "SEMI_FINISHED"
    PACKAGING = "PACKAGING"
    CONSUMABLE = "CONSUMABLE"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(1000))
    category = Column(SAEnum(ProductCategory), nullable=False)
    unit_of_measurement = Column(String(20), default="UNIT")
    standard_production_time = Column(Float)  # hours
    lifecycle_status = Column(SAEnum(LifecycleStatus), default=LifecycleStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bom_components = relationship("BOMComponent", back_populates="product")
    production_orders = relationship("ProductionOrder", back_populates="product")
    inspection_plans = relationship("InspectionPlan", back_populates="product")
    defects = relationship("Defect", back_populates="product")
    process_steps = relationship("ProcessStep", back_populates="product")


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000))
    category = Column(SAEnum(MaterialCategory), nullable=False)
    unit_of_measurement = Column(String(20), default="KG")
    lifecycle_status = Column(SAEnum(LifecycleStatus), default=LifecycleStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bom_components = relationship("BOMComponent", back_populates="material")
    lots = relationship("MaterialLot", back_populates="material")
    consumptions = relationship("MaterialConsumption", back_populates="material")
