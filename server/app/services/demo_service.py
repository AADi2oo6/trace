"""TRACE Demo Service — Controlled endpoints logic, static mock datasets, and endpoint catalogue."""

import hashlib
from datetime import datetime, timezone
from typing import Any

from app.schemas.demo import (
    DemoCatalogueResponse,
    DemoEndpointCatalogueItem,
    DemoLargeItem,
    DemoLargeResponse,
    DemoQueryParamDef,
    DemoUserItem,
    DemoUsersResponse,
)

# Standard list of sensitive headers to sanitize in echo / header inspection
SENSITIVE_HEADER_KEYS = {
    "authorization",
    "cookie",
    "set-cookie",
    "proxy-authorization",
    "x-api-key",
    "trace-auth",
    "token",
}

# Deterministic mock users
SAMPLE_USERS: list[dict[str, Any]] = [
    {
        "id": 1,
        "name": "Ada Lovelace",
        "email": "ada.lovelace@trace.local",
        "role": "administrator",
        "status": "active",
        "department": "Engineering",
        "created_at": "2026-01-15T09:00:00Z",
    },
    {
        "id": 2,
        "name": "Alan Turing",
        "email": "alan.turing@trace.local",
        "role": "administrator",
        "status": "active",
        "department": "Security",
        "created_at": "2026-01-16T10:30:00Z",
    },
    {
        "id": 3,
        "name": "Grace Hopper",
        "email": "grace.hopper@trace.local",
        "role": "developer",
        "status": "active",
        "department": "Engineering",
        "created_at": "2026-02-01T14:15:00Z",
    },
    {
        "id": 4,
        "name": "Claude Shannon",
        "email": "claude.shannon@trace.local",
        "role": "developer",
        "status": "active",
        "department": "Information Theory",
        "created_at": "2026-02-10T11:00:00Z",
    },
    {
        "id": 5,
        "name": "Margaret Hamilton",
        "email": "margaret.hamilton@trace.local",
        "role": "developer",
        "status": "active",
        "department": "Systems Architecture",
        "created_at": "2026-02-20T08:45:00Z",
    },
    {
        "id": 6,
        "name": "Donald Knuth",
        "email": "donald.knuth@trace.local",
        "role": "analyst",
        "status": "active",
        "department": "Algorithms",
        "created_at": "2026-03-01T16:20:00Z",
    },
    {
        "id": 7,
        "name": "Katherine Johnson",
        "email": "katherine.johnson@trace.local",
        "role": "analyst",
        "status": "active",
        "department": "Calculations",
        "created_at": "2026-03-05T12:00:00Z",
    },
    {
        "id": 8,
        "name": "Tim Berners-Lee",
        "email": "tim.berners-lee@trace.local",
        "role": "developer",
        "status": "active",
        "department": "Web Protocols",
        "created_at": "2026-03-12T09:30:00Z",
    },
    {
        "id": 9,
        "name": "Barbara Liskov",
        "email": "barbara.liskov@trace.local",
        "role": "developer",
        "status": "active",
        "department": "Type Systems",
        "created_at": "2026-03-18T15:10:00Z",
    },
    {
        "id": 10,
        "name": "Dennis Ritchie",
        "email": "dennis.ritchie@trace.local",
        "role": "devops",
        "status": "active",
        "department": "Operating Systems",
        "created_at": "2026-03-25T13:40:00Z",
    },
    {
        "id": 11,
        "name": "Radia Perlman",
        "email": "radia.perlman@trace.local",
        "role": "devops",
        "status": "active",
        "department": "Networking",
        "created_at": "2026-04-02T10:15:00Z",
    },
    {
        "id": 12,
        "name": "Ken Thompson",
        "email": "ken.thompson@trace.local",
        "role": "viewer",
        "status": "inactive",
        "department": "Compilers",
        "created_at": "2026-04-10T17:00:00Z",
    },
]


def redact_sensitive_headers(headers: dict[str, str]) -> dict[str, str]:
    """Sanitize sensitive headers while preserving metadata keys."""
    sanitized: dict[str, str] = {}
    for key, value in headers.items():
        key_lower = key.lower()
        if key_lower in SENSITIVE_HEADER_KEYS or any(s in key_lower for s in ("secret", "token", "password")):
            sanitized[key] = "[REDACTED]"
        else:
            sanitized[key] = value
    return sanitized


