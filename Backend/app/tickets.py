from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .database import get_db
from .models import Ticket
from .schemas import (
    TicketCreate,
    TicketUpdate,
    TicketResponse,
    StatusUpdate
)
from .utils import validate_status_change, ALLOWED_STATUS

router = APIRouter()


@router.post(
    "/tickets",
    response_model=TicketResponse
)
def create_ticket(
    ticket: TicketCreate,
    db: Session = Depends(get_db)
):
    if not ticket.title or not ticket.title.strip():
        raise HTTPException(status_code=400, detail="Title is required")
    if not ticket.description or not ticket.description.strip():
        raise HTTPException(status_code=400, detail="Description is required")
    if not ticket.category or not ticket.category.strip():
        raise HTTPException(status_code=400, detail="Category is required")

    priority_upper = ticket.priority.upper()
    if priority_upper not in ["HIGH", "MEDIUM", "LOW"]:
        raise HTTPException(status_code=400, detail="Invalid priority value")

    new_ticket = Ticket(
        title=ticket.title.strip(),
        description=ticket.description.strip(),
        category=ticket.category.strip(),
        priority=priority_upper,
        status="OPEN",
        created_by=ticket.created_by.strip() if ticket.created_by else "User"
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return new_ticket


@router.get(
    "/tickets",
    response_model=list[TicketResponse]
)
def get_tickets(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    sort: Optional[str] = Query("newest"),
    db: Session = Depends(get_db)
):
    query = db.query(Ticket)

    if username:
        query = query.filter(Ticket.created_by == username.strip())

    if status and status.upper() != "ALL":
        query = query.filter(Ticket.status == status.upper())

    if category and category.upper() != "ALL":
        query = query.filter(Ticket.category == category)

    if priority and priority.upper() != "ALL":
        query = query.filter(Ticket.priority == priority.upper())

    if search:
        query = query.filter(Ticket.title.ilike(f"%{search.strip()}%"))

    if sort == "oldest":
        query = query.order_by(Ticket.created_at.asc())
    else:
        query = query.order_by(Ticket.created_at.desc())

    return query.all()


@router.get(
    "/tickets/{ticket_id}",
    response_model=TicketResponse
)
def get_ticket(
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

    return ticket


@router.put(
    "/tickets/{ticket_id}",
    response_model=TicketResponse
)
def update_ticket(
    ticket_id: str,
    data: TicketUpdate,
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

    update_dict = data.model_dump(exclude_none=True)
    if "priority" in update_dict:
        update_dict["priority"] = update_dict["priority"].upper()

    for key, value in update_dict.items():
        setattr(ticket, key, value)

    db.commit()
    db.refresh(ticket)

    return ticket


@router.patch(
    "/tickets/{ticket_id}/status",
    response_model=TicketResponse
)
def update_status(
    ticket_id: str,
    data: StatusUpdate,
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

    validate_status_change(ticket.status, data.status.upper())

    ticket.status = data.status.upper()

    db.commit()
    db.refresh(ticket)

    return ticket