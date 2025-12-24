from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .api.endpoints import apps, upload, auth, linebot
from .core.database import engine, Base
from . import models
import os

# Create Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Entry Portal API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STATIC_DIR = os.path.join(BASE_DIR, "static")
os.makedirs(STATIC_DIR, exist_ok=True) # Ensure static dir exists

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Include Routers
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(apps.router, prefix="/api", tags=["apps"])
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(linebot.router, prefix="/api", tags=["linebot"])


