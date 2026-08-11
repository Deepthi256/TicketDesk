import hashlib
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .schemas import UserSignup, UserLogin, UserResponse, AuthToken

router = APIRouter()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


@router.post("/auth/signup", response_model=AuthToken)
def signup(data: UserSignup, db: Session = Depends(get_db)):
    if not data.username or not data.username.strip():
        raise HTTPException(status_code=400, detail="Username is required")
    if not data.email or not data.email.strip():
        raise HTTPException(status_code=400, detail="Email is required")
    if not data.password or len(data.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    username_clean = data.username.strip()
    email_clean = data.email.strip().lower()

    # Prevent anyone from self-registering as Admin
    # Admin is pre-seeded and cannot be created via signup
    if username_clean.lower() == "admin":
        raise HTTPException(
            status_code=400,
            detail="The username 'admin' is reserved. Please choose a different username."
        )

    existing_user = db.query(User).filter(
        (User.username == username_clean) | (User.email == email_clean)
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    # All self-registered users are always "User" role — Admin cannot be created via signup
    user = User(
        username=username_clean,
        email=email_clean,
        password_hash=hash_password(data.password),
        role="User"
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    user_resp = UserResponse.model_validate(user)
    token = f"fake-jwt-token-{uuid.uuid4()}"

    return AuthToken(access_token=token, user=user_resp)


@router.post("/auth/login", response_model=AuthToken)
def login(data: UserLogin, db: Session = Depends(get_db)):
    if not data.username or not data.password:
        raise HTTPException(status_code=400, detail="Username and password required")

    username_clean = data.username.strip()
    user = db.query(User).filter(
        (User.username == username_clean) | (User.email == username_clean.lower())
    ).first()

    if not user or user.password_hash != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    user_resp = UserResponse.model_validate(user)
    token = f"fake-jwt-token-{uuid.uuid4()}"

    return AuthToken(access_token=token, user=user_resp)
