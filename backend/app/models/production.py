from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class ProductionStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    RELEASED = "RELEASED"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    CLOSED = "CLOSED"


class Priority(str, enum.Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


class ProductionOrder(Base):
    __tablename__ = "production_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(20), unique=True, nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    bom_revision = Column(String(10), default="REV-1")
    planned_quantity = Column(Float, nullable=False)
    actual_quantity = Column(Float, default=0)
    scrap_quantity = Column(Float, default=0)
    rework_quantity = Column(Float, default=0)
    start_date = Column(Date)
    end_date = Column(Date)
    actual_start_date = Column(DateTime)
    actual_end_date = Column(DateTime)
    production_status = Column(SAEnum(ProductionStatus), default=ProductionStatus.PLANNED)
    priority = Column(SAEnum(Priority), default=Priority.NORMAL)
    responsible_team = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="production_orders")
    consumptions = relationship("MaterialConsumption", back_populates="production_order")
    step_executions = relationship("ProductionStepExecution", back_populates="production_order")
    inspection_results = relationship("InspectionResult", back_populates="production_order")
    defects = relationship("Defect", back_populates="production_order")
    outputs = relationship("ProductionOutput", back_populates="production_order")


class ProductionOutput(Base):
    __tablename__ = "production_outputs"

    id = Column(Integer, primary_key=True, index=True)
    production_order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=False)
    output_type = Column(String(20), nullable=False)  # GOOD, SCRAP, REWORK
    quantity = Column(Float, nullable=False)
    recorded_by = Column(String(100))
    notes = Column(String(500))
    recorded_at = Column(DateTime, default=datetime.utcnow)

    production_order = relationship("ProductionOrder", back_populates="outputs")
