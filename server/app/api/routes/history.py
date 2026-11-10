"""TRACE Request History Endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.history import (
    HistoryDeleteResponse,
    HistoryDetailResponse,
    HistoryListResponse,
)
from app.services.history_service import history_service

router = APIRouter(prefix="/history", tags=["History"])


@router.get(
    "",
    response_model=HistoryListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Request History",
    description="Retrieve paginated lightweight historical request summaries, ordered newest first.",
)
def get_history(
    limit: int = Query(50, ge=1, le=100, description="Maximum number of items to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
) -> HistoryListResponse:
    """Retrieve lightweight request history list."""
    return history_service.get_history_list(limit=limit, offset=offset, db=db)


@router.get(
    "/{record_id}",
    response_model=HistoryDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get History Detail",
    description="Retrieve full historical request details, payload, response, and diagnostic analyses.",
)
def get_history_detail(
    record_id: str,
    db: Session = Depends(get_db),
) -> HistoryDetailResponse:
    """Retrieve full request history item."""
    record = history_service.get_history_detail(record_id=record_id, db=db)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"History record '{record_id}' not found.",
        )
    return record


@router.delete(
    "/{record_id}",
    response_model=HistoryDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete History Item",
    description="Delete a single request history record by its ID.",
)
def delete_history_item(
    record_id: str,
    db: Session = Depends(get_db),
) -> HistoryDeleteResponse:
    """Delete single history record."""
    deleted = history_service.delete_history_item(record_id=record_id, db=db)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"History record '{record_id}' not found.",
        )
    return HistoryDeleteResponse(
        success=True,
        message=f"History record '{record_id}' deleted successfully.",
        deleted_count=1,
    )


@router.delete(
    "",
    response_model=HistoryDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Clear All History",
    description="Permanently delete all stored request history records.",
)
def clear_all_history(
    db: Session = Depends(get_db),
) -> HistoryDeleteResponse:
    """Clear all request history records."""
    count = history_service.clear_all_history(db=db)
    return HistoryDeleteResponse(
        success=True,
        message="All request history records cleared successfully.",
        deleted_count=count,
    )