class DemoService:
    """Service providing business logic and catalogue metadata for the TRACE Demo API."""

    def get_users(self, limit: int = 10, offset: int = 0, search: str | None = None) -> DemoUsersResponse:
        """Filter and paginate sample users."""
        filtered = SAMPLE_USERS
        if search:
            q = search.lower().strip()
            filtered = [
                u
                for u in filtered
                if q in u["name"].lower() or q in u["email"].lower() or q in u["role"].lower() or q in u["department"].lower()
            ]

        total = len(filtered)
        paginated = filtered[offset : offset + limit]
        user_items = [DemoUserItem(**u) for u in paginated]

        return DemoUsersResponse(
            total=total,
            limit=limit,
            offset=offset,
            users=user_items,
        )

    def get_user_by_id(self, user_id: int) -> DemoUserItem | None:
        """Find user by ID."""
        for u in SAMPLE_USERS:
            if u["id"] == user_id:
                return DemoUserItem(**u)
        return None

    def generate_large_payload(self, size: int = 50) -> DemoLargeResponse:
        """Generate deterministic bounded dataset for performance and size testing."""
        bounded_size = max(1, min(size, 500))
        items: list[DemoLargeItem] = []

        companies = ["Acme Corp", "Globex", "Initech", "Umbrella Co", "Hooli", "Soylent", "Massive Dynamic", "Stark Industries"]
        tags_pool = ["production", "urgent", "internal", "verified", "demo", "encrypted", "audit-ready", "trace-node"]

        for i in range(1, bounded_size + 1):
            guid_hash = hashlib.sha256(f"trace-large-{i}".encode("utf-8")).hexdigest()[:16]
            formatted_guid = f"{guid_hash[:8]}-{guid_hash[8:12]}-{guid_hash[12:16]}"
            company = companies[i % len(companies)]
            tag1 = tags_pool[i % len(tags_pool)]
            tag2 = tags_pool[(i * 3) % len(tags_pool)]

            items.append(
                DemoLargeItem(
                    id=i,
                    guid=formatted_guid,
                    name=f"Record Item #{i:04d}",
                    email=f"item{i:04d}@{company.lower().replace(' ', '')}.example",
                    company=company,
                    address=f"{100 + i} Innovation Way, Suite {i * 2}, Tech Park, CA",
                    tags=[tag1, tag2],
                    timestamp=datetime.now(timezone.utc).isoformat(),
                )
            )

        return DemoLargeResponse(count=len(items), items=items)

    def get_catalogue(self) -> DemoCatalogueResponse:
        """Authoritative catalogue of all TRACE Demo API endpoints with categories, parameters, and documentation."""
        categories = [
            "Basics",
            "Request Inspection",
            "Status Codes",
            "Performance",
            "Headers & Caching",
            "CORS & Preflight",
            "Authentication",
            "Payloads & Errors",
        ]

        endpoints: list[DemoEndpointCatalogueItem] = [
            # Basics
            DemoEndpointCatalogueItem(
                id="demo-hello",
                name="Hello World",
                category="Basics",
                method="GET",
                path="/demo/hello",
                description="Simple friendly endpoint returning JSON greeting and server timestamp.",
                expected_status=200,
                query_params=[],
                headers={},
                body=None,
                sample_response={"message": "Hello from TRACE Demo API!", "status": "ok", "timestamp": "2026-11-16T12:00:00Z"},
                tags=["intro", "json"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-health",
                name="Health Check",
                category="Basics",
                method="GET",
                path="/demo/health",
                description="Simulated microservice health check reporting service status, uptime, and sub-components.",
                expected_status=200,
                query_params=[],
                headers={},
                body=None,
                sample_response={
                    "status": "healthy",
                    "service": "trace-demo-api",
                    "version": "1.0.0",
                    "uptime_seconds": 3600,
                    "dependencies": {"database": "healthy", "cache": "healthy", "worker_pool": "idle"},
                },
                tags=["monitoring", "health"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-users-list",
                name="List Users (Paginated)",
                category="Basics",
                method="GET",
                path="/demo/users",
                description="Demonstrates query parameters for pagination (limit, offset) and text search filter.",
                expected_status=200,
                query_params=[
                    DemoQueryParamDef(name="limit", type="integer", required=False, default=10, description="Items per page (max 50)"),
                    DemoQueryParamDef(name="offset", type="integer", required=False, default=0, description="Starting record index"),
                    DemoQueryParamDef(name="search", type="string", required=False, default=None, description="Search term for name, email or department"),
                ],
                headers={},
                body=None,
                sample_response={
                    "total": 12,
                    "limit": 10,
                    "offset": 0,
                    "users": [SAMPLE_USERS[0], SAMPLE_USERS[1]],
                },
                tags=["pagination", "query-params"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-users-detail",
                name="Get User by ID",
                category="Basics",
                method="GET",
                path="/demo/users/1",
                description="Fetches a single user record. Returns 200 OK if found or genuine 404 Not Found if id > 12.",
                expected_status=200,
                query_params=[],
                headers={},
                body=None,
                sample_response=SAMPLE_USERS[0],
                tags=["rest", "path-param"],
            ),

            # Request Inspection
            DemoEndpointCatalogueItem(
                id="demo-echo-post",
                name="Echo Request (POST)",
                category="Request Inspection",
                method="POST",
                path="/demo/echo",
                description="Echoes back the HTTP method, headers, query parameters, and request body sent by the client. Sensitive headers are redacted.",
                expected_status=200,
                query_params=[
                    DemoQueryParamDef(name="tag", type="string", required=False, default="trace-test", description="Optional query parameter to test query string parsing"),
                ],
                headers={"Content-Type": "application/json", "X-Trace-Custom": "echo-test"},
                body={"event": "ping", "data": {"message": "Testing TRACE API Inspector", "count": 42}},
                sample_response={
                    "method": "POST",
                    "path": "/demo/echo",
                    "query_params": {"tag": "trace-test"},
                    "headers": {"content-type": "application/json", "x-trace-custom": "echo-test"},
                    "body": {"event": "ping", "data": {"message": "Testing TRACE API Inspector", "count": 42}},
                    "timestamp": "2026-11-16T12:00:00Z",
                },
                tags=["echo", "inspection", "post"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-echo-get",
                name="Echo Request (GET)",
                category="Request Inspection",
                method="GET",
                path="/demo/echo",
                description="Echoes back the HTTP method, query parameters, and sanitized request headers.",
                expected_status=200,
                query_params=[
                    DemoQueryParamDef(name="session_id", type="string", required=False, default="trace-session-101", description="Sample session identifier"),
                ],
                headers={"X-Client-Version": "1.0.0"},
                body=None,
                sample_response={
                    "method": "GET",
                    "path": "/demo/echo",
                    "query_params": {"session_id": "trace-session-101"},
                    "headers": {"x-client-version": "1.0.0"},
                    "timestamp": "2026-11-16T12:00:00Z",
                },
                tags=["echo", "inspection", "get"],
            ),

            # Status Codes
            DemoEndpointCatalogueItem(
                id="demo-status-200",
                name="Status 200 OK",
                category="Status Codes",
                method="GET",
                path="/demo/status/200",
                description="Standard success response.",
                expected_status=200,
                tags=["2xx", "success"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-status-201",
                name="Status 201 Created",
                category="Status Codes",
                method="GET",
                path="/demo/status/201",
                description="Resource creation response with sample resource descriptor.",
                expected_status=201,
                tags=["2xx", "created"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-status-204",
                name="Status 204 No Content",
                category="Status Codes",
                method="GET",
                path="/demo/status/204",
                description="RFC 9110 compliant empty response. Returns HTTP 204 with NO body and no content headers.",
                expected_status=204,
                tags=["2xx", "no-content"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-status-302",
                name="Status 302 Found (Redirect)",
                category="Status Codes",
                method="GET",
                path="/demo/status/302",
                description="Temporary redirect providing Location header pointing to /demo/hello.",
                expected_status=302,
                tags=["3xx", "redirect"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-status-400",
                name="Status 400 Bad Request",
                category="Status Codes",
                method="GET",
                path="/demo/status/400",
                description="Client error indicating invalid request parameters or payload.",
                expected_status=400,
                tags=["4xx", "client-error"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-status-401",
                name="Status 401 Unauthorized",
                category="Status Codes",
                method="GET",
                path="/demo/status/401",
                description="Authentication required response with WWW-Authenticate header.",
                expected_status=401,
                tags=["4xx", "auth"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-status-403",
                name="Status 403 Forbidden",
                category="Status Codes",
                method="GET",
                path="/demo/status/403",
                description="Access denied response indicating insufficient permissions.",
                expected_status=403,
                tags=["4xx", "forbidden"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-status-404",
                name="Status 404 Not Found",
                category="Status Codes",
                method="GET",
                path="/demo/status/404",
                description="Standard endpoint indicating target resource does not exist.",
                expected_status=404,
                tags=["4xx", "not-found"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-status-418",
                name="Status 418 I'm a Teapot",
                category="Status Codes",
                method="GET",
                path="/demo/status/418",
                description="HTCPCP RFC 2324 reference demonstrating non-standard HTTP status codes.",
                expected_status=418,
                tags=["4xx", "teapot"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-status-429",
                name="Status 429 Too Many Requests",
                category="Status Codes",
                method="GET",
                path="/demo/status/429",
                description="Rate limit response including Retry-After header.",
                expected_status=429,
                tags=["4xx", "rate-limit"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-status-500",
                name="Status 500 Internal Server Error",
                category="Status Codes",
                method="GET",
                path="/demo/status/500",
                description="Simulated server error without leaking stack traces or internal secrets.",
                expected_status=500,
                tags=["5xx", "server-error"],
            ),

            # Performance
            DemoEndpointCatalogueItem(
                id="demo-delay-500",
                name="Response Delay (500 ms)",
                category="Performance",
                method="GET",
                path="/demo/delay/500",
                description="Introduces a 500ms server-side latency using asyncio.sleep to test timing diagrams.",
                expected_status=200,
                tags=["latency", "timing"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-delay-1500",
                name="Response Delay (1500 ms)",
                category="Performance",
                method="GET",
                path="/demo/delay/1500",
                description="Introduces a 1.5s delay to test longer response durations and timeout boundaries.",
                expected_status=200,
                tags=["latency", "timeout"],
            ),

            # Headers & Caching
            DemoEndpointCatalogueItem(
                id="demo-headers",
                name="Custom Headers & Caching",
                category="Headers & Caching",
                method="GET",
                path="/demo/headers",
                description="Returns custom response headers (X-Trace-Demo-Header, Cache-Control, ETag) with explanations.",
                expected_status=200,
                headers={"X-Client-Device": "browser-desktop"},
                tags=["headers", "cache", "etag"],
            ),

            # CORS & Preflight
            DemoEndpointCatalogueItem(
                id="demo-cors-wildcard",
                name="CORS (Wildcard Origin)",
                category="CORS & Preflight",
                method="GET",
                path="/demo/cors",
                description="Simulates open CORS policy with Access-Control-Allow-Origin: *.",
                expected_status=200,
                query_params=[
                    DemoQueryParamDef(
                        name="scenario",
                        type="string",
                        required=False,
                        default="wildcard",
                        description="CORS scenario: wildcard, restricted, credentials, preflight",
                        options=["wildcard", "restricted", "credentials", "preflight"],
                    )
                ],
                tags=["cors", "wildcard"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-cors-options",
                name="CORS Preflight (OPTIONS)",
                category="CORS & Preflight",
                method="OPTIONS",
                path="/demo/cors",
                description="Answers CORS preflight with Allow, Access-Control-Allow-Methods, and Access-Control-Allow-Headers.",
                expected_status=204,
                headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
                tags=["cors", "preflight", "options"],
            ),

            # Authentication
            DemoEndpointCatalogueItem(
                id="demo-auth-reader",
                name="Authenticated (Reader Role)",
                category="Authentication",
                method="GET",
                path="/demo/auth",
                description="Pass Bearer demo-token-read in the Authorization header to simulate viewer access.",
                expected_status=200,
                headers={"Authorization": "Bearer demo-token-read"},
                tags=["auth", "bearer", "role-reader"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-auth-admin",
                name="Authenticated (Admin Role)",
                category="Authentication",
                method="GET",
                path="/demo/auth",
                description="Pass Bearer demo-token-admin to access elevated administrator permissions.",
                expected_status=200,
                query_params=[
                    DemoQueryParamDef(name="require", type="string", required=False, default=None, description="Set to 'admin' to enforce admin check"),
                ],
                headers={"Authorization": "Bearer demo-token-admin"},
                tags=["auth", "bearer", "role-admin"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-auth-unauthorized",
                name="Auth Required (Missing Header)",
                category="Authentication",
                method="GET",
                path="/demo/auth",
                description="Calls auth endpoint without token to test 401 Unauthorized handling.",
                expected_status=401,
                headers={},
                tags=["auth", "401"],
            ),

            # Payloads & Errors
            DemoEndpointCatalogueItem(
                id="demo-large-50",
                name="Large JSON Payload (50 Records)",
                category="Payloads & Errors",
                method="GET",
                path="/demo/large",
                description="Returns a structured dataset of 50 records to evaluate response inspector rendering and memory bounding.",
                expected_status=200,
                query_params=[
                    DemoQueryParamDef(name="size", type="integer", required=False, default=50, description="Number of records to generate (1 to 500)"),
                ],
                tags=["payload", "json", "size"],
            ),
            DemoEndpointCatalogueItem(
                id="demo-error-500",
                name="Server Error Simulation",
                category="Payloads & Errors",
                method="GET",
                path="/demo/error",
                description="Simulates internal error (500, 502, or 503) without exposing sensitive stack traces.",
                expected_status=500,
                query_params=[
                    DemoQueryParamDef(name="code", type="integer", required=False, default=500, description="Error status code (500, 502, 503)", options=["500", "502", "503"]),
                ],
                tags=["error", "500", "simulation"],
            ),
        ]

        return DemoCatalogueResponse(
            endpoints=endpoints,
            categories=categories,
            total=len(endpoints),
        )


demo_service = DemoService()
