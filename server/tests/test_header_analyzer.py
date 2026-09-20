"""Tests for TRACE Header Analyzer Service and API Integration."""

from typing import Any
import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.request import HeaderCategory, HeaderSource
from app.services.header_analyzer import header_analyzer, mask_sensitive_value
from app.services.request_service import request_service

client = TestClient(app)


# --- Unit Tests for HeaderAnalyzer ---

def test_known_headers_categorization() -> None:
    """Verify that common standard headers are mapped to their correct technical categories."""
    test_cases = [
        # Content
        ("Content-Type", HeaderCategory.CONTENT),
        ("Content-Length", HeaderCategory.CONTENT),
        ("Content-Encoding", HeaderCategory.CONTENT),
        ("Accept", HeaderCategory.CONTENT),
        # Caching
        ("Cache-Control", HeaderCategory.CACHING),
        ("ETag", HeaderCategory.CACHING),
        ("Last-Modified", HeaderCategory.CACHING),
        ("Expires", HeaderCategory.CACHING),
        # Security
        ("Strict-Transport-Security", HeaderCategory.SECURITY),
        ("Content-Security-Policy", HeaderCategory.SECURITY),
        ("X-Content-Type-Options", HeaderCategory.SECURITY),
        ("X-Frame-Options", HeaderCategory.SECURITY),
        ("Referrer-Policy", HeaderCategory.SECURITY),
        # CORS
        ("Access-Control-Allow-Origin", HeaderCategory.CORS),
        ("Access-Control-Allow-Methods", HeaderCategory.CORS),
        ("Access-Control-Allow-Headers", HeaderCategory.CORS),
        ("Origin", HeaderCategory.CORS),
        # Authentication
        ("Authorization", HeaderCategory.AUTHENTICATION),
        ("WWW-Authenticate", HeaderCategory.AUTHENTICATION),
        # Cookies
        ("Set-Cookie", HeaderCategory.COOKIES),
        ("Cookie", HeaderCategory.COOKIES),
        # Connection
        ("Connection", HeaderCategory.CONNECTION),
        ("Upgrade", HeaderCategory.CONNECTION),
        # Redirection
        ("Location", HeaderCategory.REDIRECTION),
        # Server
        ("Server", HeaderCategory.SERVER),
        ("Via", HeaderCategory.SERVER),
        # General
        ("Date", HeaderCategory.GENERAL),
        ("Allow", HeaderCategory.GENERAL),
    ]

    for header_name, expected_category in test_cases:
        items = header_analyzer.analyze_response_headers({header_name: "test-value"})
        assert len(items) == 1
        assert items[0].category == expected_category
        assert len(items[0].description) > 10


def test_unknown_header_classification() -> None:
    """Verify that custom or unrecognized headers fall back cleanly to Category 'Other'."""
    items = header_analyzer.analyze_response_headers({"X-Custom-Trace-Id": "xyz-12345"})
    assert len(items) == 1
    assert items[0].name == "X-Custom-Trace-Id"
    assert items[0].category == HeaderCategory.OTHER
    assert items[0].description == "Custom or unrecognized HTTP header."
    assert items[0].observations is None


@pytest.mark.parametrize(
    "casing",
    [
        "Content-Type",
        "content-type",
        "CONTENT-TYPE",
        "cOnTeNt-TyPe",
    ],
)
def test_case_insensitive_header_lookup(casing: str) -> None:
    """Verify case-insensitivity: identical category and description regardless of header casing."""
    items = header_analyzer.analyze_response_headers({casing: "application/json"})
    assert len(items) == 1
    assert items[0].category == HeaderCategory.CONTENT
    assert "media type" in items[0].description.lower()
    assert items[0].name == casing


def test_source_separation_request_vs_response() -> None:
    """Verify request headers and response headers retain strict source identification."""
    req_headers = {"User-Agent": "TRACE-Console/1.0", "Accept": "application/json"}
    res_headers = {"Server": "CloudFront", "Content-Type": "application/json"}

    req_items = header_analyzer.analyze_request_headers(req_headers)
    res_items = header_analyzer.analyze_response_headers(res_headers)

    for item in req_items:
        assert item.source == HeaderSource.REQUEST
    for item in res_items:
        assert item.source == HeaderSource.RESPONSE

    all_items = header_analyzer.analyze_all(req_headers, res_headers)
    assert len(all_items) == 4
    assert [it.source for it in all_items] == [
        HeaderSource.REQUEST,
        HeaderSource.REQUEST,
        HeaderSource.RESPONSE,
        HeaderSource.RESPONSE,
    ]


