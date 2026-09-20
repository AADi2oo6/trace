"""Tests for Step 7: OPTIONS Inspector."""

from typing import Any
import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.options_inspector import options_inspector
from app.services.request_service import request_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_service_transport() -> Any:
    """Ensure transport is reset after each test."""
    yield
    request_service.transport = None


# ============================================================================
# Unit Tests for OptionsInspector Service
# ============================================================================


def test_basic_allow_header() -> None:
    """Verify parsing and normalization of standard Allow header."""
    headers = {"Allow": "GET, POST, PUT, DELETE, OPTIONS"}
    result = options_inspector.inspect("OPTIONS", headers)

    assert result is not None
    assert result.is_options_request is True
    assert result.has_allow_header is True
    assert result.allowed_methods == ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    assert any("advertises allowed methods through the Allow header" in obs for obs in result.observations)


def test_missing_allow_header() -> None:
    """Verify handling when Allow header is absent does not cause an error."""
    headers = {"Content-Type": "application/json"}
    result = options_inspector.inspect("OPTIONS", headers)

    assert result is not None
    assert result.is_options_request is True
    assert result.has_allow_header is False
    assert result.allowed_methods == []
    assert any("did not include an Allow header" in obs for obs in result.observations)


def test_allow_case_and_whitespace_insensitivity() -> None:
    """Verify case normalization and trimming of methods in Allow header."""
    headers1 = {"allow": "get, post, patch"}
    result1 = options_inspector.inspect("OPTIONS", headers1)
    assert result1 is not None
    assert result1.allowed_methods == ["GET", "POST", "PATCH"]

    headers2 = {"ALLOW": "  GET ,  POST ,   PUT  "}
    result2 = options_inspector.inspect("options", headers2)
    assert result2 is not None
    assert result2.allowed_methods == ["GET", "POST", "PUT"]


def test_duplicate_methods_in_allow() -> None:
    """Verify duplicate methods in Allow header are deduplicated while preserving order."""
    headers = {"Allow": "GET, POST, GET, PUT, POST, DELETE"}
    result = options_inspector.inspect("OPTIONS", headers)

    assert result is not None
    assert result.allowed_methods == ["GET", "POST", "PUT", "DELETE"]


def test_empty_allow_header() -> None:
    """Verify empty or whitespace-only Allow header behaves gracefully."""
    headers = {"Allow": "   "}
    result = options_inspector.inspect("OPTIONS", headers)

    assert result is not None
    assert result.has_allow_header is True
    assert result.allowed_methods == []
    assert any("did not specify any methods" in obs for obs in result.observations)


def test_cors_methods_extraction() -> None:
    """Verify Access-Control-Allow-Methods extraction and normalization."""
    headers = {
        "Access-Control-Allow-Methods": "get, post, put, delete, patch",
    }
    result = options_inspector.inspect("OPTIONS", headers)

    assert result is not None
    assert result.cors is not None
    assert result.cors.allow_methods == ["GET", "POST", "PUT", "DELETE", "PATCH"]


def test_cors_headers_extraction() -> None:
    """Verify Access-Control-Allow-Headers extraction preserving casing."""
    headers = {
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Custom-Header",
    }
    result = options_inspector.inspect("OPTIONS", headers)

    assert result is not None
    assert result.cors is not None
    assert result.cors.allow_headers == ["Content-Type", "Authorization", "X-Custom-Header"]


def test_cors_origin_credentials_and_max_age() -> None:
    """Verify full suite of CORS response headers parsed into typed values."""
    headers = {
        "Access-Control-Allow-Origin": "https://trace.dev",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "600",
        "Access-Control-Expose-Headers": "X-Request-Id, Content-Length",
    }
    result = options_inspector.inspect("OPTIONS", headers)

    assert result is not None
    assert result.cors is not None
    assert result.cors.allow_origin == "https://trace.dev"
    assert result.cors.allow_credentials is True
    assert result.cors.max_age == 600
    assert result.cors.expose_headers == ["X-Request-Id", "Content-Length"]
    assert any("Access-Control-Allow-Origin is set to 'https://trace.dev'" in obs for obs in result.observations)
    assert any("Access-Control-Allow-Credentials is set to true" in obs for obs in result.observations)
    assert any("preflight caching for 600 seconds" in obs for obs in result.observations)


