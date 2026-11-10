"""TRACE Request Execution Endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.request import RequestCreate, RequestResponse
from app.services.history_service import history_service
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
async def execute_request(
    request_data: RequestCreate,
    db: Session = Depends(get_db),
) -> RequestResponse:
    """Validate request, delegate execution to service layer, and persist trace to history."""
    response = await request_service.execute_request(request_data)
    # Persist request & response safely into SQLite
    history_service.save_request_execution(request_data, response, db=db)
    return response

