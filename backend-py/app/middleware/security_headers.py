"""
Security Headers Middleware
Equivalent to: helmet() in backend/src/index.ts
SDRD: ASVS V3.4 (security headers) + assets/code/fixed/security_headers.py
"""

from app.config import settings
from starlette.requests import Request
from starlette.responses import Response

# Paths that need relaxed CSP for Swagger UI
_DOCS_PATHS = {"/docs", "/redoc", "/openapi.json"}


class SecurityHeadersMiddleware:
    """
    Set security headers on every response.
    Implements the same protections as helmet.js:
    - Content-Security-Policy
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - Strict-Transport-Security (HSTS)
    - X-XSS-Protection
    - Referrer-Policy
    - Permissions-Policy
    """

    async def __call__(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Enable HSTS (1 year, include subdomains)
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

        # XSS Protection (legacy, but defense-in-depth)
        response.headers["X-XSS-Protection"] = "0"

        # Prevent referrer leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Content Security Policy
        if request.url.path in _DOCS_PATHS and settings.environment != "production":
            # Relaxed CSP for Swagger UI in development
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' data: https://fastapi.tiangolo.com; "
                "connect-src 'self'; "
                "frame-ancestors 'none'"
            )
        else:
            # Strict CSP for API endpoints
            response.headers["Content-Security-Policy"] = (
                "default-src 'none'; frame-ancestors 'none'"
            )

        # Permissions Policy — disable unused browser features
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )

        # Remove server identification header
        if "server" in response.headers:
            del response.headers["server"]

        return response
