from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class UserSignup(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "User"


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TicketCreate(BaseModel):
    title: str
    description: str
    category: str
    priority: str
    created_by: Optional[str] = "User"


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str


class TicketResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    created_by: Optional[str] = "User"
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommentCreate(BaseModel):
    comment: str
    createdBy: str


class CommentResponse(BaseModel):
    id: str
    comment: str
    created_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttachmentResponse(BaseModel):
    id: str
    ticket_id: str
    file_name: str
    file_path: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)