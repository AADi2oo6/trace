"""TRACE Request Execution Endpoints."""

from fastapi import APIRouter, status

from app.schemas.request import RequestCreate, RequestResponse
from app.services.request_service import request_service

router = APIRouter(prefix="/requests", tags=["Requests"])


@router.post(
    "",
    response_model=RequestResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute API Request",
    description="Receive request payload, validate schema, and dispatch to execution service.",
)
@router.post(
    "/execute",
    response_model=RequestResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute API Request (Alias)",
    description="Alias for POST /api/requests aligned with TRACE MVP build plan specification.",
    include_in_schema=False,
)
async def execute_request(request_data: RequestCreate) -> RequestResponse:
    """Validate request and delegate execution to service layer."""
    return await request_service.execute_request(request_data)

