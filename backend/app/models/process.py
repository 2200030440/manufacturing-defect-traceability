from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SAEnum, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class ProcessStepStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    DRAFT = "DRAFT"


class ExecutionStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class ProcessStep(Base):
    __tablename__ = "process_steps"

    id = Column(Integer, primary_key=True, index=True)
    step_id = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"))
    product_category = Column(String(50))
    description = Column(Text)
    expected_temperature_min = Column(Float)
    expected_temperature_max = Column(Float)
    expected_pressure_min = Column(Float)
    expected_pressure_max = Column(Float)
    expected_speed_min = Column(Float)
    expected_speed_max = Column(Float)
    lifecycle_status = Column(SAEnum(ProcessStepStatus), default=ProcessStepStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="process_steps")
    executions = relationship("ProductionStepExecution", back_populates="process_step")
    defects = relationship("Defect", back_populates="process_step")


class ProductionStepExecution(Base):
    __tablename__ = "production_step_executions"

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(String(30), unique=True, nullable=False, index=True)
    production_order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=False)
    process_step_id = Column(Integer, ForeignKey("process_steps.id"), nullable=False)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    operator = Column(String(100))
    actual_start = Column(DateTime)
    actual_end = Column(DateTime)
    temperature = Column(Float)
    pressure = Column(Float)
    speed = Column(Float)
    process_parameters = Column(JSON)
    execution_status = Column(SAEnum(ExecutionStatus), default=ExecutionStatus.PENDING)
    drift_detected = Column(Integer, default=0)  # 0 = no, 1 = yes
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    production_order = relationship("ProductionOrder", back_populates="step_executions")
    process_step = relationship("ProcessStep", back_populates="executions")
    machine = relationship("Machine", back_populates="step_executions")
