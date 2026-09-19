"""Tests for Real HTTP Request Execution Engine."""

import json
import socket
from typing import Any
import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.errors import ErrorCode
from app.main import app
from app.services.request_service import request_service

client = TestClient(app)

MOCK_PUBLIC_IP = "93.184.216.34"


@pytest.fixture(autouse=True)
def mock_dns_for_test_domains(monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock socket.getaddrinfo so tests do not rely on live external DNS resolution."""
    real_getaddrinfo = socket.getaddrinfo

    def patched_getaddrinfo(host: str, port: Any, *args: Any, **kwargs: Any) -> Any:
        if "mock-api" in host or "example.com" in host:
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (MOCK_PUBLIC_IP, port or 0))]
        return real_getaddrinfo(host, port, *args, **kwargs)

    monkeypatch.setattr(socket, "getaddrinfo", patched_getaddrinfo)


@pytest.fixture(autouse=True)
def reset_service_transport() -> Any:
    """Ensure transport is reset after each test."""
    yield
    request_service.transport = None


@pytest.mark.parametrize(
    "method",
    ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
)
def test_all_http_methods_execute_successfully(method: str) -> None:
    """Verify that all supported HTTP methods execute through the engine and return normalized results."""

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == method
        status_code = 204 if method == "DELETE" else 200
        content = b"" if method in ("HEAD", "DELETE") else b'{"status": "ok"}'
        return httpx.Response(
            status_code=status_code,
            headers={"Content-Type": "application/json", "X-Server": "TraceMock"},
            content=content,
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": method, "url": "https://api.mock-api.org/endpoint"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status_code"] in (200, 204)
    assert data["method"] == method
    assert data["headers"]["x-server"] == "TraceMock"
    assert data["request_id"].startswith("req_")
    assert isinstance(data["duration_ms"], (int, float))
    assert data["error"] is None


def test_request_headers_params_and_body_forwarding() -> None:
    """Verify headers, query parameters, and JSON body payloads are forwarded accurately to target."""
    received: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        received["headers"] = dict(request.headers)
        received["params"] = dict(request.url.params)
        received["body"] = request.read().decode("utf-8")
        return httpx.Response(200, json={"echo": "received"}, request=request)

    request_service.transport = httpx.MockTransport(handler)

    payload = {
        "method": "POST",
        "url": "https://api.mock-api.org/items",
        "headers": {"X-Custom-Header": "trace-test-val", "Authorization": "Bearer sample_token"},
        "params": {"query": "trace", "page": "2"},
        "body": {"name": "Widget", "count": 42},
    }

    response = client.post("/api/requests", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status_code"] == 200

    assert received["headers"]["x-custom-header"] == "trace-test-val"
    assert received["headers"]["authorization"] == "Bearer sample_token"
    assert received["params"]["query"] == "trace"
    assert received["params"]["page"] == "2"
    assert json.loads(received["body"]) == {"name": "Widget", "count": 42}


def test_json_response_pretty_printing() -> None:
    """Verify that JSON responses are normalized and pretty-printed."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "application/json"},
            content=b'{"user":{"id":1,"name":"Alice"}}',
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/user"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    # Verify pretty-printed multiline formatting
    assert "\n" in data["body"]
    assert '"name": "Alice"' in data["body"]


def test_plain_text_and_html_body_handling() -> None:
    """Verify plain text and HTML payloads are returned as clean text."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "text/html"},
            content=b"<!DOCTYPE html><html><body><h1>Hello TRACE</h1></body></html>",
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/page"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "<h1>Hello TRACE</h1>" in data["body"]


def test_binary_body_safe_representation() -> None:
    """Verify binary non-text responses are safely represented without crashing."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "application/octet-stream"},
            content=b"\x00\x01\x02\x03\x04\xff\xfe",
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/binary"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "[Binary content: 7 bytes" in data["body"]


def test_timeout_error_handling() -> None:
    """Verify that timeout exceptions are converted to structured REQUEST_TIMEOUT errors."""

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("Mocked read timeout", request=request)

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/slow"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == ErrorCode.REQUEST_TIMEOUT
    assert "allowed time" in data["error"]["message"].lower()


def test_connection_error_handling() -> None:
    """Verify connection errors are converted to structured CONNECTION_ERROR."""

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("Connection refused by peer", request=request)

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/unreachable"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == ErrorCode.CONNECTION_ERROR


def test_redirect_handling_within_limit() -> None:
    """Verify bounded redirects are followed up to the allowed limit."""
    hops = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal hops
        hops += 1
        if hops < 3:
            return httpx.Response(
                302,
                headers={"Location": f"https://api.mock-api.org/step-{hops}"},
                request=request,
            )
        return httpx.Response(200, json={"final": True, "hops": hops}, request=request)

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/start"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status_code"] == 200
    assert hops == 3


def test_redirect_limit_exceeded() -> None:
    """Verify that exceeding the maximum redirect limit returns REDIRECT_ERROR."""
    count = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal count
        count += 1
        return httpx.Response(
            302,
            headers={"Location": f"https://api.mock-api.org/loop-{count}"},
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/loop-0"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == ErrorCode.REDIRECT_ERROR
    assert "redirect limit" in data["error"]["message"].lower()


def test_redirect_to_private_ip_blocked_by_ssrf() -> None:
    """Verify that an HTTP redirect pointing to a private or loopback IP is blocked."""

    def handler(request: httpx.Request) -> httpx.Response:
        # Attacker public server attempts to bounce request into local network
        return httpx.Response(
            302,
            headers={"Location": "http://127.0.0.1:8000/internal-secrets"},
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/bounce"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == ErrorCode.SSRF_BLOCKED


def test_response_size_limit_via_content_length() -> None:
    """Verify that responses with Content-Length exceeding the limit are blocked before downloading."""
    oversized = settings.max_response_bytes + 1000

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Length": str(oversized)},
            content=b"",
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/huge"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == ErrorCode.RESPONSE_TOO_LARGE


def test_response_size_limit_via_streaming() -> None:
    """Verify that streaming responses exceeding 2MB are stopped with RESPONSE_TOO_LARGE."""
    chunk = b"X" * (1024 * 1024)  # 1MB chunk

    def handler(request: httpx.Request) -> httpx.Response:
        # Stream 3MB without Content-Length
        return httpx.Response(
            200,
            content=chunk * 3,
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/streaming-huge"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == ErrorCode.RESPONSE_TOO_LARGE


def test_execute_alias_endpoint() -> None:
    """Verify that the /api/requests/execute alias endpoint executes requests properly."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"alias": True}, request=request)

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests/execute",
        json={"method": "GET", "url": "https://api.mock-api.org/alias"},
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
