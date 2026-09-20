"""Tests for Step 8: CORS Analyzer."""

from typing import Any
import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.cors_analyzer import cors_analyzer
from app.services.options_inspector import options_inspector
from app.services.request_service import request_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_service_transport() -> Any:
    """Ensure transport is reset after each test."""
    yield
    request_service.transport = None


# ============================================================================
# Unit Tests for CorsAnalyzer Service (Rules 1-22)
# ============================================================================


def test_1_origin_explicitly_allowed() -> None:
    """Verify that when requested origin matches Access-Control-Allow-Origin, origin_allowed is True."""
    req_headers = {"Origin": "https://example.com"}
    resp_headers = {"Access-Control-Allow-Origin": "https://example.com"}

    result = cors_analyzer.analyze("GET", req_headers, resp_headers)

    assert result.is_cors_request is True
    assert result.request_origin == "https://example.com"
    assert result.allowed_origin == "https://example.com"
    assert result.origin_allowed is True
    assert result.wildcard_origin is False
    assert any("explicitly allows the requested origin" in obs for obs in result.observations)


def test_2_origin_not_allowed() -> None:
    """Verify origin mismatch sets origin_allowed to False."""
    req_headers = {"Origin": "https://malicious.com"}
    resp_headers = {"Access-Control-Allow-Origin": "https://example.com"}

    result = cors_analyzer.analyze("GET", req_headers, resp_headers)

    assert result.is_cors_request is True
    assert result.request_origin == "https://malicious.com"
    assert result.allowed_origin == "https://example.com"
    assert result.origin_allowed is False
    assert any("does not match the server-allowed origin" in obs for obs in result.observations)


def test_3_wildcard_origin() -> None:
    """Verify wildcard '*' origin permits requested origin without marking as error."""
    req_headers = {"Origin": "https://example.com"}
    resp_headers = {"Access-Control-Allow-Origin": "*"}

    result = cors_analyzer.analyze("GET", req_headers, resp_headers)

    assert result.is_cors_request is True
    assert result.allowed_origin == "*"
    assert result.wildcard_origin is True
    assert result.origin_allowed is True
    assert any("uses wildcard origin (*)" in obs for obs in result.observations)


def test_4_no_allow_origin_header() -> None:
    """Verify missing Access-Control-Allow-Origin sets origin_allowed to False."""
    req_headers = {"Origin": "https://example.com"}
    resp_headers = {"Content-Type": "application/json"}

    result = cors_analyzer.analyze("GET", req_headers, resp_headers)

    assert result.is_cors_request is True
    assert result.request_origin == "https://example.com"
    assert result.allowed_origin is None
    assert result.origin_allowed is False
    assert any("No Access-Control-Allow-Origin header was returned" in obs for obs in result.observations)


def test_5_requested_method_allowed() -> None:
    """Verify Access-Control-Request-Method listed in Access-Control-Allow-Methods sets method_allowed to True."""
    req_headers = {
        "Origin": "https://example.com",
        "Access-Control-Request-Method": "POST",
    }
    resp_headers = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    }

    result = cors_analyzer.analyze("OPTIONS", req_headers, resp_headers)

    assert result.requested_method == "POST"
    assert result.allowed_methods == ["GET", "POST", "OPTIONS"]
    assert result.method_allowed is True
    assert any("The requested method 'POST' is listed in Access-Control-Allow-Methods" in obs for obs in result.observations)


def test_6_requested_method_not_allowed() -> None:
    """Verify unlisted Access-Control-Request-Method sets method_allowed to False."""
    req_headers = {
        "Origin": "https://example.com",
        "Access-Control-Request-Method": "DELETE",
    }
    resp_headers = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Allow-Methods": "GET, POST",
    }

    result = cors_analyzer.analyze("OPTIONS", req_headers, resp_headers)

    assert result.requested_method == "DELETE"
    assert result.allowed_methods == ["GET", "POST"]
    assert result.method_allowed is False
    assert any("The requested method 'DELETE' is not listed in Access-Control-Allow-Methods" in obs for obs in result.observations)


def test_7_case_insensitive_method_matching() -> None:
    """Verify method matching is case-insensitive."""
    req_headers = {
        "Origin": "https://example.com",
        "Access-Control-Request-Method": "post",
    }
    resp_headers = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Allow-Methods": "GET, POST",
    }

    result = cors_analyzer.analyze("OPTIONS", req_headers, resp_headers)

    assert result.requested_method == "POST"
    assert result.method_allowed is True


