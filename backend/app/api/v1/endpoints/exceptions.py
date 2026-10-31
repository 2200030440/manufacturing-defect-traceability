from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.exception import ExceptionRecord, ExceptionResolutionStatus
import math

router = APIRouter()


@router.get("/")
def list_exceptions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    exception_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(ExceptionRecord)
    if exception_type:
        q = q.filter(ExceptionRecord.exception_type == exception_type)
    if severity:
        q = q.filter(ExceptionRecord.severity == severity)
    if status:
        q = q.filter(ExceptionRecord.resolution_status == status)

    q = q.order_by(ExceptionRecord.detection_date.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [
            {
                "id": e.id,
                "exception_id": e.exception_id,
                "exception_type": e.exception_type.value if e.exception_type else None,
                "related_entity": e.related_entity,
                "related_record_id": e.related_record_id,
                "description": e.description,
                "severity": e.severity.value if e.severity else None,
                "detection_date": str(e.detection_date),
                "resolution_status": e.resolution_status.value if e.resolution_status else None,
                "is_injected_anomaly": bool(e.is_injected_anomaly),
            }
            for e in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total > 0 else 1,
    }


@router.post("/resolve/{exception_id}")
def resolve_exception(
    exception_id: str,
    resolution_notes: str,
    resolution_status: str = "RESOLVED",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    exc = db.query(ExceptionRecord).filter(
        ExceptionRecord.exception_id == exception_id
    ).first()
    if not exc:
        raise HTTPException(404, f"Exception '{exception_id}' not found")

    exc.resolution_status = resolution_status
    exc.resolution_notes = resolution_notes
    exc.resolved_by = current_user.email
    from datetime import datetime
    exc.resolved_at = datetime.utcnow()
    db.commit()
    return {"message": f"Exception {exception_id} marked as {resolution_status}"}


@router.get("/summary")
def exception_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.exception import ExceptionType, ExceptionSeverity
    total = db.query(ExceptionRecord).count()
    open_count = db.query(ExceptionRecord).filter(
        ExceptionRecord.resolution_status == ExceptionResolutionStatus.OPEN
    ).count()
    critical = db.query(ExceptionRecord).filter(
        ExceptionRecord.severity == ExceptionSeverity.CRITICAL,
        ExceptionRecord.resolution_status == ExceptionResolutionStatus.OPEN
    ).count()

    # By type
    by_type = db.query(
        ExceptionRecord.exception_type,
        func.count(ExceptionRecord.id)
    ).group_by(ExceptionRecord.exception_type).all()

    return {
        "total": total,
        "open": open_count,
        "critical_open": critical,
        "by_type": [{"type": t.value if t else "UNKNOWN", "count": c} for t, c in by_type],
    }
