from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class MaterialConsumption(Base):
    __tablename__ = "material_consumptions"

    id = Column(Integer, primary_key=True, index=True)
    consumption_id = Column(String(30), unique=True, nullable=False, index=True)
    production_order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=False)
    lot_id = Column(Integer, ForeignKey("material_lots.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    consumed_quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    consumption_date = Column(Date, nullable=False)
    recorded_by = Column(String(100))
    is_reversal = Column(Integer, default=0)  # 0=normal, 1=reversal transaction
    original_consumption_id = Column(String(30))  # for reversals
    notes = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    production_order = relationship("ProductionOrder", back_populates="consumptions")
    lot = relationship("MaterialLot", back_populates="consumptions")
    material = relationship("Material", back_populates="consumptions")
