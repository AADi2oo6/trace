"""TRACE Core Error Definitions and Models."""

from enum import Enum
from typing import Any
from pydantic import BaseModel, ConfigDict


class ErrorCode(str, Enum):
    """Standardized error codes for TRACE API and network operations."""

    INVALID_REQUEST = "INVALID_REQUEST"
    INVALID_URL = "INVALID_URL"
    REQUEST_TIMEOUT = "REQUEST_TIMEOUT"
    DNS_ERROR = "DNS_ERROR"
    CONNECTION_ERROR = "CONNECTION_ERROR"
    RESPONSE_TOO_LARGE = "RESPONSE_TOO_LARGE"
    SSRF_BLOCKED = "SSRF_BLOCKED"
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED"


class ErrorDetail(BaseModel):
    """Structured error payload providing predictable error codes and messages."""

    model_config = ConfigDict(extra="ignore")

    code: ErrorCode
    message: str
    details: dict[str, Any] | None = None
