"""Tests for TRACE Security and SSRF Protection."""

import pytest
from fastapi.testclient import TestClient

from app.core.errors import ErrorCode
from app.core.security import validate_url_for_ssrf, SSRFBlockedError, InvalidURLSecurityError
from app.main import app

client = TestClient(app)


@pytest.mark.parametrize(
    "blocked_url",
    [
        "http://localhost",
        "http://localhost:8080",
        "http://api.localhost",
        "http://127.0.0.1",
        "http://127.0.0.1:8000/health",
        "http://127.0.1.1",
        "http://0.0.0.0",
        "http://10.0.0.1",
        "http://10.254.254.254",
        "http://172.16.0.1",
        "http://172.31.255.255",
        "http://192.168.0.1",
        "http://192.168.1.100",
        "http://169.254.169.254",  # AWS/GCP cloud metadata
        "http://169.254.1.1",
        "http://100.64.0.1",  # Carrier-grade NAT
        "http://[::1]",  # IPv6 loopback
        "http://[::]",
        "http://[fc00::1]",  # IPv6 Unique Local
        "http://[fe80::1]",  # IPv6 Link-Local
        "http://[::ffff:127.0.0.1]",  # IPv4-mapped IPv6 loopback
        "http://[64:ff9b::7f00:1]",  # NAT64 embedded loopback
        "http://[64:ff9b::a9fe:a9fe]",  # NAT64 embedded cloud metadata
        "http://service.internal",
        "http://cluster.local",
    ],
)
def test_ssrf_validator_blocks_internal_destinations(blocked_url: str) -> None:
    """Verify that validate_url_for_ssrf blocks all private, local, and metadata endpoints."""
    with pytest.raises(SSRFBlockedError):
        validate_url_for_ssrf(blocked_url)


@pytest.mark.parametrize(
    "blocked_url",
    [
        "http://127.0.0.1:8000/api",
        "http://localhost/admin",
        "http://169.254.169.254/latest/meta-data",
        "http://10.0.1.5/status",
        "http://192.168.1.1/router",
        "http://[::1]/debug",
    ],
)
def test_api_endpoint_ssrf_blocking(blocked_url: str) -> None:
    """Verify that POST /api/requests returns structured SSRF_BLOCKED error for private targets."""
    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": blocked_url},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == ErrorCode.SSRF_BLOCKED
    assert "blocked" in data["error"]["message"].lower()


@pytest.mark.parametrize(
    "invalid_scheme_url",
    [
        "ftp://example.com/file",
        "file:///etc/passwd",
        "gopher://example.com",
        "javascript:alert(1)",
    ],
)
def test_unsupported_schemes_rejected_by_security(invalid_scheme_url: str) -> None:
    """Verify that non-http/https schemes are rejected."""
    with pytest.raises(InvalidURLSecurityError):
        validate_url_for_ssrf(invalid_scheme_url)


def test_public_ip_allowed_by_ssrf_validator() -> None:
    """Verify that legitimate public IP literals pass SSRF validation."""
    public_url = "https://93.184.216.34/resource"  # example.com public IP
    validated = validate_url_for_ssrf(public_url)
    assert validated == public_url


def test_public_nat64_ip_allowed_by_ssrf_validator() -> None:
    """Verify that public RFC 6052 NAT64 IP addresses pass SSRF validation."""
    # 93.184.216.34 embedded in 64:ff9b:: -> 64:ff9b::5db8:d822
    public_nat64_url = "https://[64:ff9b::5db8:d822]/resource"
    validated = validate_url_for_ssrf(public_nat64_url)
    assert validated == public_nat64_url
