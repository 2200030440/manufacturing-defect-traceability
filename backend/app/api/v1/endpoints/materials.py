from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.product import Material
from app.schemas.product import (
    MaterialCreate, MaterialUpdate, Material as MaterialSchema,
    PaginatedMaterials
)
from app.services.id_generator import generate_material_id
import math

router = APIRouter()


@router.get("/", response_model=PaginatedMaterials)
def list_materials(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Material)
    if search:
        q = q.filter(
            Material.name.ilike(f"%{search}%") |
            Material.material_id.ilike(f"%{search}%")
        )
    if category:
        q = q.filter(Material.category == category)

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "pages": math.ceil(total / page_size) if total > 0 else 1}


@router.post("/", response_model=MaterialSchema, status_code=201)
def create_material(
    data: MaterialCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    material_id = generate_material_id(db)
    material = Material(**data.dict(), material_id=material_id)
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.get("/all/simple")
def list_materials_simple(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.product import LifecycleStatus
    materials = db.query(Material).filter(
        Material.lifecycle_status == LifecycleStatus.ACTIVE
    ).all()
    return [{"id": m.id, "material_id": m.material_id, "name": m.name,
             "unit_of_measurement": m.unit_of_measurement} for m in materials]


@router.get("/{material_id}", response_model=MaterialSchema)
def get_material(
    material_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    material = db.query(Material).filter(Material.material_id == material_id).first()
    if not material:
        raise HTTPException(404, f"Material '{material_id}' not found")
    return material


@router.put("/{material_id}", response_model=MaterialSchema)
def update_material(
    material_id: str,
    data: MaterialUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    material = db.query(Material).filter(Material.material_id == material_id).first()
    if not material:
        raise HTTPException(404, f"Material '{material_id}' not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(material, field, value)
    db.commit()
    db.refresh(material)
    return material
