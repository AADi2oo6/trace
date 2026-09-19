"""Tests for TRACE Request Contract and Schemas."""

import pytest
from fastapi.testclient import TestClient

from app.core.errors import ErrorCode
from app.main import app

client = TestClient(app)


def test_valid_request_minimal() -> None:
    """Verify that a minimal valid request payload returns a structured 200 response."""
    payload = {
        "method": "GET",
        "url": "https://example.com/api/v1/resource",
    }
    response = client.post("/api/requests", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is False
    assert data["status_code"] is None
    assert data["method"] == "GET"
    assert data["url"] == "https://example.com/api/v1/resource"
    assert data["message"] == "HTTP request execution is not implemented yet."
    assert data["error"]["code"] == ErrorCode.NOT_IMPLEMENTED


def test_valid_request_with_full_options() -> None:
    """Verify request with query parameters, headers, and body payload."""
    payload = {
        "method": "post",
        "url": "https://api.example.com/items",
        "headers": {"Authorization": "Bearer token", "Content-Type": "application/json"},
        "params": {"filter": "active", "page": "1"},
        "body": {"name": "Test Item", "count": 10},
    }
    response = client.post("/api/requests", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is False
    assert data["method"] == "POST"
    assert data["error"]["code"] == ErrorCode.NOT_IMPLEMENTED


@pytest.mark.parametrize(
    "method",
    ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
)
def test_all_supported_http_methods(method: str) -> None:
    """Verify that all MVP-specified HTTP methods pass validation."""
    response = client.post(
        "/api/requests",
        json={"method": method, "url": "https://example.com"},
    )
    assert response.status_code == 200
    assert response.json()["method"] == method


def test_invalid_http_method_rejected() -> None:
    """Verify that unsupported HTTP methods fail validation with HTTP 422."""
    response = client.post(
        "/api/requests",
        json={"method": "TRACE_INVALID", "url": "https://example.com"},
    )
    assert response.status_code == 422


def test_missing_url_rejected() -> None:
    """Verify that requests missing target URL fail validation with HTTP 422."""
    response = client.post("/api/requests", json={"method": "GET"})
    assert response.status_code == 422


@pytest.mark.parametrize(
    "invalid_url",
    [
        "",
        "   ",
        "ftp://example.com/file",
        "tcp://127.0.0.1:8000",
        "just_a_string",
    ],
)
def test_invalid_url_structure_rejected(invalid_url: str) -> None:
    """Verify that malformed or non-http(s) URLs fail validation with HTTP 422."""
    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": invalid_url},
    )
    assert response.status_code == 422


def test_malformed_body_types_rejected() -> None:
    """Verify that invalid header/param structures are rejected."""
    response = client.post(
        "/api/requests",
        json={
            "method": "GET",
            "url": "https://example.com",
            "headers": "invalid-string-instead-of-dict",
        },
    )
    assert response.status_code == 422


def test_extra_unknown_fields_rejected() -> None:
    """Verify that extraneous unexpected keys are rejected by strict schema."""
    response = client.post(
        "/api/requests",
        json={
            "method": "GET",
            "url": "https://example.com",
            "unsupported_key": "some_value",
        },
    )
    assert response.status_code == 422


def test_execute_alias_endpoint() -> None:
    """Verify that the /api/requests/execute alias endpoint functions identically."""
    response = client.post(
        "/api/requests/execute",
        json={"method": "GET", "url": "https://example.com"},
    )
    assert response.status_code == 200
    assert response.json()["error"]["code"] == ErrorCode.NOT_IMPLEMENTED


def test_deterministic_local_execution_no_network() -> None:
    """Verify that non-existent hosts return instantly without triggering external DNS/network."""
    response = client.post(
        "/api/requests",
        json={
            "method": "GET",
            "url": "https://this-domain-definitely-does-not-exist-at-all-12345.org",
        },
    )
    assert response.status_code == 200
    assert response.json()["error"]["code"] == ErrorCode.NOT_IMPLEMENTED
