"""TRACE Backend — Application Entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="TRACE — API Testing and Network Analysis Tool Backend",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# Configure CORS for local browser development (e.g. Vite frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_allowed_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization"],
)

# Register API routes under /api
app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Basic development health check endpoint."""
    return {"status": "ok"}
