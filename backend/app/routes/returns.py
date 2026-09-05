import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.return_case import ReturnCaseCreate, ReturnCaseUpdate, ReturnCaseOut
from app.schemas.evidence import EvidenceOut
from app.services import investigation_service

router = APIRouter(prefix="/api/returns", tags=["Returns"])

# Ensure uploads directory exists relative to current working directory
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=List[ReturnCaseOut])
def get_all_returns(
    status_filter: Optional[str] = None,
    risk_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all return investigation cases with optional filtering.
    """
    return investigation_service.list_all_returns(db, status=status_filter, risk_level=risk_filter)


@router.get("/{case_id}", response_model=ReturnCaseOut)
def get_return_by_id(case_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information for a specific return investigation case.
    """
    case = investigation_service.get_return_case(db, case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Return case with ID {case_id} not found."
        )
    return case


@router.post("", response_model=ReturnCaseOut, status_code=status.HTTP_201_CREATED)
def create_new_return(case_in: ReturnCaseCreate, db: Session = Depends(get_db)):
    """
    Create a new return investigation case.
    """
    try:
        new_case = investigation_service.create_return_case(db, case_in)
        return new_case
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/{case_id}/evidence", response_model=EvidenceOut)
async def upload_case_evidence(
    case_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload evidence file (image/document) for a specific return case.
    Saves file to local uploads directory and records evidence metadata.
    """
    case = investigation_service.get_return_case(db, case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Return case with ID {case_id} not found."
        )

    # Sanitize and create unique filename
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"case_{case_id}_{uuid.uuid4().hex[:8]}{ext}"
    target_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    relative_url = f"/uploads/{unique_filename}"
    evidence_record = investigation_service.save_evidence(
        db=db,
        case_id=case_id,
        file_name=file.filename,
        file_path=relative_url,
        evidence_type=file.content_type or "image"
    )

    return evidence_record


@router.patch("/{case_id}", response_model=ReturnCaseOut)
def update_case_details(
    case_id: int,
    update_in: ReturnCaseUpdate,
    db: Session = Depends(get_db)
):
    """
    Update status, risk level, or final decision of a return case.
    """
    updated_case = investigation_service.update_return_case(db, case_id, update_in)
    if not updated_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Return case with ID {case_id} not found."
        )
    return updated_case
