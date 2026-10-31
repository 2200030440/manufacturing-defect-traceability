from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date
from app.models.inspection import InspectionType, InspectionStage, InspectionResultStatus, PlanStatus


class InspectionPlanBase(BaseModel):
    product_id: int
    inspection_type: InspectionType
    inspection_stage: InspectionStage
    inspection_criteria: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    unit: Optional[str] = None
    effective_date: date
    plan_status: PlanStatus = PlanStatus.ACTIVE


class InspectionPlanCreate(InspectionPlanBase):
    pass


class InspectionPlanUpdate(BaseModel):
    inspection_type: Optional[InspectionType] = None
    inspection_stage: Optional[InspectionStage] = None
    inspection_criteria: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    unit: Optional[str] = None
    effective_date: Optional[date] = None
    plan_status: Optional[PlanStatus] = None


class InspectionPlan(InspectionPlanBase):
    id: int
    plan_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InspectionResultBase(BaseModel):
    production_order_id: int
    inspection_plan_id: int
    inspection_date: datetime
    quantity_inspected: float
    quantity_passed: float
    quantity_failed: float
    inspection_status: InspectionResultStatus
    inspector: Optional[str] = None
    notes: Optional[str] = None

    @validator("quantity_failed")
    def validate_quantities(cls, v, values):
        if "quantity_inspected" in values and "quantity_passed" in values:
            expected = values["quantity_inspected"] - values["quantity_passed"]
            if abs(v - expected) > 0.001:
                raise ValueError(
                    f"quantity_failed ({v}) must equal quantity_inspected ({values['quantity_inspected']}) "
                    f"- quantity_passed ({values['quantity_passed']}) = {expected}"
                )
        return v


class InspectionResultCreate(InspectionResultBase):
    pass


class InspectionResultUpdate(BaseModel):
    inspection_date: Optional[datetime] = None
    quantity_inspected: Optional[float] = None
    quantity_passed: Optional[float] = None
    quantity_failed: Optional[float] = None
    inspection_status: Optional[InspectionResultStatus] = None
    inspector: Optional[str] = None
    notes: Optional[str] = None


class InspectionResult(InspectionResultBase):
    id: int
    inspection_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedInspections(BaseModel):
    items: List[InspectionResult]
    total: int
    page: int
    page_size: int
    pages: int
