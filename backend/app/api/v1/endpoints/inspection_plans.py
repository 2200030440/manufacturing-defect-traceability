from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.inspection import InspectionPlan, PlanStatus
from app.schemas.inspection import InspectionPlanCreate, InspectionPlanUpdate, InspectionPlan as PlanSchema
from app.services.id_generator import generate_plan_id

router = APIRouter()


@router.get("/", response_model=List[PlanSchema])
def list_plans(
    product_id: Optional[int] = None,
    inspection_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(InspectionPlan)
    if product_id:
        q = q.filter(InspectionPlan.product_id == product_id)
    if inspection_type:
        q = q.filter(InspectionPlan.inspection_type == inspection_type)
    if status:
        q = q.filter(InspectionPlan.plan_status == status)
    return q.all()


@router.post("/", response_model=PlanSchema, status_code=201)
def create_plan(
    data: InspectionPlanCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    plan_id = generate_plan_id(db)
    plan = InspectionPlan(**data.dict(), plan_id=plan_id)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/all/simple")
def list_plans_simple(
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(InspectionPlan).filter(InspectionPlan.plan_status == PlanStatus.ACTIVE)
    if product_id:
        q = q.filter(InspectionPlan.product_id == product_id)
    plans = q.all()
    return [{"id": p.id, "plan_id": p.plan_id, "inspection_type": p.inspection_type,
             "inspection_criteria": p.inspection_criteria} for p in plans]


@router.get("/{plan_id}", response_model=PlanSchema)
def get_plan(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    plan = db.query(InspectionPlan).filter(InspectionPlan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(404, f"Inspection plan '{plan_id}' not found")
    return plan


@router.put("/{plan_id}", response_model=PlanSchema)
def update_plan(
    plan_id: str,
    data: InspectionPlanUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    plan = db.query(InspectionPlan).filter(InspectionPlan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(404, f"Inspection plan '{plan_id}' not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return plan
