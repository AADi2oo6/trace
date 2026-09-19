"""Tests for TRACE Request Schema Validation (Regression from Step 3)."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


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
