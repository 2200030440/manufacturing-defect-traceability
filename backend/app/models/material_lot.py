from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class InspectionStatus(str, enum.Enum):
    PENDING = "PENDING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    CONDITIONALLY_APPROVED = "CONDITIONALLY_APPROVED"


class LotStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    CONSUMED = "CONSUMED"
    QUARANTINED = "QUARANTINED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    PARTIALLY_CONSUMED = "PARTIALLY_CONSUMED"


class TransactionType(str, enum.Enum):
    RECEIPT = "RECEIPT"
    CONSUMPTION = "CONSUMPTION"
    REJECTION = "REJECTION"
    ADJUSTMENT = "ADJUSTMENT"
    REVERSAL = "REVERSAL"
    QUARANTINE = "QUARANTINE"


class MaterialLot(Base):
    __tablename__ = "material_lots"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(String(40), unique=True, nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    received_quantity = Column(Float, nullable=False)
    available_quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    received_date = Column(Date, nullable=False)
    expiry_date = Column(Date)
    incoming_inspection_status = Column(SAEnum(InspectionStatus), default=InspectionStatus.PENDING)
    lot_status = Column(SAEnum(LotStatus), default=LotStatus.AVAILABLE)
    notes = Column(String(1000))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="material_lots")
    material = relationship("Material", back_populates="lots")
    consumptions = relationship("MaterialConsumption", back_populates="lot")
    defects = relationship("Defect", back_populates="material_lot")
    transactions = relationship("MaterialTransaction", back_populates="lot")


class MaterialTransaction(Base):
    __tablename__ = "material_transactions"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("material_lots.id"), nullable=False)
    transaction_type = Column(SAEnum(TransactionType), nullable=False)
    quantity = Column(Float, nullable=False)
    reference_id = Column(String(50))  # production order ID or other reference
    notes = Column(String(500))
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    lot = relationship("MaterialLot", back_populates="transactions")
