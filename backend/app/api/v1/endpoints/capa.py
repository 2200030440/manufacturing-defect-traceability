from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.capa import CorrectiveAction, CAPAVerification, CAPAStatus, VerificationStatus
from app.models.defect import Defect, DefectStatus
from app.schemas.capa import CAPACreate, CAPAUpdate, CAPA as CAPASchema, CAPAVerificationCreate, CAPAVerification as VerifSchema, PaginatedCAPAs
from app.services.id_generator import generate_capa_id
from app.models.audit import EntityEventHistory
import math
from datetime import date

router = APIRouter()


@router.get("/", response_model=PaginatedCAPAs)
def list_capas(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    verification_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(CorrectiveAction)
    if status:
        q = q.filter(CorrectiveAction.capa_status == status)
    if priority:
        q = q.filter(CorrectiveAction.priority == priority)
    if verification_status:
        q = q.filter(CorrectiveAction.verification_status == verification_status)

    q = q.order_by(CorrectiveAction.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "pages": math.ceil(total / page_size) if total > 0 else 1}


@router.post("/", response_model=CAPASchema, status_code=201)
def create_capa(
    data: CAPACreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    defect = db.query(Defect).filter(Defect.id == data.defect_id).first()
    if not defect:
        raise HTTPException(404, f"Defect ID {data.defect_id} not found")

    capa_id = generate_capa_id(db)
    capa = CorrectiveAction(**data.dict(), capa_id=capa_id)
    db.add(capa)
    db.flush()

    # Update defect status
    defect.defect_status = DefectStatus.CAPA_INITIATED

    event = EntityEventHistory(
        entity_type="CAPA",
        entity_id=capa_id,
        event_type="CREATED",
        to_status=CAPAStatus.OPEN.value,
        performed_by=current_user.email,
    )
    db.add(event)
    db.commit()
    db.refresh(capa)
    return capa


@router.get("/{capa_id}", response_model=CAPASchema)
def get_capa(
    capa_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if str(capa_id).isdigit():
        capa = db.query(CorrectiveAction).filter((CorrectiveAction.id == int(capa_id)) | (CorrectiveAction.capa_id == capa_id)).first()
    else:
        capa = db.query(CorrectiveAction).filter(CorrectiveAction.capa_id == capa_id).first()
    if not capa:
        raise HTTPException(404, f"CAPA '{capa_id}' not found")
    return capa


@router.put("/{capa_id}", response_model=CAPASchema)
def update_capa(
    capa_id: str,
    data: CAPAUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if str(capa_id).isdigit():
        capa = db.query(CorrectiveAction).filter((CorrectiveAction.id == int(capa_id)) | (CorrectiveAction.capa_id == capa_id)).first()
    else:
        capa = db.query(CorrectiveAction).filter(CorrectiveAction.capa_id == capa_id).first()
    if not capa:
        raise HTTPException(404, f"CAPA '{capa_id}' not found")

    # CRITICAL RULE: Cannot close without successful verification
    if data.capa_status == CAPAStatus.CLOSED:
        if capa.verification_status != VerificationStatus.PASSED:
            raise HTTPException(
                400,
                "CAPA cannot be closed without successful verification. "
                f"Current verification status: {capa.verification_status}"
            )

    # Valid status transitions
    valid_transitions = {
        CAPAStatus.OPEN: [CAPAStatus.IN_PROGRESS, CAPAStatus.PENDING_VERIFICATION],
        CAPAStatus.IN_PROGRESS: [CAPAStatus.PENDING_VERIFICATION, CAPAStatus.OPEN],
        CAPAStatus.PENDING_VERIFICATION: [CAPAStatus.VERIFIED, CAPAStatus.IN_PROGRESS],
        CAPAStatus.VERIFIED: [CAPAStatus.CLOSED],
        CAPAStatus.REJECTED: [CAPAStatus.IN_PROGRESS],
    }

    if data.capa_status and data.capa_status != capa.capa_status:
        allowed = valid_transitions.get(capa.capa_status, [])
        if data.capa_status not in allowed:
            raise HTTPException(
                400,
                f"Invalid status transition: {capa.capa_status} -> {data.capa_status}. "
                f"Allowed: {[s.value for s in allowed]}"
            )

        old_status = capa.capa_status
        event = EntityEventHistory(
            entity_type="CAPA",
            entity_id=capa.capa_id,
            event_type="STATUS_CHANGE",
            from_status=old_status.value,
            to_status=data.capa_status.value,
            performed_by=current_user.email,
        )
        db.add(event)

    for field, value in data.dict(exclude_unset=True).items():
        setattr(capa, field, value)

    if data.capa_status == CAPAStatus.CLOSED:
        capa.completion_date = date.today()

    db.commit()
    db.refresh(capa)
    return capa


@router.post("/{capa_id}/verify", response_model=VerifSchema, status_code=201)
def verify_capa(
    capa_id: str,
    data: CAPAVerificationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if str(capa_id).isdigit():
        capa = db.query(CorrectiveAction).filter((CorrectiveAction.id == int(capa_id)) | (CorrectiveAction.capa_id == capa_id)).first()
    else:
        capa = db.query(CorrectiveAction).filter(CorrectiveAction.capa_id == capa_id).first()
    if not capa:
        raise HTTPException(404, f"CAPA '{capa_id}' not found")

    if capa.capa_status not in [CAPAStatus.PENDING_VERIFICATION, CAPAStatus.IN_PROGRESS, CAPAStatus.OPEN]:
        raise HTTPException(
            400, f"CAPA must be in PENDING_VERIFICATION, IN_PROGRESS, or OPEN status to verify. Current: {capa.capa_status}"
        )

    verification = CAPAVerification(capa_id=capa.id, **data.dict())
    db.add(verification)

    # Update CAPA based on verification result
    capa.verification_status = data.verification_status
    if data.verification_status == VerificationStatus.PASSED:
        capa.capa_status = CAPAStatus.VERIFIED
    else:
        # Verification failed - return to IN_PROGRESS
        capa.capa_status = CAPAStatus.IN_PROGRESS

    event = EntityEventHistory(
        entity_type="CAPA",
        entity_id=capa_id,
        event_type="VERIFICATION",
        to_status=data.verification_status.value,
        description=f"Verified by {data.verified_by}: {data.verification_status.value}",
        performed_by=current_user.email,
    )
    db.add(event)
    db.commit()
    db.refresh(verification)
    return verification


@router.get("/{capa_id}/history")
def get_capa_history(
    capa_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    events = db.query(EntityEventHistory).filter(
        EntityEventHistory.entity_type == "CAPA",
        EntityEventHistory.entity_id == capa_id,
    ).order_by(EntityEventHistory.created_at).all()
    return [{"event_type": e.event_type, "from_status": e.from_status,
             "to_status": e.to_status, "description": e.description,
             "performed_by": e.performed_by, "created_at": e.created_at}
            for e in events]


@router.get("/{capa_id}/verifications")
def get_capa_verifications(
    capa_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    capa = db.query(CorrectiveAction).filter(CorrectiveAction.capa_id == capa_id).first()
    if not capa:
        raise HTTPException(404, f"CAPA '{capa_id}' not found")
    verifs = db.query(CAPAVerification).filter(CAPAVerification.capa_id == capa.id).all()
    return [{"id": v.id, "verified_by": v.verified_by, "verification_date": v.verification_date,
             "verification_status": v.verification_status, "evidence": v.evidence,
             "notes": v.notes, "created_at": v.created_at} for v in verifs]
