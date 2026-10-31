from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.defect import DefectContainment, Defect
from app.schemas.defect import DefectContainmentCreate, DefectContainmentUpdate, DefectContainment as ContSchema
from app.services.id_generator import generate_containment_id

router = APIRouter()


@router.get("/", response_model=List[ContSchema])
def list_containments(
    defect_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(DefectContainment)
    if defect_id:
        q = q.filter(DefectContainment.defect_id == defect_id)
    if status:
        q = q.filter(DefectContainment.containment_status == status)
    return q.all()


@router.post("/", response_model=ContSchema, status_code=201)
def create_containment(
    data: DefectContainmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    defect = db.query(Defect).filter(Defect.id == data.defect_id).first()
    if not defect:
        raise HTTPException(404, f"Defect ID {data.defect_id} not found")

    containment_id = generate_containment_id(db)
    containment = DefectContainment(**data.dict(), containment_id=containment_id)
    db.add(containment)

    # Update defect status
    from app.models.defect import DefectStatus
    defect.defect_status = DefectStatus.CONTAINED
    db.commit()
    db.refresh(containment)
    return containment


@router.get("/{containment_id}", response_model=ContSchema)
def get_containment(
    containment_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    c = db.query(DefectContainment).filter(
        DefectContainment.containment_id == containment_id
    ).first()
    if not c:
        raise HTTPException(404, f"Containment '{containment_id}' not found")
    return c


@router.put("/{containment_id}", response_model=ContSchema)
def update_containment(
    containment_id: str,
    data: DefectContainmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    c = db.query(DefectContainment).filter(
        DefectContainment.containment_id == containment_id
    ).first()
    if not c:
        raise HTTPException(404, f"Containment '{containment_id}' not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return c
