"""Tests for FastAPI CORS Middleware Configuration (Browser-to-Backend Preflight)."""

from typing import Any
import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.request_service import request_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_service_transport() -> Any:
    """Ensure transport is reset after each test."""
    yield
    request_service.transport = None


def test_cors_preflight_localhost_origin() -> None:
    """Verify that OPTIONS preflight from http://localhost:5173 succeeds with 200 and proper headers."""
    response = client.options(
        "/api/requests",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "POST" in response.headers.get("access-control-allow-methods", "")
    assert "content-type" in response.headers.get("access-control-allow-headers", "").lower()


def test_cors_preflight_127_0_0_1_origin() -> None:
    """Verify that OPTIONS preflight from http://127.0.0.1:5173 succeeds with 200 and proper headers."""
    response = client.options(
        "/api/requests",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://127.0.0.1:5173"
    assert "POST" in response.headers.get("access-control-allow-methods", "")


def test_cors_preflight_disallowed_origin() -> None:
    """Verify that an unauthorized origin is rejected and receives no permissive CORS headers."""
    response = client.options(
        "/api/requests",
        headers={
            "Origin": "http://malicious.example",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    # Starlette CORSMiddleware either rejects preflight with 400 or omits allow-origin header
    assert response.headers.get("access-control-allow-origin") != "http://malicious.example"


def test_cors_actual_post_allowed_origin() -> None:
    """Verify that actual POST request with allowed Origin header includes Access-Control-Allow-Origin."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code=200,
            headers={"Content-Type": "application/json"},
            content=b'{"items": []}',
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        headers={
            "Origin": "http://localhost:5173",
            "Content-Type": "application/json",
        },
        json={"method": "GET", "url": "https://api.mock-api.org/todos"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert response.json()["success"] is True


def test_cors_actual_post_disallowed_origin() -> None:
    """Verify that actual POST request with disallowed Origin header does not get CORS permission."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code=200,
            headers={"Content-Type": "application/json"},
            content=b'{"items": []}',
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        headers={
            "Origin": "http://malicious.example",
            "Content-Type": "application/json",
        },
        json={"method": "GET", "url": "https://api.mock-api.org/todos"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") is None


def test_user_options_request_distinct_from_preflight() -> None:
    """Verify user-requested OPTIONS method sent via POST /api/requests is handled by outbound engine."""

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "OPTIONS"
        return httpx.Response(
            status_code=200,
            headers={
                "Allow": "GET, POST, OPTIONS",
                "Access-Control-Allow-Origin": "*",
            },
            content=b"",
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        headers={"Origin": "http://localhost:5173"},
        json={"method": "OPTIONS", "url": "https://api.mock-api.org/resource"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    data = response.json()
    assert data["success"] is True
    assert data["method"] == "OPTIONS"
    assert data["options_analysis"] is not None
    assert "GET" in data["options_analysis"]["allowed_methods"]
