from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.bom import BOMComponent
from app.models.product import Product, Material
from app.schemas.bom import BOMComponentCreate, BOMComponentUpdate, BOMComponent as BOMSchema, BOMSummary
from app.services.id_generator import generate_bom_id

router = APIRouter()


@router.get("/product/{product_id}", response_model=BOMSummary)
def get_bom_for_product(
    product_id: str,
    revision: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(404, f"Product '{product_id}' not found")

    q = db.query(BOMComponent).filter(BOMComponent.product_id == product.id)
    if revision:
        q = q.filter(BOMComponent.revision == revision)

    components = q.all()
    return {
        "product_id": product.id,
        "product_name": product.name,
        "product_sku": product.sku,
        "revision": revision or (components[0].revision if components else "REV-1"),
        "components": components,
        "total_components": len(components),
    }


@router.get("/", response_model=List[BOMSchema])
def list_bom_components(
    product_id: Optional[int] = None,
    material_id: Optional[int] = None,
    revision: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(BOMComponent)
    if product_id:
        q = q.filter(BOMComponent.product_id == product_id)
    if material_id:
        q = q.filter(BOMComponent.material_id == material_id)
    if revision:
        q = q.filter(BOMComponent.revision == revision)
    return q.all()


@router.post("/", response_model=BOMSchema, status_code=201)
def create_bom_component(
    data: BOMComponentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Validate product and material exist
    if not db.query(Product).filter(Product.id == data.product_id).first():
        raise HTTPException(404, f"Product ID {data.product_id} not found")
    if not db.query(Material).filter(Material.id == data.material_id).first():
        raise HTTPException(404, f"Material ID {data.material_id} not found")

    # Check for duplicate (same product+material+revision)
    existing = db.query(BOMComponent).filter(
        BOMComponent.product_id == data.product_id,
        BOMComponent.material_id == data.material_id,
        BOMComponent.revision == data.revision,
    ).first()
    if existing:
        raise HTTPException(400, "BOM component already exists for this product/material/revision combination")

    bom_id = generate_bom_id(db)
    bom = BOMComponent(**data.dict(), bom_id=bom_id)
    db.add(bom)
    db.commit()
    db.refresh(bom)
    return bom


@router.put("/{bom_id}", response_model=BOMSchema)
def update_bom_component(
    bom_id: str,
    data: BOMComponentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    bom = db.query(BOMComponent).filter(BOMComponent.bom_id == bom_id).first()
    if not bom:
        raise HTTPException(404, f"BOM component '{bom_id}' not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(bom, field, value)
    db.commit()
    db.refresh(bom)
    return bom


@router.delete("/{bom_id}", status_code=204)
def delete_bom_component(
    bom_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    bom = db.query(BOMComponent).filter(BOMComponent.bom_id == bom_id).first()
    if not bom:
        raise HTTPException(404, f"BOM component '{bom_id}' not found")
    from app.models.bom import BOMStatus
    bom.bom_status = BOMStatus.OBSOLETE
    db.commit()