def test_options_without_cors() -> None:
    """Verify standard OPTIONS response with Allow but no CORS headers works cleanly."""
    headers = {
        "Allow": "GET, HEAD, OPTIONS",
        "Content-Type": "text/plain",
    }
    result = options_inspector.inspect("OPTIONS", headers)

    assert result is not None
    assert result.allowed_methods == ["GET", "HEAD", "OPTIONS"]
    assert result.cors is None
    assert any("No CORS-related headers were present in the response." in obs for obs in result.observations)


def test_distinguish_allow_from_cors_methods() -> None:
    """Verify Allow and Access-Control-Allow-Methods are kept strictly separate."""
    headers = {
        "Allow": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Methods": "GET, POST",
    }
    result = options_inspector.inspect("OPTIONS", headers)

    assert result is not None
    assert result.allowed_methods == ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    assert result.cors is not None
    assert result.cors.allow_methods == ["GET", "POST"]
    assert result.allowed_methods != result.cors.allow_methods


def test_non_options_method_returns_none() -> None:
    """Verify inspector returns None when method is not OPTIONS."""
    headers = {
        "Allow": "GET, POST",
        "Access-Control-Allow-Methods": "GET, POST",
    }
    assert options_inspector.inspect("GET", headers) is None
    assert options_inspector.inspect("POST", headers) is None
    assert options_inspector.inspect("DELETE", headers) is None
    assert options_inspector.inspect("HEAD", headers) is None


def test_malformed_cors_values_handled_gracefully() -> None:
    """Verify malformed max_age or credentials do not crash parsing."""
    headers = {
        "Access-Control-Allow-Origin": "   ",
        "Access-Control-Allow-Credentials": "not-a-bool",
        "Access-Control-Max-Age": "invalid-seconds",
    }
    result = options_inspector.inspect("OPTIONS", headers)

    assert result is not None
    assert result.cors is not None
    assert result.cors.allow_origin is None
    assert result.cors.allow_credentials is None
    assert result.cors.max_age is None


# ============================================================================
# Integration Tests with POST /api/requests
# ============================================================================


def test_api_options_request_includes_options_analysis() -> None:
    """Verify POST /api/requests with OPTIONS method produces full options_analysis payload."""
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "OPTIONS"
        return httpx.Response(
            status_code=204,
            headers={
                "Allow": "GET, POST, OPTIONS",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "300",
            },
            content=b"",
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "OPTIONS", "url": "https://example.com/api/test"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["method"] == "OPTIONS"

    # Verify options_analysis is present
    options = data.get("options_analysis")
    assert options is not None
    assert options["is_options_request"] is True
    assert options["has_allow_header"] is True
    assert options["allowed_methods"] == ["GET", "POST", "OPTIONS"]

    # Verify cors sub-object
    cors = options.get("cors")
    assert cors is not None
    assert cors["allow_origin"] == "*"
    assert cors["allow_methods"] == ["GET", "POST"]
    assert cors["allow_headers"] == ["Content-Type"]
    assert cors["max_age"] == 300

    # Verify header_analysis is also present (co-existence with Header Analyzer)
    assert data.get("header_analysis") is not None


def test_api_get_request_has_null_options_analysis() -> None:
    """Verify POST /api/requests with GET method leaves options_analysis as null."""
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "GET"
        return httpx.Response(
            status_code=200,
            headers={
                "Allow": "GET, POST",
                "Content-Type": "application/json",
            },
            content=b'{"ok": true}',
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://example.com/api/test"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["method"] == "GET"
    assert data.get("options_analysis") is None
