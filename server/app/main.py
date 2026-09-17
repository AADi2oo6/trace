"""TRACE Backend — Application Entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="TRACE — API Testing and Network Analysis Tool Backend",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# Development CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Basic development health check endpoint."""
    return {"status": "ok"}
