from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class MachineStatus(str, enum.Enum):
    OPERATIONAL = "OPERATIONAL"
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE"
    IDLE = "IDLE"
    BREAKDOWN = "BREAKDOWN"
    DECOMMISSIONED = "DECOMMISSIONED"


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    machine_type = Column(String(100), nullable=False)
    location = Column(String(255))
    manufacturer = Column(String(255))
    model_number = Column(String(100))
    serial_number = Column(String(100))
    installation_date = Column(Date)
    current_status = Column(SAEnum(MachineStatus), default=MachineStatus.OPERATIONAL)
    last_maintenance_date = Column(Date)
    next_maintenance_date = Column(Date)
    notes = Column(String(1000))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    step_executions = relationship("ProductionStepExecution", back_populates="machine")
    defects = relationship("Defect", back_populates="machine")
