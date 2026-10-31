from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SAEnum, Text
from datetime import datetime
import enum
from app.core.database import Base


class ExceptionSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class ExceptionResolutionStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    ACCEPTED_RISK = "ACCEPTED_RISK"
    FALSE_POSITIVE = "FALSE_POSITIVE"


class ExceptionType(str, enum.Enum):
    NONEXISTENT_LOT = "NONEXISTENT_LOT"
    BOM_MATERIAL_NOT_CONSUMED = "BOM_MATERIAL_NOT_CONSUMED"
    CAPA_CLOSED_BEFORE_VERIFICATION = "CAPA_CLOSED_BEFORE_VERIFICATION"
    DEFECT_COUNT_EXCEEDS_INSPECTED = "DEFECT_COUNT_EXCEEDS_INSPECTED"
    BROKEN_TRACEABILITY_CHAIN = "BROKEN_TRACEABILITY_CHAIN"
    DUPLICATE_RECORD = "DUPLICATE_RECORD"
    DATE_ORDER_VIOLATION = "DATE_ORDER_VIOLATION"
    QUANTITY_MISMATCH = "QUANTITY_MISMATCH"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION"


class ExceptionRecord(Base):
    __tablename__ = "exception_records"

    id = Column(Integer, primary_key=True, index=True)
    exception_id = Column(String(20), unique=True, nullable=False, index=True)
    exception_type = Column(SAEnum(ExceptionType), nullable=False)
    related_entity = Column(String(50), nullable=False)
    related_record_id = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(SAEnum(ExceptionSeverity), nullable=False)
    detection_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    expected_behavior = Column(Text)
    actual_result = Column(Text)
    resolution_status = Column(SAEnum(ExceptionResolutionStatus), default=ExceptionResolutionStatus.OPEN)
    resolution_notes = Column(Text)
    resolved_by = Column(String(100))
    resolved_at = Column(DateTime)
    is_injected_anomaly = Column(Integer, default=0)  # 1=deliberately injected for testing
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
