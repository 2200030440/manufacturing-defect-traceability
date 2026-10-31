from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class BOMStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    OBSOLETE = "OBSOLETE"
    DRAFT = "DRAFT"
    UNDER_REVIEW = "UNDER_REVIEW"


class BOMComponent(Base):
    __tablename__ = "bom_components"

    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(String(30), unique=True, nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    required_quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    revision = Column(String(10), default="REV-1")
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date)
    bom_status = Column(SAEnum(BOMStatus), default=BOMStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="bom_components")
    material = relationship("Material", back_populates="bom_components")
