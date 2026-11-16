"""Pydantic schemas for the TRACE Controlled Demo API."""

from typing import Any
from pydantic import BaseModel, Field


class DemoQueryParamDef(BaseModel):
    name: str
    type: str = "string"
    required: bool = False
    default: Any | None = None
    description: str
    options: list[str] | None = None


class DemoEndpointCatalogueItem(BaseModel):
    id: str
    name: str
    category: str
    method: str
    path: str
    description: str
    expected_status: int
    query_params: list[DemoQueryParamDef] = Field(default_factory=list)
    headers: dict[str, str] = Field(default_factory=dict)
    body: Any | None = None
    sample_response: Any | None = None
    tags: list[str] = Field(default_factory=list)


class DemoCatalogueResponse(BaseModel):
    endpoints: list[DemoEndpointCatalogueItem]
    categories: list[str]
    total: int


class DemoHelloResponse(BaseModel):
    message: str = "Hello from TRACE Demo API!"
    status: str = "ok"
    timestamp: str


class DemoHealthDependency(BaseModel):
    database: str = "healthy"
    cache: str = "healthy"
    worker_pool: str = "idle"


class DemoHealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "trace-demo-api"
    version: str = "1.0.0"
    uptime_seconds: int = 3600
    dependencies: DemoHealthDependency = Field(default_factory=DemoHealthDependency)


class DemoUserItem(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str
    department: str
    created_at: str


class DemoUsersResponse(BaseModel):
    total: int
    limit: int
    offset: int
    users: list[DemoUserItem]


class DemoEchoResponse(BaseModel):
    method: str
    path: str
    query_params: dict[str, str] = Field(default_factory=dict)
    headers: dict[str, str] = Field(default_factory=dict)
    body: Any | None = None
    content_type: str | None = None
    client_ip: str | None = None
    timestamp: str


class DemoDelayResponse(BaseModel):
    requested_delay_ms: int
    actual_delay_ms: float
    message: str = "Response delayed successfully."


class DemoCorsResponse(BaseModel):
    scenario: str
    allowed_origin: str
    message: str
    headers_set: dict[str, str]


class DemoAuthResponse(BaseModel):
    authenticated: bool
    user: str
    role: str
    permissions: list[str]
    token_type: str = "Bearer"


class DemoLargeItem(BaseModel):
    id: int
    guid: str
    name: str
    email: str
    company: str
    address: str
    tags: list[str]
    timestamp: str


class DemoLargeResponse(BaseModel):
    count: int
    items: list[DemoLargeItem]


class DemoErrorResponse(BaseModel):
    error: str
    code: int
    message: str
