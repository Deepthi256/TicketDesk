from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import Comment, Ticket
from .schemas import (
    CommentCreate,
    CommentResponse
)

router = APIRouter()


@router.post(
    "/tickets/{ticket_id}/comments",
    response_model=CommentResponse
)
def create_comment(
    ticket_id: str,
    data: CommentCreate,
    db: Session = Depends(get_db)
):
    ticket = (
        db.query(Ticket)
        .filter(Ticket.id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    if not data.comment or not data.comment.strip():
        raise HTTPException(
            status_code=400,
            detail="Comment text is required"
        )

    comment = Comment(
        ticket_id=ticket_id,
        comment=data.comment.strip(),
        created_by=data.createdBy.strip() if data.createdBy else "User"
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return comment


@router.get(
    "/tickets/{ticket_id}/comments",
    response_model=list[CommentResponse]
)
def get_comments(
    ticket_id: str,
    db: Session = Depends(get_db)
):
    ticket = (
        db.query(Ticket)
        .filter(Ticket.id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    return (
        db.query(Comment)
        .filter(Comment.ticket_id == ticket_id)
        .order_by(Comment.created_at.asc())
        .all()
    )