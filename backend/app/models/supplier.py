from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class SupplierCategory(str, enum.Enum):
    TIER_1 = "TIER_1"
    TIER_2 = "TIER_2"
    TIER_3 = "TIER_3"
    APPROVED = "APPROVED"
    PREFERRED = "PREFERRED"
    PROBATIONARY = "PROBATIONARY"


class SupplierStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    BLACKLISTED = "BLACKLISTED"
    UNDER_REVIEW = "UNDER_REVIEW"


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    contact_name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(String(500))
    country = Column(String(100), nullable=False)
    category = Column(SAEnum(SupplierCategory), nullable=False)
    quality_rating = Column(Float, default=5.0)  # 1-10
    lifecycle_status = Column(SAEnum(SupplierStatus), default=SupplierStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    material_lots = relationship("MaterialLot", back_populates="supplier")
