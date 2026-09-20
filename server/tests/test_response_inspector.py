"""Tests for TRACE Response Inspector Service and Contract."""

from typing import Any
import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.request import BodyType, StatusCategory
from app.services.request_service import request_service
from app.services.response_inspector import response_inspector

client = TestClient(app)


# --- Direct Unit Tests for ResponseInspector ---

def test_status_categorization_and_phrases() -> None:
    """Verify that RFC status ranges are properly classified with standard reason phrases."""
    cases = [
        (101, StatusCategory.INFORMATIONAL, "Switching Protocols"),
        (200, StatusCategory.SUCCESS, "OK"),
        (201, StatusCategory.SUCCESS, "Created"),
        (204, StatusCategory.SUCCESS, "No Content"),
        (301, StatusCategory.REDIRECTION, "Moved Permanently"),
        (302, StatusCategory.REDIRECTION, "Found"),
        (400, StatusCategory.CLIENT_ERROR, "Bad Request"),
        (401, StatusCategory.CLIENT_ERROR, "Unauthorized"),
        (403, StatusCategory.CLIENT_ERROR, "Forbidden"),
        (404, StatusCategory.CLIENT_ERROR, "Not Found"),
        (500, StatusCategory.SERVER_ERROR, "Internal Server Error"),
        (502, StatusCategory.SERVER_ERROR, "Bad Gateway"),
        (503, StatusCategory.SERVER_ERROR, "Service Unavailable"),
    ]

    for status_code, expected_category, expected_text in cases:
        result = response_inspector.inspect(status_code, {}, b"")
        assert result.status_category == expected_category
        assert result.status_text == expected_text


def test_empty_body_inspection() -> None:
    """Verify that an empty payload returns BodyType.EMPTY, body=None, and body_size=0."""
    result = response_inspector.inspect(
        204,
        {"Content-Type": "application/json"},
        b"",
    )
    assert result.body_type == BodyType.EMPTY
    assert result.body is None
    assert result.body_size == 0


def test_valid_json_inspection() -> None:
    """Verify JSON payloads are detected, formatted, and sized."""
    raw = b'{"name":"trace","version":1}'
    result = response_inspector.inspect(
        200,
        {"Content-Type": "application/json; charset=utf-8"},
        raw,
    )
    assert result.body_type == BodyType.JSON
    assert result.body_size == len(raw)
    assert result.content_type == "application/json; charset=utf-8"
    assert '"name": "trace"' in result.body
    assert "\n" in result.body  # Pretty printed


def test_invalid_json_with_json_header_does_not_crash() -> None:
    """Verify that malformed JSON with application/json falls back to text safely."""
    malformed = b'{"name": "trace", incomplete...'
    result = response_inspector.inspect(
        200,
        {"Content-Type": "application/json"},
        malformed,
    )
    assert result.body_type == BodyType.TEXT
    assert result.body == '{"name": "trace", incomplete...'
    assert result.body_size == len(malformed)


def test_html_body_inspection() -> None:
    """Verify HTML payloads are recognized via content-type or doctype structure."""
    html_raw = b"<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hi</h1></body></html>"
    # Case 1: text/html header
    result = response_inspector.inspect(200, {"Content-Type": "text/html"}, html_raw)
    assert result.body_type == BodyType.HTML
    assert result.body == html_raw.decode("utf-8")

    # Case 2: missing Content-Type but starts with <!DOCTYPE html
    result_no_header = response_inspector.inspect(200, {}, html_raw)
    assert result_no_header.body_type == BodyType.HTML
    assert result_no_header.body == html_raw.decode("utf-8")


def test_plain_text_inspection() -> None:
    """Verify plain text payloads return BodyType.TEXT."""
    text_raw = b"Sample plain text response."
    result = response_inspector.inspect(200, {"Content-Type": "text/plain"}, text_raw)
    assert result.body_type == BodyType.TEXT
    assert result.body == "Sample plain text response."
    assert result.body_size == len(text_raw)


def test_binary_body_inspection() -> None:
    """Verify binary payloads are detected via null bytes or mime type without leaking raw bytes."""
    # Substring in mime
    img_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    result = response_inspector.inspect(
        200,
        {"Content-Type": "image/png"},
        img_bytes,
    )
    assert result.body_type == BodyType.BINARY
    assert result.body is None
    assert result.body_size == len(img_bytes)

    # Generic stream with null byte
    stream_bytes = b"\x00\x01\x02\x03\x04"
    result_null = response_inspector.inspect(
        200,
        {"Content-Type": "application/octet-stream"},
        stream_bytes,
    )
    assert result_null.body_type == BodyType.BINARY
    assert result_null.body is None
    assert result_null.body_size == 5


def test_missing_content_type_with_raw_bytes() -> None:
    """Verify handling when server does not return a Content-Type header."""
    raw = b"Plain unlabelled response."
    result = response_inspector.inspect(200, {}, raw)
    assert result.body_type == BodyType.TEXT
    assert result.body == "Plain unlabelled response."
    assert result.content_type is None


# --- End-to-End API Integration Tests with ResponseInspector ---

@pytest.fixture(autouse=True)
def reset_service_transport() -> Any:
    yield
    request_service.transport = None


def test_api_inspects_4xx_client_error() -> None:
    """Verify that HTTP 404 response is categorized as client_error with full inspection data."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            404,
            headers={"Content-Type": "application/json"},
            json={"error": "Not Found"},
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/missing"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status_code"] == 404
    assert data["status_text"] == "Not Found"
    assert data["status_category"] == StatusCategory.CLIENT_ERROR
    assert data["body_type"] == BodyType.JSON
    assert data["body_size"] > 0
    assert data["error"] is None


def test_api_inspects_5xx_server_error() -> None:
    """Verify that HTTP 500 response is categorized as server_error with full inspection data."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            500,
            headers={"Content-Type": "text/plain"},
            content=b"Internal Database Connection Failure",
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/crash"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status_code"] == 500
    assert data["status_text"] == "Internal Server Error"
    assert data["status_category"] == StatusCategory.SERVER_ERROR
    assert data["body_type"] == BodyType.TEXT
    assert data["body"] == "Internal Database Connection Failure"
    assert data["error"] is None


def test_api_inspects_204_no_content() -> None:
    """Verify that HTTP 204 response returns empty body type and null body."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(204, request=request)

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "DELETE", "url": "https://api.mock-api.org/item/1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status_code"] == 204
    assert data["status_text"] == "No Content"
    assert data["status_category"] == StatusCategory.SUCCESS
    assert data["body_type"] == BodyType.EMPTY
    assert data["body"] is None
    assert data["body_size"] == 0


def test_api_inspects_binary_image_response() -> None:
    """Verify that an image/png response returns binary body_type, null body, and byte size."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "image/png"},
            content=b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR",
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/logo.png"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status_code"] == 200
    assert data["content_type"] == "image/png"
    assert data["body_type"] == BodyType.BINARY
    assert data["body"] is None
    assert data["body_size"] == 16
