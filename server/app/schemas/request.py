"""TRACE Request and Response Schemas."""

from enum import Enum
from typing import Any
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.errors import ErrorDetail


class HTTPMethod(str, Enum):
    """Supported HTTP request methods for TRACE."""

    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    HEAD = "HEAD"
    OPTIONS = "OPTIONS"


class StatusCategory(str, Enum):
    """Normalized category for standard HTTP status code ranges."""

    INFORMATIONAL = "informational"  # 100-199
    SUCCESS = "success"              # 200-299
    REDIRECTION = "redirection"      # 300-399
    CLIENT_ERROR = "client_error"    # 400-499
    SERVER_ERROR = "server_error"    # 500-599


class BodyType(str, Enum):
    """Normalized body payload format classification."""

    JSON = "json"
    TEXT = "text"
    HTML = "html"
    EMPTY = "empty"
    BINARY = "binary"


class RequestCreate(BaseModel):
    """Validation schema for incoming TRACE request execution instructions."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    method: HTTPMethod = Field(
        ...,
        description="HTTP method to execute (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)",
        examples=["GET", "POST"],
    )
    url: str = Field(
        ...,
        min_length=1,
        description="Target URL including http or https scheme",
        examples=["https://example.com/api"],
    )
    headers: dict[str, str] = Field(
        default_factory=dict,
        description="HTTP request headers as key-value pairs",
    )
    query_params: dict[str, str] = Field(
        default_factory=dict,
        alias="params",
        description="Query parameters as key-value pairs",
    )
    body: str | dict[str, Any] | list[Any] | None = Field(
        default=None,
        description="Optional request body payload (JSON object, array, or raw text)",
    )

    @field_validator("method", mode="before")
    @classmethod
    def normalize_method(cls, value: Any) -> Any:
        """Normalize HTTP method strings to uppercase."""
        if isinstance(value, str):
            return value.strip().upper()
        return value

    @field_validator("url")
    @classmethod
    def validate_url_structure(cls, value: str) -> str:
        """Validate URL scheme and host presence without executing network requests."""
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("URL cannot be empty")

        parsed = urlparse(cleaned)
        if parsed.scheme.lower() not in ("http", "https"):
            raise ValueError("URL must have an 'http' or 'https' scheme")
        if not parsed.netloc:
            raise ValueError("URL must include a valid host target")

        return cleaned


class RequestResponse(BaseModel):
    """Standardized response schema representing request results and Response Inspector diagnostics."""

    model_config = ConfigDict(extra="ignore")

    success: bool = Field(
        default=False,
        description="True if the request executed and completed an HTTP exchange",
    )
    status_code: int | None = Field(
        default=None,
        description="HTTP response status code returned by target server",
    )
    status_text: str | None = Field(
        default=None,
        description="Standard HTTP status phrase (e.g. OK, Created, Not Found)",
    )
    status_category: StatusCategory | None = Field(
        default=None,
        description="Normalized category of the HTTP status code (informational, success, redirection, client_error, server_error)",
    )
    message: str | None = Field(
        default=None,
        description="Human-readable execution or status message",
    )
    request_id: str | None = Field(
        default=None,
        description="Unique request identifier for tracking and history",
    )
    method: str | None = Field(
        default=None,
        description="Executed HTTP method",
    )
    url: str | None = Field(
        default=None,
        description="Executed target URL",
    )
    headers: dict[str, str] | None = Field(
        default=None,
        description="Response headers returned by target server",
    )
    content_type: str | None = Field(
        default=None,
        description="Content-Type header value or detected MIME type",
    )
    body: str | None = Field(
        default=None,
        description="Formatted response body text, or null for empty/binary payloads",
    )
    body_type: BodyType | None = Field(
        default=None,
        description="Detected body format classification (json, text, html, empty, binary)",
    )
    body_size: int | None = Field(
        default=None,
        description="Exact byte size of the received response body",
    )
    duration_ms: float | None = Field(
        default=None,
        description="Total round-trip request duration in milliseconds",
    )
    error: ErrorDetail | None = Field(
        default=None,
        description="Structured error diagnostic if the exchange failed or is not implemented",
    )