def test_8_duplicate_method_handling() -> None:
    """Verify duplicate methods in Access-Control-Allow-Methods are deduplicated and normalized."""
    req_headers = {"Origin": "https://example.com"}
    resp_headers = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Allow-Methods": "GET, post, OPTIONS, GET",
    }

    result = cors_analyzer.analyze("GET", req_headers, resp_headers)

    assert result.allowed_methods == ["GET", "POST", "OPTIONS"]


def test_9_requested_headers_all_allowed() -> None:
    """Verify headers_allowed is True when all requested headers are permitted."""
    req_headers = {
        "Origin": "https://example.com",
        "Access-Control-Request-Headers": "Authorization, Content-Type",
    }
    resp_headers = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }

    result = cors_analyzer.analyze("OPTIONS", req_headers, resp_headers)

    assert result.requested_headers == ["Authorization", "Content-Type"]
    assert result.allowed_headers == ["Content-Type", "Authorization"]
    assert result.headers_allowed is True
    assert any("All requested CORS headers are listed in Access-Control-Allow-Headers" in obs for obs in result.observations)


def test_10_requested_header_missing() -> None:
    """Verify unlisted requested header sets headers_allowed to False and lists missing header."""
    req_headers = {
        "Origin": "https://example.com",
        "Access-Control-Request-Headers": "Authorization, Content-Type, X-Custom-Header",
    }
    resp_headers = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
    }

    result = cors_analyzer.analyze("OPTIONS", req_headers, resp_headers)

    assert result.headers_allowed is False
    assert any("The following requested headers are not listed in Access-Control-Allow-Headers: X-Custom-Header" in obs for obs in result.observations)


def test_11_case_insensitive_header_matching() -> None:
    """Verify requested headers matching against allowed headers is case-insensitive."""
    req_headers = {
        "Origin": "https://example.com",
        "Access-Control-Request-Headers": "authorization, content-type",
    }
    resp_headers = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
    }

    result = cors_analyzer.analyze("OPTIONS", req_headers, resp_headers)

    assert result.headers_allowed is True


def test_12_credentials_true() -> None:
    """Verify parsing Access-Control-Allow-Credentials: true."""
    req_headers = {"Origin": "https://example.com"}
    resp_headers = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Allow-Credentials": "true",
    }

    result = cors_analyzer.analyze("GET", req_headers, resp_headers)

    assert result.allow_credentials is True
    assert any("Credentials are enabled" in obs for obs in result.observations)


def test_13_credentials_false_or_missing() -> None:
    """Verify parsing Access-Control-Allow-Credentials: false and absent."""
    req_headers = {"Origin": "https://example.com"}
    resp1 = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Allow-Credentials": "false",
    }
    result1 = cors_analyzer.analyze("GET", req_headers, resp1)
    assert result1.allow_credentials is False
    assert any("Credentials are explicitly disabled" in obs for obs in result1.observations)

    resp2 = {"Access-Control-Allow-Origin": "https://example.com"}
    result2 = cors_analyzer.analyze("GET", req_headers, resp2)
    assert result2.allow_credentials is None
    assert any("Credentials are not enabled" in obs for obs in result2.observations)


def test_14_max_age_parsing() -> None:
    """Verify parsing Access-Control-Max-Age integer seconds."""
    req_headers = {"Origin": "https://example.com"}
    resp_headers = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Max-Age": "600",
    }

    result = cors_analyzer.analyze("OPTIONS", req_headers, resp_headers)

    assert result.max_age == 600
    assert any("preflight caching for 600 seconds" in obs for obs in result.observations)


def test_15_invalid_max_age_handling() -> None:
    """Verify invalid Access-Control-Max-Age does not fail the analyzer."""
    req_headers = {"Origin": "https://example.com"}
    resp_headers = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Max-Age": "invalid-age",
    }

    result = cors_analyzer.analyze("OPTIONS", req_headers, resp_headers)

    assert result.max_age is None


def test_16_expose_headers_parsing() -> None:
    """Verify parsing Access-Control-Expose-Headers into clean list."""
    req_headers = {"Origin": "https://example.com"}
    resp_headers = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Expose-Headers": "X-Request-ID, X-RateLimit-Remaining",
    }

    result = cors_analyzer.analyze("GET", req_headers, resp_headers)

    assert result.expose_headers == ["X-Request-ID", "X-RateLimit-Remaining"]
    assert any("Access-Control-Expose-Headers exposes: X-Request-ID, X-RateLimit-Remaining" in obs for obs in result.observations)


