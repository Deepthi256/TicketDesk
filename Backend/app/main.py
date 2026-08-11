import os
import hashlib
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine, SessionLocal
from .config import UPLOAD_FOLDER
from .models import User
from . import (
    tickets,
    comments,
    attachments,
    dashboard,
    health,
    auth
)

Base.metadata.create_all(bind=engine)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def seed_admin():
    """Ensure a single admin account exists. Credentials: admin / admin@123"""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == "admin").first()
        if not existing:
            admin = User(
                id=str(uuid.uuid4()),
                username="admin",
                email="admin@ticketdesk.local",
                password_hash=hashlib.sha256("admin@123".encode("utf-8")).hexdigest(),
                role="Admin"
            )
            db.add(admin)
            db.commit()
            print("[TicketDesk] [OK] Default admin account created: username=admin, password=admin@123")
        else:
            print("[TicketDesk] [OK] Admin account already exists.")
    finally:
        db.close()


seed_admin()

app = FastAPI(
    title="TicketDesk API",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_FOLDER), name="uploads")

app.include_router(health.router)
app.include_router(auth.router, prefix="/api")
app.include_router(tickets.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(attachments.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

# Serve React Frontend static assets and SPA fallback
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend_dist"))
if not os.path.exists(FRONTEND_DIST):
    FRONTEND_DIST = "/app/frontend_dist"

if os.path.exists(FRONTEND_DIST):
    from fastapi.responses import FileResponse
    from fastapi import HTTPException

    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith(("api", "health", "docs", "openapi.json", "uploads", "redoc")):
            raise HTTPException(status_code=404, detail="Not Found")
        target_file = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend index.html not found")