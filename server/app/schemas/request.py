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


class HeaderCategory(str, Enum):
    """Controlled categorization of HTTP headers."""

    GENERAL = "General"
    CONTENT = "Content"
    CACHING = "Caching"
    SECURITY = "Security"
    AUTHENTICATION = "Authentication"
    CORS = "CORS"
    COOKIES = "Cookies"
    CONNECTION = "Connection"
    REDIRECTION = "Redirection"
    SERVER = "Server"
    OTHER = "Other"


class HeaderSource(str, Enum):
    """Origin source of the analyzed header (request vs response)."""

    REQUEST = "request"
    RESPONSE = "response"


class HeaderAnalysisItem(BaseModel):
    """Normalized analysis and explanation of a single HTTP header."""

    model_config = ConfigDict(extra="ignore")

    name: str = Field(description="Header name")
    value: str = Field(description="Header value")
    category: HeaderCategory = Field(description="Controlled classification category")
    description: str = Field(description="Technical explanation of the header purpose")
    source: HeaderSource = Field(description="Header source: request or response")
    observations: list[str] | None = Field(default=None, description="Neutral contextual observations")



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


class OptionsCorsInfo(BaseModel):
    """CORS-related response headers observed during an OPTIONS exchange."""

    model_config = ConfigDict(extra="ignore")

    allow_origin: str | None = Field(
        default=None,
        description="Value of Access-Control-Allow-Origin response header",
    )
    allow_methods: list[str] | None = Field(
        default=None,
        description="List of HTTP methods parsed from Access-Control-Allow-Methods",
    )
    allow_headers: list[str] | None = Field(
        default=None,
        description="List of allowed request headers parsed from Access-Control-Allow-Headers",
    )
    allow_credentials: bool | None = Field(
        default=None,
        description="Parsed boolean from Access-Control-Allow-Credentials",
    )
    max_age: int | None = Field(
        default=None,
        description="Parsed integer seconds from Access-Control-Max-Age",
    )
    expose_headers: list[str] | None = Field(
        default=None,
        description="List of exposed headers parsed from Access-Control-Expose-Headers",
    )


class OptionsAnalysis(BaseModel):
    """Interpretation of server capabilities and advertised policies from an OPTIONS response."""

    model_config = ConfigDict(extra="ignore")

    is_options_request: bool = Field(
        default=True,
        description="Indicates this analysis is specifically for an OPTIONS exchange",
    )
    has_allow_header: bool = Field(
        default=False,
        description="True if the response contained an Allow header",
    )
    allowed_methods: list[str] = Field(
        default_factory=list,
        description="Normalized HTTP methods advertised by the resource via the Allow header",
    )
    cors: OptionsCorsInfo | None = Field(
        default=None,
        description="CORS-related headers present on the OPTIONS response, or None if absent",
    )
    observations: list[str] = Field(
        default_factory=list,
        description="Neutral, non-speculative factual observations regarding the OPTIONS exchange",
    )


class CorsAnalysis(BaseModel):
    """Structured technical evaluation of CORS configuration across request and response."""

    model_config = ConfigDict(extra="ignore")

    is_cors_request: bool = Field(
        default=False,
        description="True if CORS-related request headers (Origin, Access-Control-Request-*) were present",
    )
    request_origin: str | None = Field(
        default=None,
        description="Origin header supplied by the client request",
    )
    allowed_origin: str | None = Field(
        default=None,
        description="Value of Access-Control-Allow-Origin response header",
    )
    origin_allowed: bool | None = Field(
        default=None,
        description="True if request_origin is permitted by allowed_origin or wildcard; False if mismatched/absent; None if no request origin supplied",
    )
    wildcard_origin: bool = Field(
        default=False,
        description="True if Access-Control-Allow-Origin is wildcard '*'",
    )
    requested_method: str | None = Field(
        default=None,
        description="Requested HTTP method from Access-Control-Request-Method or request method",
    )
    allowed_methods: list[str] | None = Field(
        default=None,
        description="CORS methods permitted by Access-Control-Allow-Methods",
    )
    method_allowed: bool | None = Field(
        default=None,
        description="True if requested method is permitted by Access-Control-Allow-Methods; False if not; None if not applicable",
    )
    requested_headers: list[str] | None = Field(
        default=None,
        description="Headers requested via Access-Control-Request-Headers",
    )
    allowed_headers: list[str] | None = Field(
        default=None,
        description="Headers permitted via Access-Control-Allow-Headers",
    )
    headers_allowed: bool | None = Field(
        default=None,
        description="True if all requested headers are permitted by Access-Control-Allow-Headers; False if any missing; None if not applicable",
    )
    allow_credentials: bool | None = Field(
        default=None,
        description="Parsed boolean from Access-Control-Allow-Credentials",
    )
    max_age: int | None = Field(
        default=None,
        description="Parsed non-negative integer seconds from Access-Control-Max-Age",
    )
    expose_headers: list[str] | None = Field(
        default=None,
        description="List of response headers exposed to scripts via Access-Control-Expose-Headers",
    )
    observations: list[str] = Field(
        default_factory=list,
        description="Neutral, non-speculative technical observations regarding the CORS exchange",
    )


class DnsAnalysis(BaseModel):
    """Structured DNS resolution analysis for the target hostname."""

    model_config = ConfigDict(extra="ignore")

    hostname: str = Field(
        description="Target hostname resolved via DNS",
    )
    resolved: bool = Field(
        default=False,
        description="True if DNS resolution succeeded and produced at least one address",
    )
    ipv4_addresses: list[str] = Field(
        default_factory=list,
        description="Deduplicated list of resolved IPv4 addresses (A records)",
    )
    ipv6_addresses: list[str] = Field(
        default_factory=list,
        description="Deduplicated list of resolved IPv6 addresses (AAAA records)",
    )
    resolution_time_ms: float | None = Field(
        default=None,
        description="Measured DNS resolution duration in milliseconds",
    )
    error: str | None = Field(
        default=None,
        description="Safe error diagnostic message if DNS resolution failed",
    )
    observations: list[str] = Field(
        default_factory=list,
        description="Neutral, non-speculative technical observations regarding DNS resolution",
    )


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
    header_analysis: list[HeaderAnalysisItem] | None = Field(
        default=None,
        description="Detailed categorical analysis and descriptions of request and response headers",
    )
    options_analysis: OptionsAnalysis | None = Field(
        default=None,
        description="Detailed analysis of OPTIONS response (allowed methods, advertised CORS headers) when method is OPTIONS",
    )
    cors_analysis: CorsAnalysis | None = Field(
        default=None,
        description="Structured analysis of CORS configuration and origin/method/header matching",
    )
    dns_analysis: DnsAnalysis | None = Field(
        default=None,
        description="Structured analysis of DNS resolution, IPv4/IPv6 addresses, and lookup duration",
    )
    error: ErrorDetail | None = Field(
        default=None,
        description="Structured error diagnostic if the exchange failed or is not implemented",
    )