def test_17_normal_request_containing_origin() -> None:
    """Verify regular non-OPTIONS request with Origin triggers CORS analysis."""
    req_headers = {"Origin": "https://app.example.com"}
    resp_headers = {"Access-Control-Allow-Origin": "https://app.example.com"}

    result = cors_analyzer.analyze("GET", req_headers, resp_headers)

    assert result.is_cors_request is True
    assert result.request_origin == "https://app.example.com"
    assert result.requested_method == "GET"
    assert result.origin_allowed is True


def test_18_options_preflight_style_request() -> None:
    """Verify OPTIONS preflight-style request with method and headers requests."""
    req_headers = {
        "Origin": "https://app.example.com",
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "Content-Type",
    }
    resp_headers = {
        "Access-Control-Allow-Origin": "https://app.example.com",
        "Access-Control-Allow-Methods": "PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    result = cors_analyzer.analyze("OPTIONS", req_headers, resp_headers)

    assert result.is_cors_request is True
    assert result.requested_method == "PUT"
    assert result.method_allowed is True
    assert result.requested_headers == ["Content-Type"]
    assert result.headers_allowed is True


def test_19_cors_headers_absent() -> None:
    """Verify when no CORS request or response headers exist, is_cors_request is False."""
    req_headers = {"Accept": "application/json"}
    resp_headers = {"Content-Type": "application/json"}

    result = cors_analyzer.analyze("GET", req_headers, resp_headers)

    assert result.is_cors_request is False
    assert any("No CORS-related request or response headers were detected" in obs for obs in result.observations)


def test_20_wildcard_origin_and_credentials_observation() -> None:
    """Verify combination of wildcard origin and credentials: true emits specific specification observation."""
    req_headers = {"Origin": "https://example.com"}
    resp_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
    }

    result = cors_analyzer.analyze("GET", req_headers, resp_headers)

    assert result.wildcard_origin is True
    assert result.allow_credentials is True
    assert any("restricted in browser CORS specifications" in obs for obs in result.observations)


def test_21_allow_does_not_affect_cors_methods() -> None:
    """Verify resource Allow header does not populate or affect CORS allowed_methods."""
    req_headers = {"Origin": "https://example.com", "Access-Control-Request-Method": "POST"}
    resp_headers = {
        "Allow": "GET, POST, DELETE",
        # Access-Control-Allow-Methods is intentionally absent
    }

    result = cors_analyzer.analyze("OPTIONS", req_headers, resp_headers)

    assert result.allowed_methods is None
    assert result.method_allowed is False


def test_22_cors_does_not_affect_resource_allow() -> None:
    """Verify Access-Control-Allow-Methods does not overwrite resource-level Allow in OptionsInspector."""
    resp_headers = {
        "Allow": "GET, POST",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    }

    options_result = options_inspector.inspect("OPTIONS", resp_headers)
    assert options_result is not None
    assert options_result.allowed_methods == ["GET", "POST"]
    assert options_result.cors is not None
    assert options_result.cors.allow_methods == ["GET", "POST", "PUT", "DELETE"]


# ============================================================================
# Integration Tests with POST /api/requests
# ============================================================================


def test_api_cors_request_populates_cors_analysis() -> None:
    """Verify POST /api/requests with Origin produces populated cors_analysis in response."""
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers.get("origin") == "https://client.example.com"
        return httpx.Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": "https://client.example.com",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST",
                "Content-Type": "application/json",
            },
            content=b'{"data": "success"}',
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={
            "method": "GET",
            "url": "https://api.mock-api.org/items",
            "headers": {"Origin": "https://client.example.com"},
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    cors = data.get("cors_analysis")
    assert cors is not None
    assert cors["is_cors_request"] is True
    assert cors["request_origin"] == "https://client.example.com"
    assert cors["allowed_origin"] == "https://client.example.com"
    assert cors["origin_allowed"] is True
    assert cors["allow_credentials"] is True
    assert cors["allowed_methods"] == ["GET", "POST"]


def test_api_non_cors_request_leaves_cors_analysis_null() -> None:
    """Verify standard request without CORS request or response headers leaves cors_analysis as null."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code=200,
            headers={"Content-Type": "application/json"},
            content=b'{"ok": true}',
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/ping"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data.get("cors_analysis") is None
