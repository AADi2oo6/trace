"""TRACE Monitoring Pydantic Schemas."""

from datetime import datetime
from enum import Enum
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class MonitorMethod(str, Enum):
    """Supported HTTP methods for scheduled monitoring (GET or HEAD only for safety)."""
    GET = "GET"
    HEAD = "HEAD"


class MonitorStatus(str, Enum):
    """Operational status of a monitor."""
    UP = "UP"
    DOWN = "DOWN"
    PAUSED = "PAUSED"
    UNKNOWN = "UNKNOWN"


def compute_monitor_status(enabled: bool, last_checked_at: datetime | None, last_result: str | None) -> MonitorStatus:
    """Derive human-readable monitor status."""
    if not enabled:
        return MonitorStatus.PAUSED
    if last_checked_at is None:
        return MonitorStatus.UNKNOWN
    if last_result == "UP":
        return MonitorStatus.UP
    return MonitorStatus.DOWN


# ── Monitor CRUD Schemas ─────────────────────────────────────────────────────

class MonitorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128, description="Human-readable monitor name")
    url: str = Field(..., min_length=1, max_length=2048, description="Target endpoint URL")
    method: MonitorMethod = Field(default=MonitorMethod.GET, description="HTTP method (GET or HEAD)")
    interval_seconds: int = Field(default=300, ge=60, description="Check interval in seconds (minimum 60s)")
    timeout_seconds: float = Field(default=10.0, ge=1.0, le=30.0, description="Request timeout in seconds")


class MonitorUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=128)
    url: str | None = Field(default=None, min_length=1, max_length=2048)
    method: MonitorMethod | None = None
    interval_seconds: int | None = Field(default=None, ge=60)
    timeout_seconds: float | None = Field(default=None, ge=1.0, le=30.0)


class MonitorListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    url: str
    method: str
    interval_seconds: int
    timeout_seconds: float
    enabled: bool
    status: MonitorStatus
    last_checked_at: datetime | None
    next_run_at: datetime | None
    last_status_code: int | None
    last_duration_ms: float | None
    consecutive_failures: int
    created_at: datetime


class MonitorListResponse(BaseModel):
    items: list[MonitorListItem]
    total: int
    total_up: int
    total_down: int
    total_paused: int
    avg_response_time_ms: float | None


class MonitorDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    url: str
    method: str
    interval_seconds: int
    timeout_seconds: float
    enabled: bool
    status: MonitorStatus
    last_checked_at: datetime | None
    next_run_at: datetime | None
    last_status_code: int | None
    last_duration_ms: float | None
    consecutive_failures: int
    created_at: datetime
    updated_at: datetime


# ── Results & Analytics Schemas ──────────────────────────────────────────────

class MonitorResultItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    monitor_id: str
    checked_at: datetime
    success: bool
    status_code: int | None
    duration_ms: float | None
    response_size: int | None
    error_code: str | None
    error_message: str | None


class MonitorResultListResponse(BaseModel):
    items: list[MonitorResultItem]
    total: int


class AnalyticsDataPoint(BaseModel):
    timestamp: str
    duration_ms: float | None
    status_code: int | None
    success: bool


class MonitorAnalyticsResponse(BaseModel):
    period: str
    total_checks: int
    successful_checks: int
    failed_checks: int
    uptime_percentage: float | None
    average_duration_ms: float | None
    minimum_duration_ms: float | None
    maximum_duration_ms: float | None
    latest_status: MonitorStatus
    latest_check_at: datetime | None
    history_points: list[AnalyticsDataPoint]
