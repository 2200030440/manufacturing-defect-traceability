from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class InspectionType(str, enum.Enum):
    INCOMING = "INCOMING"
    IN_PROCESS = "IN_PROCESS"
    FINAL = "FINAL"
    OUTGOING = "OUTGOING"


class InspectionStage(str, enum.Enum):
    RECEIVING = "RECEIVING"
    FABRICATION = "FABRICATION"
    ASSEMBLY = "ASSEMBLY"
    TESTING = "TESTING"
    PACKAGING = "PACKAGING"
    SHIPPING = "SHIPPING"


class InspectionResultStatus(str, enum.Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    CONDITIONAL = "CONDITIONAL"
    PENDING = "PENDING"


class PlanStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    DRAFT = "DRAFT"


class InspectionPlan(Base):
    __tablename__ = "inspection_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(String(20), unique=True, nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    inspection_type = Column(SAEnum(InspectionType), nullable=False)
    inspection_stage = Column(SAEnum(InspectionStage), nullable=False)
    inspection_criteria = Column(String(500), nullable=False)
    min_value = Column(Float)
    max_value = Column(Float)
    unit = Column(String(20))
    effective_date = Column(Date, nullable=False)
    plan_status = Column(SAEnum(PlanStatus), default=PlanStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="inspection_plans")
    inspection_results = relationship("InspectionResult", back_populates="inspection_plan")


class InspectionResult(Base):
    __tablename__ = "inspection_results"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(String(30), unique=True, nullable=False, index=True)
    production_order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=False)
    inspection_plan_id = Column(Integer, ForeignKey("inspection_plans.id"), nullable=False)
    inspection_date = Column(DateTime, nullable=False)
    quantity_inspected = Column(Float, nullable=False)
    quantity_passed = Column(Float, nullable=False)
    quantity_failed = Column(Float, nullable=False)
    inspection_status = Column(SAEnum(InspectionResultStatus), nullable=False)
    inspector = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    production_order = relationship("ProductionOrder", back_populates="inspection_results")
    inspection_plan = relationship("InspectionPlan", back_populates="inspection_results")
    defects = relationship("Defect", back_populates="inspection_result")
