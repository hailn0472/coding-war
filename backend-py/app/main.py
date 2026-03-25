"""
Coding War Backend — FastAPI Application Entry Point
Equivalent to: backend/src/index.ts
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.request_logger import RequestLoggerMiddleware
from app.middleware.error_handler import register_exception_handlers
from app.database import engine
from app.utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Application startup and shutdown events."""
    logger.info("Starting Coding War Backend", environment=settings.environment)
    yield
    # Shutdown: dispose database engine
    await engine.dispose()
    logger.info("Coding War Backend shut down")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API for Coding War - Online Judge Platform",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
    lifespan=lifespan,
)

# ─── Middleware (order matters: last added = first executed) ───

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip Compression (equivalent to `compression()`)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security Headers (equivalent to `helmet()`)
app.add_middleware(BaseHTTPMiddleware, dispatch=SecurityHeadersMiddleware())

# Request ID (equivalent to `requestIdMiddleware`)
app.add_middleware(BaseHTTPMiddleware, dispatch=RequestIdMiddleware())

# Request Logger
app.add_middleware(BaseHTTPMiddleware, dispatch=RequestLoggerMiddleware())

# ─── Exception Handlers ───
register_exception_handlers(app)


# ─── Health Check ───
@app.get("/health", tags=["Health"])
async def health_check():
    """Basic health check endpoint."""
    from datetime import datetime, timezone
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


# ─── Mount API Routers ───
from app.routers import auth, problems, submissions, contests, users, admin  # noqa: E402

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(problems.router, prefix="/api/problems", tags=["Problems"])
app.include_router(submissions.router, prefix="/api/submissions", tags=["Submissions"])
app.include_router(contests.router, prefix="/api/contests", tags=["Contests"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


# ─── Mount Socket.IO ───
from app.services.socket_service import socket_app  # noqa: E402
app.mount("/socket.io", socket_app)


# ─── API Info ───
@app.get("/api", tags=["Info"])
async def api_info():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "description": "Backend API for Coding War - Online Judge Platform",
        "endpoints": {
            "health": "/health",
            "api": "/api",
            "auth": "/api/auth",
            "problems": "/api/problems",
            "submissions": "/api/submissions",
            "contests": "/api/contests",
            "users": "/api/users",
            "admin": "/api/admin",
        },
    }
