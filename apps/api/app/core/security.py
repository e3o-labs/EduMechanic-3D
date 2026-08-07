"""
API Security & Rate-Limiting Core Middleware for EduMechanic 3D
Protect API endpoints against DOS abuse, parameter tampering, and security vulnerabilities.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import time
from typing import Dict, Tuple

class SecurityAuditMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests_per_minute: int = 100):
        super().__init__(app)
        self.max_requests_per_minute = max_requests_per_minute
        self.request_counts: Dict[str, Tuple[int, float]] = {}

    async def dispatch(self, request: Request, call_next) -> Response:
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()

        # Rate Limiter logic
        count, window_start = self.request_counts.get(client_ip, (0, now))
        if now - window_start > 60:
            count = 1
            window_start = now
        else:
            count += 1

        self.request_counts[client_ip] = (count, window_start)

        if count > self.max_requests_per_minute:
            return Response(
                content='{"detail": "Rate limit exceeded. Maximum 100 requests per minute allowed."}',
                status_code=429,
                media_type="application/json"
            )

        response = await call_next(request)

        # Enforce Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"

        return response
