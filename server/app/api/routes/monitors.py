"""TRACE Monitoring and Performance Analytics API Endpoints."""

from datetime import datetime
import logging
from typing import Any, Literal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import SecurityValidationError
from app.db.session import get_db
from app.schemas.monitor import (
    MonitorCreate,
    MonitorUpdate,
    MonitorListItem,
    MonitorListResponse,
    MonitorDetailResponse,
    MonitorResultItem,
    MonitorResultListResponse,
    MonitorAnalyticsResponse,
)
from app.services.monitor_service import monitor_service
from app.services.scheduler import monitoring_scheduler, ConcurrentExecutionError

logger = logging.getLogger("trace.api.monitors")

router = APIRouter(prefix="/monitors", tags=["Monitoring"])


@router.post(
    "",
    response_model=MonitorDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new API monitoring target",
)
def create_monitor(
    payload: MonitorCreate,
    db: Session = Depends(get_db),
) -> MonitorDetailResponse:
    """Register an endpoint for automated periodic health checks."""
    try:
        monitor = monitor_service.create_monitor(db, payload)
        detail = monitor_service.get_monitor_detail(db, monitor.id)
        if not detail:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Monitor created but failed to load detail.",
            )
        return detail
    except SecurityValidationError as sec_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": sec_err.code.value, "message": sec_err.message},
        ) from sec_err
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err),
        ) from val_err


@router.get(
    "",
    response_model=MonitorListResponse,
    summary="List all registered monitors with summary metrics",
)
def list_monitors(
    db: Session = Depends(get_db),
) -> MonitorListResponse:
    """Retrieve all monitors with computed operational statuses and fleet health metrics."""
    return monitor_service.get_monitors(db)


@router.get(
    "/{monitor_id}",
    response_model=MonitorDetailResponse,
    summary="Retrieve monitor details",
)
def get_monitor(
    monitor_id: str,
    db: Session = Depends(get_db),
) -> MonitorDetailResponse:
    """Retrieve configuration and current state for a specific monitor."""
    detail = monitor_service.get_monitor_detail(db, monitor_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitor '{monitor_id}' not found.",
        )
    return detail


@router.patch(
    "/{monitor_id}",
    response_model=MonitorDetailResponse,
    summary="Update monitor configuration",
)
def update_monitor(
    monitor_id: str,
    payload: MonitorUpdate,
    db: Session = Depends(get_db),
) -> MonitorDetailResponse:
    """Update monitor parameters (name, URL, interval, timeout)."""
    try:
        updated = monitor_service.update_monitor(db, monitor_id, payload)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Monitor '{monitor_id}' not found.",
            )
        detail = monitor_service.get_monitor_detail(db, monitor_id)
        return detail  # type: ignore[return-value]
    except SecurityValidationError as sec_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": sec_err.code.value, "message": sec_err.message},
        ) from sec_err
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err),
        ) from val_err


@router.delete(
    "/{monitor_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a monitor and its historical results",
)
def delete_monitor(
    monitor_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Permanently delete a monitor and cascade delete all its recorded results."""
    deleted = monitor_service.delete_monitor(db, monitor_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitor '{monitor_id}' not found.",
        )
    return {"success": True, "message": f"Monitor '{monitor_id}' deleted."}


@router.post(
    "/{monitor_id}/pause",
    response_model=MonitorDetailResponse,
    summary="Pause scheduled checks for a monitor",
)
def pause_monitor(
    monitor_id: str,
    db: Session = Depends(get_db),
) -> MonitorDetailResponse:
    """Pause an active monitor. Existing historical results are preserved."""
    paused = monitor_service.pause_monitor(db, monitor_id)
    if not paused:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitor '{monitor_id}' not found.",
        )
    return monitor_service.get_monitor_detail(db, monitor_id)  # type: ignore[return-value]


@router.post(
    "/{monitor_id}/resume",
    response_model=MonitorDetailResponse,
    summary="Resume scheduled checks for a monitor",
)
def resume_monitor(
    monitor_id: str,
    db: Session = Depends(get_db),
) -> MonitorDetailResponse:
    """Resume a paused monitor and queue an immediate check."""
    resumed = monitor_service.resume_monitor(db, monitor_id)
    if not resumed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitor '{monitor_id}' not found.",
        )
    return monitor_service.get_monitor_detail(db, monitor_id)  # type: ignore[return-value]


@router.post(
    "/{monitor_id}/run",
    response_model=MonitorResultItem,
    summary="Execute an immediate health check",
)
async def run_monitor_now(
    monitor_id: str,
    db: Session = Depends(get_db),
) -> MonitorResultItem:
    """Trigger an immediate check without waiting for the scheduled interval."""
    # Ensure monitor exists
    monitor = monitor_service.get_monitor(db, monitor_id)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitor '{monitor_id}' not found.",
        )

    try:
        result = await monitoring_scheduler.trigger_immediate_run(monitor_id, db)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Check execution failed to generate a result.",
            )
        return result
    except ConcurrentExecutionError as conc_err:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(conc_err),
        ) from conc_err


@router.get(
    "/{monitor_id}/results",
    response_model=MonitorResultListResponse,
    summary="Query historical check results",
)
def get_monitor_results(
    monitor_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    start_time: datetime | None = Query(default=None),
    end_time: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
) -> MonitorResultListResponse:
    """Retrieve paginated historical check results for a monitor (newest first)."""
    monitor = monitor_service.get_monitor(db, monitor_id)
    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitor '{monitor_id}' not found.",
        )

    items, total = monitor_service.get_results(
        db,
        monitor_id=monitor_id,
        limit=limit,
        offset=offset,
        start_time=start_time,
        end_time=end_time,
    )
    return MonitorResultListResponse(items=items, total=total)


@router.get(
    "/{monitor_id}/analytics",
    response_model=MonitorAnalyticsResponse,
    summary="Retrieve performance and uptime analytics",
)
def get_monitor_analytics(
    monitor_id: str,
    period: Literal["1h", "24h", "7d", "30d"] = Query(default="24h"),
    db: Session = Depends(get_db),
) -> MonitorAnalyticsResponse:
    """Calculate uptime percentage, latency stats, and time-series data for performance charts."""
    analytics = monitor_service.get_analytics(db, monitor_id, period=period)
    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitor '{monitor_id}' not found.",
        )
    return analytics
