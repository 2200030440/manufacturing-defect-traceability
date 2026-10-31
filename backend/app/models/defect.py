from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SAEnum, Text, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class DefectCategory(str, enum.Enum):
    DIMENSIONAL = "DIMENSIONAL"
    SURFACE_DEFECT = "SURFACE_DEFECT"
    MATERIAL_DEFECT = "MATERIAL_DEFECT"
    ASSEMBLY_ERROR = "ASSEMBLY_ERROR"
    FUNCTIONAL_FAILURE = "FUNCTIONAL_FAILURE"
    COSMETIC = "COSMETIC"
    CONTAMINATION = "CONTAMINATION"
    OTHER = "OTHER"


class Severity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    MAJOR = "MAJOR"
    MINOR = "MINOR"
    OBSERVATION = "OBSERVATION"


class DefectStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    CONTAINED = "CONTAINED"
    ROOT_CAUSE_IDENTIFIED = "ROOT_CAUSE_IDENTIFIED"
    CAPA_INITIATED = "CAPA_INITIATED"
    CLOSED = "CLOSED"
    REOPENED = "REOPENED"


class ContainmentStatus(str, enum.Enum):
    INITIATED = "INITIATED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    RELEASED = "RELEASED"


class Defect(Base):
    __tablename__ = "defects"

    id = Column(Integer, primary_key=True, index=True)
    defect_id = Column(String(20), unique=True, nullable=False, index=True)
    inspection_id = Column(Integer, ForeignKey("inspection_results.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    production_order_id = Column(Integer, ForeignKey("production_orders.id"))
    material_lot_id = Column(Integer, ForeignKey("material_lots.id"))
    process_step_id = Column(Integer, ForeignKey("process_steps.id"))
    machine_id = Column(Integer, ForeignKey("machines.id"))
    defect_category = Column(SAEnum(DefectCategory), nullable=False)
    description = Column(Text, nullable=False)
    defect_quantity = Column(Float, nullable=False)
    severity = Column(SAEnum(Severity), nullable=False)
    detection_date = Column(Date, nullable=False)
    defect_status = Column(SAEnum(DefectStatus), default=DefectStatus.OPEN)
    root_cause = Column(Text)
    lot_link_confirmed = Column(Integer, default=0)  # 0=suspected, 1=confirmed
    machine_link_confirmed = Column(Integer, default=0)  # 0=suspected, 1=confirmed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    inspection_result = relationship("InspectionResult", back_populates="defects")
    product = relationship("Product", back_populates="defects")
    production_order = relationship("ProductionOrder", back_populates="defects")
    material_lot = relationship("MaterialLot", back_populates="defects")
    process_step = relationship("ProcessStep", back_populates="defects")
    machine = relationship("Machine", back_populates="defects")
    containments = relationship("DefectContainment", back_populates="defect")
    corrective_actions = relationship("CorrectiveAction", back_populates="defect")


class DefectContainment(Base):
    __tablename__ = "defect_containments"

    id = Column(Integer, primary_key=True, index=True)
    containment_id = Column(String(20), unique=True, nullable=False, index=True)
    defect_id = Column(Integer, ForeignKey("defects.id"), nullable=False)
    action_description = Column(Text, nullable=False)
    affected_quantity = Column(Float)
    quarantined_quantity = Column(Float)
    responsible_person = Column(String(100))
    start_date = Column(Date)
    completion_date = Column(Date)
    containment_status = Column(SAEnum(ContainmentStatus), default=ContainmentStatus.INITIATED)
    decision = Column(String(50))  # HOLD, REWORK, SCRAP, RELEASE
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    defect = relationship("Defect", back_populates="containments")
