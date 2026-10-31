from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class CAPAStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    VERIFIED = "VERIFIED"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"


class CAPAPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    PASSED = "PASSED"
    FAILED = "FAILED"


class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id = Column(Integer, primary_key=True, index=True)
    capa_id = Column(String(20), unique=True, nullable=False, index=True)
    defect_id = Column(Integer, ForeignKey("defects.id"), nullable=False)
    root_cause = Column(Text, nullable=False)
    corrective_action = Column(Text, nullable=False)
    preventive_action = Column(Text)
    assigned_engineer = Column(String(100), nullable=False)
    priority = Column(SAEnum(CAPAPriority), default=CAPAPriority.MEDIUM)
    created_date = Column(Date, nullable=False)
    target_date = Column(Date, nullable=False)
    completion_date = Column(Date)
    verification_status = Column(SAEnum(VerificationStatus), default=VerificationStatus.PENDING)
    capa_status = Column(SAEnum(CAPAStatus), default=CAPAStatus.OPEN)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    defect = relationship("Defect", back_populates="corrective_actions")
    verifications = relationship("CAPAVerification", back_populates="corrective_action")


class CAPAVerification(Base):
    __tablename__ = "capa_verifications"

    id = Column(Integer, primary_key=True, index=True)
    capa_id = Column(Integer, ForeignKey("corrective_actions.id"), nullable=False)
    verified_by = Column(String(100), nullable=False)
    verification_date = Column(Date, nullable=False)
    verification_status = Column(SAEnum(VerificationStatus), nullable=False)
    evidence = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    corrective_action = relationship("CorrectiveAction", back_populates="verifications")
