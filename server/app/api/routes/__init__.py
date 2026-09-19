"""API routes aggregation."""

from fastapi import APIRouter

from app.api.routes.requests import router as requests_router

api_router = APIRouter()
api_router.include_router(requests_router)