def test_multiple_header_values_and_directives() -> None:
    """Verify headers with multiple values or complex directives are parsed without errors."""
    items = header_analyzer.analyze_response_headers(
        {"Cache-Control": "public, max-age=3600, must-revalidate, no-transform"}
    )
    assert len(items) == 1
    assert items[0].category == HeaderCategory.CACHING
    assert items[0].observations is not None
    assert any("freshness" in obs.lower() for obs in items[0].observations)


def test_neutral_security_observations() -> None:
    """Verify neutral technical observations for security headers."""
    headers = {
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
    }
    items = header_analyzer.analyze_response_headers(headers)
    obs_map = {item.name.lower(): item.observations for item in items}

    hsts_obs = obs_map["strict-transport-security"]
    assert hsts_obs is not None
    assert any("includesubdomains" in obs.lower() for obs in hsts_obs)
    assert any("preload" in obs.lower() for obs in hsts_obs)

    sniff_obs = obs_map["x-content-type-options"]
    assert sniff_obs is not None
    assert any("nosniff" in obs.lower() for obs in sniff_obs)

    cors_obs = obs_map["access-control-allow-origin"]
    assert cors_obs is not None
    assert any("wildcard" in obs.lower() for obs in cors_obs)


def test_sensitive_value_masking_utility() -> None:
    """Verify credential masking helper functions protect tokens and cookie contents."""
    # Bearer token masking
    bearer = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    masked_bearer = mask_sensitive_value("Authorization", bearer)
    assert masked_bearer.startswith("Bearer eyJ...")
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in masked_bearer

    # Basic auth masking
    basic = "Basic YWRtaW46cGFzc3dvcmQ="
    assert mask_sensitive_value("authorization", basic) == "Basic [masked]"

    # Cookie masking
    cookie = "session_token=secret123; HttpOnly; Secure; SameSite=Strict"
    masked_cookie = mask_sensitive_value("Set-Cookie", cookie)
    assert "session_token=[masked]" in masked_cookie
    assert "HttpOnly" in masked_cookie
    assert "Secure" in masked_cookie
    assert "SameSite=Strict" in masked_cookie
    assert "secret123" not in masked_cookie


# --- End-to-End API Integration Tests ---

@pytest.fixture(autouse=True)
def reset_service_transport() -> Any:
    yield
    request_service.transport = None


def test_api_endpoint_returns_header_analysis() -> None:
    """Verify that POST /api/requests returns populated header_analysis for both request and response."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={
                "Content-Type": "application/json",
                "Cache-Control": "max-age=600",
                "Server": "Kestrel",
                "X-Custom-Header": "trace-test",
            },
            json={"status": "ok"},
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    payload = {
        "method": "POST",
        "url": "https://api.mock-api.org/data",
        "headers": {
            "Accept": "application/json",
            "Authorization": "Bearer secret_token_12345",
        },
        "body": {"query": "test"},
    }

    response = client.post("/api/requests", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    analysis = data.get("header_analysis")
    assert isinstance(analysis, list)
    assert len(analysis) >= 6

    # Verify request headers in analysis
    req_items = [it for it in analysis if it["source"] == "request"]
    assert len(req_items) == 2
    req_names = {it["name"].lower(): it for it in req_items}
    assert req_names["accept"]["category"] == HeaderCategory.CONTENT
    assert req_names["authorization"]["category"] == HeaderCategory.AUTHENTICATION

    # Verify response headers in analysis
    res_items = [it for it in analysis if it["source"] == "response"]
    assert len(res_items) >= 4
    res_names = {it["name"].lower(): it for it in res_items}
    assert res_names["content-type"]["category"] == HeaderCategory.CONTENT
    assert res_names["cache-control"]["category"] == HeaderCategory.CACHING
    assert res_names["server"]["category"] == HeaderCategory.SERVER
    assert res_names["x-custom-header"]["category"] == HeaderCategory.OTHER
