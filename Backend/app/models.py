import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    username = Column(
        String(100),
        unique=True,
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(50),
        default="User"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    title = Column(
        String(255),
        nullable=False
    )

    description = Column(
        Text,
        nullable=False
    )

    category = Column(
        String(100),
        nullable=False
    )

    priority = Column(
        String(20),
        nullable=False
    )

    status = Column(
        String(20),
        default="OPEN"
    )

    created_by = Column(
        String(100),
        default="User"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    comments = relationship(
        "Comment",
        back_populates="ticket",
        cascade="all,delete"
    )

    attachment = relationship(
        "Attachment",
        back_populates="ticket",
        uselist=False,
        cascade="all,delete"
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    ticket_id = Column(
        String,
        ForeignKey("tickets.id")
    )

    comment = Column(
        Text,
        nullable=False
    )

    created_by = Column(
        String(100),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    ticket = relationship(
        "Ticket",
        back_populates="comments"
    )


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    ticket_id = Column(
        String,
        ForeignKey("tickets.id")
    )

    file_name = Column(
        String,
        nullable=False
    )

    file_path = Column(
        String,
        nullable=False
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    ticket = relationship(
        "Ticket",
        back_populates="attachment"
    )