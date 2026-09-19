"""TRACE Backend — Application Entrypoint."""

from fastapi import FastAPI

from app.api.routes import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="TRACE — API Testing and Network Analysis Tool Backend",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# Register API routes under /api
app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Basic development health check endpoint."""
    return {"status": "ok"}
