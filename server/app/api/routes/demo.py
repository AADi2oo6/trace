"""TRACE Demo API Router — Endpoints for testing HTTP methods, status codes, CORS, delays, headers, and payloads."""

import asyncio
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Query, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse

from app.schemas.demo import (
    DemoAuthResponse,
    DemoCatalogueResponse,
    DemoCorsResponse,
    DemoDelayResponse,
    DemoEchoResponse,
    DemoErrorResponse,
    DemoHealthResponse,
    DemoHelloResponse,
    DemoLargeResponse,
    DemoUserItem,
    DemoUsersResponse,
)
from app.services.demo_service import demo_service, redact_sensitive_headers

router = APIRouter()


@router.get("", response_model=DemoCatalogueResponse, summary="Demo API Catalogue")
def get_catalogue() -> DemoCatalogueResponse:
    """Return the authoritative catalogue of all TRACE Demo API endpoints and documentation."""
    return demo_service.get_catalogue()


@router.get("/hello", response_model=DemoHelloResponse, summary="Hello World")
def get_hello() -> DemoHelloResponse:
    """Basic JSON greeting endpoint with server timestamp."""
    return DemoHelloResponse(
        message="Hello from TRACE Demo API!",
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/health", response_model=DemoHealthResponse, summary="Health Check")
def get_health() -> DemoHealthResponse:
    """Simulated service health reporting subcomponent health."""
    return DemoHealthResponse(
        status="healthy",
        service="trace-demo-api",
        version="1.0.0",
        uptime_seconds=3600,
    )


@router.get("/users", response_model=DemoUsersResponse, summary="List Users")
def list_users(
    limit: int = Query(default=10, ge=1, le=50, description="Items per page"),
    offset: int = Query(default=0, ge=0, description="Starting index"),
    search: str | None = Query(default=None, description="Filter by name, email or department"),
) -> DemoUsersResponse:
    """Get paginated sample users with optional search."""
    return demo_service.get_users(limit=limit, offset=offset, search=search)


@router.get("/users/{user_id}", response_model=DemoUserItem, summary="Get User by ID")
def get_user(user_id: int) -> DemoUserItem:
    """Get user by ID. Returns 404 if user not found."""
    user = demo_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found.")
    return user


@router.post("/echo", response_model=DemoEchoResponse, summary="Echo Request (POST)")
async def echo_post(request: Request) -> DemoEchoResponse:
    """Echo back request headers, query parameters, and body with sensitive data redacted."""
    raw_headers = dict(request.headers)
    sanitized_headers = redact_sensitive_headers(raw_headers)

    body: Any | None = None
    try:
        body = await request.json()
    except Exception:
        raw_body = await request.body()
        if raw_body:
            body = raw_body.decode("utf-8", errors="replace")

    return DemoEchoResponse(
        method="POST",
        path=request.url.path,
        query_params=dict(request.query_params),
        headers=sanitized_headers,
        body=body,
        content_type=request.headers.get("content-type"),
        client_ip=request.client.host if request.client else None,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/echo", response_model=DemoEchoResponse, summary="Echo Request (GET)")
def echo_get(request: Request) -> DemoEchoResponse:
    """Echo back query parameters and sanitized request headers."""
    raw_headers = dict(request.headers)
    sanitized_headers = redact_sensitive_headers(raw_headers)

    return DemoEchoResponse(
        method="GET",
        path=request.url.path,
        query_params=dict(request.query_params),
        headers=sanitized_headers,
        body=None,
        content_type=None,
        client_ip=request.client.host if request.client else None,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


SUPPORTED_STATUS_CODES = {200, 201, 204, 301, 302, 400, 401, 403, 404, 418, 429, 500, 502, 503}


@router.get("/status/{code}", summary="Status Code Simulator")
def get_status_code(code: int) -> Response:
    """Return the specified HTTP status code for testing error handling and status inspection."""
    if code not in SUPPORTED_STATUS_CODES:
        raise HTTPException(
            status_code=400,
            detail=f"Status code {code} is not supported. Supported codes: {sorted(SUPPORTED_STATUS_CODES)}",
        )

    # 204 No Content MUST NOT include a response body or Content-Type (RFC 9110)
    if code == 204:
        return Response(status_code=204)

    # 301 / 302 safe redirect
    if code in (301, 302):
        return RedirectResponse(url="/demo/hello", status_code=code)

    # 401 with WWW-Authenticate header
    if code == 401:
        return JSONResponse(
            status_code=401,
            content={
                "error": "Unauthorized",
                "code": 401,
                "message": "Authentication required. Provide 'Bearer demo-token-read' or 'Bearer demo-token-admin'.",
            },
            headers={"WWW-Authenticate": 'Bearer realm="TRACE Demo API"'},
        )

    # 429 with Retry-After header
    if code == 429:
        return JSONResponse(
            status_code=429,
            content={
                "error": "Too Many Requests",
                "code": 429,
                "message": "Rate limit exceeded. Please retry after the indicated interval.",
                "retry_after_seconds": 30,
            },
            headers={"Retry-After": "30"},
        )

    # 418 I'm a Teapot
    if code == 418:
        return JSONResponse(
            status_code=418,
            content={
                "error": "I'm a teapot",
                "code": 418,
                "message": "The HTCPCP server refuses to brew coffee with a teapot (RFC 2324).",
            },
        )

    status_descriptions = {
        200: ("OK", "Standard successful HTTP response."),
        201: ("Created", "Resource has been successfully created."),
        400: ("Bad Request", "The server cannot process the request due to client error."),
        403: ("Forbidden", "The server understands the request but refuses to authorize it."),
        404: ("Not Found", "The requested resource could not be found."),
        500: ("Internal Server Error", "Generic server-side error simulation."),
        502: ("Bad Gateway", "Simulated gateway error receiving invalid response upstream."),
        503: ("Service Unavailable", "Simulated temporary server overload or maintenance."),
    }

    title, desc = status_descriptions.get(code, ("Status Code", f"Status code {code}"))
    return JSONResponse(
        status_code=code,
        content={
            "status": code,
            "title": title,
            "description": desc,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@router.get("/delay/{milliseconds}", response_model=DemoDelayResponse, summary="Response Delay Simulator")
async def get_delayed_response(milliseconds: int) -> DemoDelayResponse:
    """Introduce server-side delay using asyncio.sleep (bounded between 0 and 5000 ms)."""
    if milliseconds < 0 or milliseconds > 5000:
        raise HTTPException(
            status_code=400,
            detail=f"Delay must be between 0 and 5000 milliseconds. Received {milliseconds} ms.",
        )

    start = time.perf_counter()
    if milliseconds > 0:
        await asyncio.sleep(milliseconds / 1000.0)
    actual_ms = round((time.perf_counter() - start) * 1000, 2)

    return DemoDelayResponse(
        requested_delay_ms=milliseconds,
        actual_delay_ms=actual_ms,
        message=f"Response delayed by {actual_ms} ms (requested {milliseconds} ms).",
    )


@router.get("/headers", summary="Custom Headers & Caching Demonstration")
def get_headers(request: Request) -> JSONResponse:
    """Return informative response headers along with documentation of caching headers."""
    raw_headers = dict(request.headers)
    sanitized_request_headers = redact_sensitive_headers(raw_headers)

    response_headers = {
        "X-Trace-Demo-Header": "trace-v1-verified",
        "X-Custom-Timestamp": datetime.now(timezone.utc).isoformat(),
        "Cache-Control": "public, max-age=3600, must-revalidate",
        "ETag": 'W/"trace-demo-etag-12345"',
    }

    content = {
        "message": "Custom headers and caching demonstration.",
        "headers_applied": {
            "X-Trace-Demo-Header": "Custom debugging header injected by demo service.",
            "Cache-Control": "Directs browser/intermediate caches to store response up to 3600 seconds.",
            "ETag": "Weak entity tag for conditional HTTP requests (If-None-Match).",
        },
        "received_request_headers": sanitized_request_headers,
    }

    return JSONResponse(content=content, headers=response_headers)


@router.get("/cors", summary="CORS Scenario Demonstration")
def get_cors(
    scenario: str = Query(
        default="wildcard",
        description="CORS scenario: wildcard, restricted, credentials, preflight",
    ),
) -> JSONResponse:
    """Demonstrate various CORS header responses."""
    headers: dict[str, str] = {}
    allowed_origin = "*"

    if scenario == "wildcard":
        allowed_origin = "*"
        headers["Access-Control-Allow-Origin"] = "*"
    elif scenario == "restricted":
        allowed_origin = "https://app.example.com"
        headers["Access-Control-Allow-Origin"] = "https://app.example.com"
    elif scenario == "credentials":
        allowed_origin = "http://localhost:5173"
        headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        headers["Access-Control-Allow-Credentials"] = "true"
    elif scenario == "preflight":
        allowed_origin = "*"
        headers["Access-Control-Allow-Origin"] = "*"
        headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, X-Trace-Custom"
        headers["Access-Control-Max-Age"] = "86400"
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown CORS scenario '{scenario}'. Allowed: wildcard, restricted, credentials, preflight",
        )

    content = {
        "scenario": scenario,
        "allowed_origin": allowed_origin,
        "message": f"CORS headers configured for scenario '{scenario}'.",
        "headers_set": headers,
    }

    return JSONResponse(content=content, headers=headers)


@router.options("/cors", summary="CORS Preflight (OPTIONS)")
def options_cors(
    request: Request,
    scenario: str = Query(default="preflight", description="CORS scenario"),
) -> Response:
    """Handle CORS preflight requests with standard preflight headers."""
    headers: dict[str, str] = {
        "Allow": "GET, OPTIONS",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Trace-Custom",
        "Access-Control-Max-Age": "86400",
    }

    if scenario == "credentials":
        origin = request.headers.get("origin") or "http://localhost:5173"
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    elif scenario == "restricted":
        headers["Access-Control-Allow-Origin"] = "https://app.example.com"
    else:
        headers["Access-Control-Allow-Origin"] = "*"

    return Response(status_code=204, headers=headers)


@router.get("/auth", response_model=DemoAuthResponse, summary="Authentication Demonstration")
def get_auth(
    authorization: str | None = Header(default=None),
    require: str | None = Query(default=None, description="Set to 'admin' to require administrator privileges"),
) -> DemoAuthResponse:
    """Demonstrate HTTP Bearer token authentication."""
    if not authorization:
        return JSONResponse(
            status_code=401,
            content={
                "detail": "Authorization header missing. Provide 'Bearer demo-token-read' or 'Bearer demo-token-admin'."
            },
            headers={"WWW-Authenticate": 'Bearer realm="TRACE Demo API"'},
        )

    parts = authorization.strip().split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid authorization scheme. Use 'Bearer <token>'."},
            headers={"WWW-Authenticate": 'Bearer realm="TRACE Demo API"'},
        )

    token = parts[1].strip()

    if token == "demo-token-read":
        if require == "admin":
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions. Administrator role required.",
            )
        return DemoAuthResponse(
            authenticated=True,
            user="demo-reader",
            role="viewer",
            permissions=["read"],
        )

    if token == "demo-token-admin":
        return DemoAuthResponse(
            authenticated=True,
            user="demo-admin",
            role="administrator",
            permissions=["read", "write", "delete"],
        )

    return JSONResponse(
        status_code=401,
        content={"detail": "Invalid authorization token. Use 'demo-token-read' or 'demo-token-admin'."},
        headers={"WWW-Authenticate": 'Bearer realm="TRACE Demo API"'},
    )


@router.get("/large", response_model=DemoLargeResponse, summary="Large JSON Payload")
def get_large(
    size: int = Query(default=50, ge=1, le=500, description="Number of items to generate (1 to 500)"),
) -> DemoLargeResponse:
    """Generate a large deterministic JSON payload to evaluate response inspection and memory bounding."""
    return demo_service.generate_large_payload(size=size)


@router.get("/error", response_model=DemoErrorResponse, summary="Controlled Error Simulation")
def get_error(
    code: int = Query(default=500, description="Error status code (500, 502, 503)"),
) -> JSONResponse:
    """Simulate internal server or gateway errors safely without leaking internal secrets or paths."""
    if code not in (500, 502, 503):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported error code {code}. Allowed: 500, 502, 503.",
        )

    messages = {
        500: "Simulated internal server error. No internal stack traces are leaked.",
        502: "Simulated bad gateway error from mock upstream dependency.",
        503: "Simulated service unavailable error due to maintenance.",
    }

    return JSONResponse(
        status_code=code,
        content={
            "error": "Simulated Upstream Error",
            "code": code,
            "message": messages.get(code, "Simulated server failure."),
        },
    )
