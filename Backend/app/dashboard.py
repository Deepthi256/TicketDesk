from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from .database import get_db
from .models import Ticket
from .schemas import TicketResponse

router = APIRouter()


@router.get("/dashboard")
def dashboard(
    username: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Ticket)
    if username:
        query = query.filter(Ticket.created_by == username.strip())

    total = query.count()
    open_count = query.filter(Ticket.status == "OPEN").count()
    in_progress = query.filter(Ticket.status == "IN_PROGRESS").count()
    resolved = query.filter(Ticket.status == "RESOLVED").count()
    closed = query.filter(Ticket.status == "CLOSED").count()

    high_priority = query.filter(Ticket.priority == "HIGH").count()
    medium_priority = query.filter(Ticket.priority == "MEDIUM").count()
    low_priority = query.filter(Ticket.priority == "LOW").count()

    recent_tickets_query = (
        query.order_by(Ticket.created_at.desc())
        .limit(10)
        .all()
    )

    recent_tickets = [
        TicketResponse.model_validate(t).model_dump(mode="json")
        for t in recent_tickets_query
    ]

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress,
        "resolved": resolved,
        "closed": closed,
        "priority_summary": {
            "high": high_priority,
            "medium": medium_priority,
            "low": low_priority,
        },
        "recent_tickets": recent_tickets,
    }
