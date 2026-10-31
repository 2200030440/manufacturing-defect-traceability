from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.product import Product, Material
from app.schemas.product import (
    ProductCreate, ProductUpdate, Product as ProductSchema,
    ProductDetail, PaginatedProducts,
    MaterialCreate, MaterialUpdate, Material as MaterialSchema,
    PaginatedMaterials
)
from app.services.id_generator import generate_product_id, generate_material_id
import math

router = APIRouter()


# ---------- Products ----------

@router.get("/", response_model=PaginatedProducts)
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Product)
    if search:
        q = q.filter(
            Product.name.ilike(f"%{search}%") |
            Product.sku.ilike(f"%{search}%") |
            Product.product_id.ilike(f"%{search}%")
        )
    if category:
        q = q.filter(Product.category == category)
    if status:
        q = q.filter(Product.lifecycle_status == status)

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total > 0 else 1,
    }


@router.post("/", response_model=ProductSchema, status_code=201)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Check SKU uniqueness
    if db.query(Product).filter(Product.sku == data.sku).first():
        raise HTTPException(400, f"SKU '{data.sku}' already exists")

    product_id = generate_product_id(db)
    product = Product(**data.dict(), product_id=product_id)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductDetail)
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(404, f"Product '{product_id}' not found")

    from app.models.production import ProductionOrder
    from app.models.defect import Defect, DefectStatus

    result = ProductDetail.from_orm(product)
    result.bom_component_count = len(product.bom_components)
    result.production_order_count = db.query(ProductionOrder).filter(
        ProductionOrder.product_id == product.id
    ).count()
    result.open_defect_count = db.query(Defect).filter(
        Defect.product_id == product.id,
        Defect.defect_status.in_([DefectStatus.OPEN, DefectStatus.UNDER_INVESTIGATION])
    ).count()
    return result


@router.put("/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: str,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(404, f"Product '{product_id}' not found")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(404, f"Product '{product_id}' not found")
    # Soft delete
    from app.models.product import LifecycleStatus
    product.lifecycle_status = LifecycleStatus.DISCONTINUED
    db.commit()


@router.get("/all/simple")
def list_products_simple(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return all active products as simple list for dropdowns."""
    from app.models.product import LifecycleStatus
    products = db.query(Product).filter(
        Product.lifecycle_status == LifecycleStatus.ACTIVE
    ).all()
    return [{"id": p.id, "product_id": p.product_id, "name": p.name, "sku": p.sku} for p in products]
