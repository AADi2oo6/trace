"""TRACE History Schemas and Data Transfer Objects."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field

from app.schemas.request import (
    CorsAnalysis,
    DnsAnalysis,
    ErrorDetail,
    HeaderAnalysisItem,
    HTTPMethod,
    OptionsAnalysis,
    RequestJourney,
    StatusCategory,
)


class HistoryListItem(BaseModel):
    """Lightweight metadata item for the History list view."""

    id: str
    created_at: datetime
    method: HTTPMethod
    url: str
    status_code: int | None = None
    status_text: str | None = None
    status_category: StatusCategory | None = None
    duration_ms: float | None = None
    response_size: int | None = None
    content_type: str | None = None
    success: bool = True
    error: ErrorDetail | None = None


class HistoryListResponse(BaseModel):
    """Paginated or listed collection of history records."""

    items: list[HistoryListItem]
    total: int


class HistoryDetailResponse(BaseModel):
    """Full historical request and response representation for detailed inspection."""

    id: str
    created_at: datetime

    # Request data
    method: HTTPMethod
    url: str
    query_params: dict[str, str] | None = None
    request_headers: dict[str, str] | None = None
    request_body: str | None = None
    request_body_type: str | None = None

    # Status & timing
    success: bool = True
    status_code: int | None = None
    status_text: str | None = None
    status_category: StatusCategory | None = None
    duration_ms: float | None = None

    # Response data
    content_type: str | None = None
    response_size: int | None = None
    response_body: str | None = None
    response_body_truncated: bool = False
    response_headers: dict[str, str] | None = None

    # Analyses
    dns_analysis: DnsAnalysis | None = None
    header_analysis: list[HeaderAnalysisItem] | None = None
    cors_analysis: CorsAnalysis | None = None
    options_analysis: OptionsAnalysis | None = None
    request_journey: RequestJourney | None = None

    # Error details
    error: ErrorDetail | None = None


class HistoryDeleteResponse(BaseModel):
    """Response returned upon deletion of a history record or clearing all history."""

    success: bool = True
    message: str
    deleted_count: int = 1
