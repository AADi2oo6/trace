"""Tests for Step 18: Controlled Demo API."""

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.security import SSRFBlockedError, SecurityValidationError, validate_url_for_ssrf
from app.main import app
from app.services.request_service import request_service

client = TestClient(app)


# ============================================================================
# 1. Direct Demo API Endpoint Tests
# ============================================================================


def test_demo_catalogue_endpoint() -> None:
    """Verify that GET /demo returns the endpoint catalogue."""
    response = client.get("/demo")
    assert response.status_code == 200
    data = response.json()
    assert "endpoints" in data
    assert "categories" in data
    assert data["total"] > 10
    assert "Basics" in data["categories"]
    assert "CORS & Preflight" in data["categories"]


def test_demo_hello() -> None:
    """Verify GET /demo/hello returns standard greeting."""
    response = client.get("/demo/hello")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "Hello from TRACE Demo API!" in data["message"]
    assert "timestamp" in data


def test_demo_health() -> None:
    """Verify GET /demo/health returns mock health report."""
    response = client.get("/demo/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "trace-demo-api"
    assert "dependencies" in data


def test_demo_users_pagination_and_search() -> None:
    """Verify GET /demo/users supports limit, offset, and search."""
    # Default limit
    r1 = client.get("/demo/users")
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["total"] == 12
    assert len(d1["users"]) == 10

    # Limit and offset
    r2 = client.get("/demo/users?limit=3&offset=2")
    assert r2.status_code == 200
    d2 = r2.json()
    assert len(d2["users"]) == 3
    assert d2["offset"] == 2

    # Search filter
    r3 = client.get("/demo/users?search=Lovelace")
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["total"] == 1
    assert d3["users"][0]["name"] == "Ada Lovelace"


def test_demo_user_detail_and_404() -> None:
    """Verify GET /demo/users/{id} returns user or 404."""
    # Existing user
    r1 = client.get("/demo/users/1")
    assert r1.status_code == 200
    assert r1.json()["name"] == "Ada Lovelace"

    # Non-existing user
    r2 = client.get("/demo/users/999")
    assert r2.status_code == 404
    assert "not found" in r2.json()["detail"].lower()


def test_demo_echo_post_and_get() -> None:
    """Verify POST and GET /demo/echo echo headers and payload with redaction."""
    # POST echo
    r_post = client.post(
        "/demo/echo?channel=test",
        headers={
            "X-Trace-Test": "inspector-test",
            "Authorization": "Bearer secret-token-should-be-redacted",
            "Cookie": "session=secret-cookie",
        },
        json={"greeting": "hello world", "active": True},
    )
    assert r_post.status_code == 200
    d_post = r_post.json()
    assert d_post["method"] == "POST"
    assert d_post["query_params"]["channel"] == "test"
    assert d_post["body"] == {"greeting": "hello world", "active": True}
    assert d_post["headers"]["x-trace-test"] == "inspector-test"
    # Sensitive headers must be sanitized
    assert d_post["headers"]["authorization"] == "[REDACTED]"
    assert d_post["headers"]["cookie"] == "[REDACTED]"

    # GET echo
    r_get = client.get("/demo/echo?param1=alpha&param2=beta")
    assert r_get.status_code == 200
    d_get = r_get.json()
    assert d_get["method"] == "GET"
    assert d_get["query_params"] == {"param1": "alpha", "param2": "beta"}


def test_demo_status_codes() -> None:
    """Verify various status code simulators."""
    # 200
    assert client.get("/demo/status/200").status_code == 200
    # 201
    assert client.get("/demo/status/201").status_code == 201

    # 204 No Content MUST NOT have body (RFC 9110)
    r204 = client.get("/demo/status/204")
    assert r204.status_code == 204
    assert r204.content == b""

    # 302 Redirect
    r302 = client.get("/demo/status/302", follow_redirects=False)
    assert r302.status_code == 302
    assert r302.headers.get("location") == "/demo/hello"

    # 400
    assert client.get("/demo/status/400").status_code == 400

    # 401 with WWW-Authenticate
    r401 = client.get("/demo/status/401")
    assert r401.status_code == 401
    assert "WWW-Authenticate" in r401.headers

    # 403
    assert client.get("/demo/status/403").status_code == 403

    # 404
    assert client.get("/demo/status/404").status_code == 404

    # 418 Teapot
    assert client.get("/demo/status/418").status_code == 418

    # 429 with Retry-After
    r429 = client.get("/demo/status/429")
    assert r429.status_code == 429
    assert r429.headers.get("Retry-After") == "30"

    # 500
    assert client.get("/demo/status/500").status_code == 500

    # Unsupported status code
    assert client.get("/demo/status/999").status_code == 400


def test_demo_delay() -> None:
    """Verify delay endpoint enforces bounds and introduces sleep."""
    # Valid delay
    r = client.get("/demo/delay/50")
    assert r.status_code == 200
    data = r.json()
    assert data["requested_delay_ms"] == 50
    assert data["actual_delay_ms"] >= 40

    # Negative delay
    r_neg = client.get("/demo/delay/-10")
    assert r_neg.status_code == 400

    # Excessive delay (> 5000)
    r_huge = client.get("/demo/delay/6000")
    assert r_huge.status_code == 400


def test_demo_custom_headers_and_caching() -> None:
    """Verify custom headers and caching demonstration endpoint."""
    response = client.get("/demo/headers")
    assert response.status_code == 200
    assert response.headers.get("X-Trace-Demo-Header") == "trace-v1-verified"
    assert "max-age=3600" in response.headers.get("Cache-Control", "")
    assert response.headers.get("ETag") == 'W/"trace-demo-etag-12345"'


def test_demo_cors_scenarios_and_options() -> None:
    """Verify CORS scenario responses and OPTIONS preflight."""
    # Wildcard
    r_wild = client.get("/demo/cors?scenario=wildcard")
    assert r_wild.status_code == 200
    assert r_wild.headers.get("Access-Control-Allow-Origin") == "*"

    # Restricted
    r_restr = client.get("/demo/cors?scenario=restricted")
    assert r_restr.status_code == 200
    assert r_restr.headers.get("Access-Control-Allow-Origin") == "https://app.example.com"

    # Credentials
    r_cred = client.get("/demo/cors?scenario=credentials")
    assert r_cred.status_code == 200
    assert r_cred.headers.get("Access-Control-Allow-Credentials") == "true"
    assert r_cred.headers.get("Access-Control-Allow-Origin") != "*"

    # OPTIONS preflight
    r_opts = client.options("/demo/cors")
    assert r_opts.status_code == 204
    assert "Allow" in r_opts.headers
    assert "Access-Control-Allow-Methods" in r_opts.headers


def test_demo_auth_scenarios() -> None:
    """Verify authentication demonstration with Bearer tokens."""
    # Missing auth
    r_no_auth = client.get("/demo/auth")
    assert r_no_auth.status_code == 401
    assert "WWW-Authenticate" in r_no_auth.headers

    # Invalid token
    r_bad_auth = client.get("/demo/auth", headers={"Authorization": "Bearer bad-token"})
    assert r_bad_auth.status_code == 401

    # Reader role
    r_reader = client.get("/demo/auth", headers={"Authorization": "Bearer demo-token-read"})
    assert r_reader.status_code == 200
    assert r_reader.json()["role"] == "viewer"
    assert "read" in r_reader.json()["permissions"]

    # Reader trying admin-only action
    r_reader_admin = client.get("/demo/auth?require=admin", headers={"Authorization": "Bearer demo-token-read"})
    assert r_reader_admin.status_code == 403

    # Admin role
    r_admin = client.get("/demo/auth?require=admin", headers={"Authorization": "Bearer demo-token-admin"})
    assert r_admin.status_code == 200
    assert r_admin.json()["role"] == "administrator"
    assert "delete" in r_admin.json()["permissions"]


def test_demo_large_payload() -> None:
    """Verify bounded large payload generator."""
    r = client.get("/demo/large?size=25")
    assert r.status_code == 200
    data = r.json()
    assert data["count"] == 25
    assert len(data["items"]) == 25
    assert data["items"][0]["id"] == 1


def test_demo_error_simulation() -> None:
    """Verify simulated error responses without stack trace leaks."""
    r500 = client.get("/demo/error?code=500")
    assert r500.status_code == 500
    assert r500.json()["code"] == 500
    assert "Simulated internal server error" in r500.json()["message"]

    r502 = client.get("/demo/error?code=502")
    assert r502.status_code == 502

    r503 = client.get("/demo/error?code=503")
    assert r503.status_code == 503

    # Invalid code
    r_invalid = client.get("/demo/error?code=404")
    assert r_invalid.status_code == 400


# ============================================================================
# 2. SSRF Protection Tests for Demo API Boundaries
# ============================================================================


def test_ssrf_allows_demo_endpoints() -> None:
    """Verify that localhost/127.0.0.1 targeting the /demo namespace is permitted."""
    assert validate_url_for_ssrf("http://localhost:8000/demo") == "http://localhost:8000/demo"
    assert validate_url_for_ssrf("http://localhost:8000/demo/hello") == "http://localhost:8000/demo/hello"
    assert validate_url_for_ssrf("http://127.0.0.1:8000/demo/users") == "http://127.0.0.1:8000/demo/users"
    assert validate_url_for_ssrf("http://[::1]:8000/demo/status/200") == "http://[::1]:8000/demo/status/200"


def test_ssrf_strictly_blocks_non_demo_localhost() -> None:
    """Verify that all non-demo localhost paths and other ports remain strictly blocked."""
    # Localhost internal paths
    with pytest.raises(SSRFBlockedError):
        validate_url_for_ssrf("http://localhost:8000/api/requests")
    with pytest.raises(SSRFBlockedError):
        validate_url_for_ssrf("http://127.0.0.1:8000/health")
    with pytest.raises(SSRFBlockedError):
        validate_url_for_ssrf("http://localhost:8000/admin")

    # Localhost wrong ports
    with pytest.raises(SSRFBlockedError):
        validate_url_for_ssrf("http://localhost:8080/demo/hello")
    with pytest.raises(SSRFBlockedError):
        validate_url_for_ssrf("http://127.0.0.1:3000/demo/hello")

    # Path traversal attempts (plain, single URL-encoded, double-encoded)
    with pytest.raises(SSRFBlockedError):
        validate_url_for_ssrf("http://localhost:8000/demo/../api/requests")
    with pytest.raises(SSRFBlockedError):
        validate_url_for_ssrf("http://localhost:8000/demo/%2e%2e/api/requests")
    with pytest.raises(SSRFBlockedError):
        validate_url_for_ssrf("http://localhost:8000/demo/%2E%2E/health")
    with pytest.raises(SSRFBlockedError):
        validate_url_for_ssrf("http://localhost:8000/demo/%252e%252e/admin")

    # Alternate loopback IP addresses (must not be allowed via demo exception)
    with pytest.raises(SSRFBlockedError):
        validate_url_for_ssrf("http://127.0.0.2:8000/demo/hello")
    with pytest.raises((SSRFBlockedError, SecurityValidationError)):
        validate_url_for_ssrf("http://127.1:8000/demo/hello")


# ============================================================================
# 3. Execution Pipeline Integration Tests
# ============================================================================


@pytest.mark.anyio
async def test_execution_pipeline_executes_demo_request() -> None:
    """Verify that a Demo API request passes through the full TRACE execution pipeline."""
    # Use ASGI transport to test in-process execution through request_service
    transport = httpx.ASGITransport(app=app)
    request_service.transport = transport

    try:
        from app.schemas.request import RequestCreate, HTTPMethod

        req = RequestCreate(
            method=HTTPMethod.GET,
            url="http://localhost:8000/demo/hello",
            headers={"X-Trace-Test": "pipeline-demo"},
        )
        response = await request_service.execute_request(req)

        assert response.status_code == 200
        assert response.status_text == "OK"
        assert response.body_type.value == "json"
        assert response.body is not None
        assert "Hello from TRACE Demo API!" in response.body
        assert response.dns_analysis is not None
        assert response.request_journey is not None
        assert response.error is None
    finally:
        request_service.transport = None
