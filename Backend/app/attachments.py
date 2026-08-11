import os
import uuid
from typing import List
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .database import get_db
from .models import Ticket, Attachment
from .schemas import AttachmentResponse
from .config import UPLOAD_FOLDER, MAX_FILE_SIZE, ALLOWED_FILE_TYPES

router = APIRouter()

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/tickets/{ticket_id}/attachment")
@router.post("/tickets/{ticket_id}/attachments")
async def upload_attachment(
    ticket_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".png", ".jpg", ".jpeg", ".pdf", ".txt"]
    allowed_mimes = ALLOWED_FILE_TYPES + ["text/plain"]

    if ext not in allowed_exts and file.content_type not in allowed_mimes:
        raise HTTPException(
            status_code=400,
            detail="File type not supported. Allowed types: PNG, JPG, JPEG, PDF, TXT"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum limit of 10 MB"
        )

    attachment_id = str(uuid.uuid4())
    safe_filename = f"{ticket_id}_{attachment_id[:8]}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, safe_filename).replace("\\", "/")

    with open(file_path, "wb") as f:
        f.write(content)

    attachment = Attachment(
        id=attachment_id,
        ticket_id=ticket_id,
        file_name=file.filename,
        file_path=file_path
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return {
        "message": "Uploaded successfully",
        "file": file.filename,
        "id": attachment.id,
        "ticket_id": attachment.ticket_id,
        "file_name": attachment.file_name,
        "file_path": attachment.file_path,
        "uploaded_at": attachment.uploaded_at.isoformat() if attachment.uploaded_at else None
    }


@router.get("/tickets/{ticket_id}/attachments", response_model=List[AttachmentResponse])
def get_attachments(
    ticket_id: str,
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    attachments = db.query(Attachment).filter(Attachment.ticket_id == ticket_id).order_by(Attachment.uploaded_at.desc()).all()
    return attachments


@router.get("/tickets/{ticket_id}/attachment")
def get_attachment_compat(
    ticket_id: str,
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    attachments = db.query(Attachment).filter(Attachment.ticket_id == ticket_id).order_by(Attachment.uploaded_at.desc()).all()
    if not attachments:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Return list of attachments or single attachment dict
    return [
        {
            "id": a.id,
            "ticket_id": a.ticket_id,
            "file_name": a.file_name,
            "file_path": a.file_path,
            "uploaded_at": a.uploaded_at.isoformat() if a.uploaded_at else None
        }
        for a in attachments
    ]


@router.post("/tickets/{ticket_id}/presigned-url")
@router.post("/tickets/{ticket_id}/presigned-upload")
def generate_presigned_upload_url(
    ticket_id: str,
    file_name: str,
    file_type: str = "image/png",
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    bucket_name = os.getenv("S3_BUCKET_NAME")
    if not bucket_name:
        # Fallback for local dev mode without AWS S3
        return {
            "upload_mode": "local",
            "upload_url": f"/api/tickets/{ticket_id}/attachment",
            "file_key": f"uploads/{ticket_id}/{file_name}"
        }

    try:
        import boto3
        s3_client = boto3.client("s3", region_name=os.getenv("AWS_REGION", "us-east-1"))
        file_key = f"uploads/{ticket_id}/{uuid.uuid4().hex[:8]}_{file_name}"
        
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": bucket_name,
                "Key": file_key,
                "ContentType": file_type
            },
            ExpiresIn=3600
        )

        return {
            "upload_mode": "s3_presigned",
            "upload_url": presigned_url,
            "file_key": file_key,
            "bucket": bucket_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate presigned S3 URL: {str(e)}")


@router.post("/tickets/{ticket_id}/confirm-attachment")
def confirm_s3_attachment(
    ticket_id: str,
    file_name: str,
    file_key: str,
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    attachment_id = str(uuid.uuid4())
    bucket_name = os.getenv("S3_BUCKET_NAME", "tkt-attachments")
    s3_path = f"s3://{bucket_name}/{file_key}"

    attachment = Attachment(
        id=attachment_id,
        ticket_id=ticket_id,
        file_name=file_name,
        file_path=s3_path
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return {
        "message": "Attachment confirmed",
        "id": attachment.id,
        "ticket_id": attachment.ticket_id,
        "file_name": attachment.file_name,
        "file_path": attachment.file_path,
        "uploaded_at": attachment.uploaded_at.isoformat() if attachment.uploaded_at else None
    }


@router.get("/attachments/{attachment_id}/file")
def download_specific_attachment_file(
    attachment_id: str,
    db: Session = Depends(get_db)
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if attachment.file_path.startswith("s3://"):
        # Generate presigned download URL for S3 stored objects
        bucket_name, key = attachment.file_path.replace("s3://", "").split("/", 1)
        try:
            import boto3
            s3_client = boto3.client("s3", region_name=os.getenv("AWS_REGION", "us-east-1"))
            download_url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket_name, "Key": key},
                ExpiresIn=3600
            )
            from fastapi.responses import RedirectResponse
            return RedirectResponse(url=download_url)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"S3 download link error: {str(e)}")

    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="Attachment file not found")

    return FileResponse(path=attachment.file_path, filename=attachment.file_name)


@router.get("/tickets/{ticket_id}/attachment/file")
def download_latest_attachment_file(
    ticket_id: str,
    db: Session = Depends(get_db)
):
    attachment = db.query(Attachment).filter(Attachment.ticket_id == ticket_id).order_by(Attachment.uploaded_at.desc()).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if attachment.file_path.startswith("s3://"):
        bucket_name, key = attachment.file_path.replace("s3://", "").split("/", 1)
        try:
            import boto3
            s3_client = boto3.client("s3", region_name=os.getenv("AWS_REGION", "us-east-1"))
            download_url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket_name, "Key": key},
                ExpiresIn=3600
            )
            from fastapi.responses import RedirectResponse
            return RedirectResponse(url=download_url)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"S3 download link error: {str(e)}")

    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="Attachment file not found")

    return FileResponse(path=attachment.file_path, filename=attachment.file_name)