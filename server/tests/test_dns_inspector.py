"""Tests for Step 9: DNS Inspector."""

from typing import Any
from unittest.mock import AsyncMock
import dns.asyncresolver
import dns.resolver
import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.dns_inspector import DnsInspector, dns_inspector
from app.services.request_service import request_service

client = TestClient(app)


class MockRecord:
    """Mock dnspython rdata record."""

    def __init__(self, address: str) -> None:
        self.address = address

    def __str__(self) -> str:
        return self.address


@pytest.fixture(autouse=True)
def reset_service_transport() -> Any:
    """Ensure transport is reset after each test."""
    yield
    request_service.transport = None


# ============================================================================
# Unit Tests for DnsInspector Service
# ============================================================================


@pytest.mark.anyio
async def test_1_successful_ipv4_resolution() -> None:
    """Verify resolution of IPv4 (A) records."""
    mock_resolver = AsyncMock(spec=dns.asyncresolver.Resolver)

    async def mock_resolve(qname: str, rdtype: str, *args: Any, **kwargs: Any) -> Any:
        if rdtype == "A":
            return [MockRecord("93.184.216.34")]
        raise dns.resolver.NoAnswer()

    mock_resolver.resolve.side_effect = mock_resolve
    inspector = DnsInspector(resolver=mock_resolver)

    result = await inspector.inspect("example.com")

    assert result.resolved is True
    assert result.hostname == "example.com"
    assert result.ipv4_addresses == ["93.184.216.34"]
    assert result.ipv6_addresses == []
    assert result.error is None
    assert any("Resolved 1 IPv4 address" in obs for obs in result.observations)


@pytest.mark.anyio
async def test_2_successful_ipv6_resolution() -> None:
    """Verify resolution of IPv6 (AAAA) records."""
    mock_resolver = AsyncMock(spec=dns.asyncresolver.Resolver)

    async def mock_resolve(qname: str, rdtype: str, *args: Any, **kwargs: Any) -> Any:
        if rdtype == "AAAA":
            return [MockRecord("2606:2800:220:1:248:1893:25c8:1946")]
        raise dns.resolver.NoAnswer()

    mock_resolver.resolve.side_effect = mock_resolve
    inspector = DnsInspector(resolver=mock_resolver)

    result = await inspector.inspect("ipv6.example.com")

    assert result.resolved is True
    assert result.hostname == "ipv6.example.com"
    assert result.ipv4_addresses == []
    assert result.ipv6_addresses == ["2606:2800:220:1:248:1893:25c8:1946"]
    assert result.error is None
    assert any("Resolved 1 IPv6 address" in obs for obs in result.observations)


@pytest.mark.anyio
async def test_3_both_ipv4_and_ipv6() -> None:
    """Verify simultaneous resolution of both IPv4 and IPv6 records."""
    mock_resolver = AsyncMock(spec=dns.asyncresolver.Resolver)

    async def mock_resolve(qname: str, rdtype: str, *args: Any, **kwargs: Any) -> Any:
        if rdtype == "A":
            return [MockRecord("93.184.216.34")]
        if rdtype == "AAAA":
            return [MockRecord("2606:2800:220:1:248:1893:25c8:1946")]
        raise dns.resolver.NoAnswer()

    mock_resolver.resolve.side_effect = mock_resolve
    inspector = DnsInspector(resolver=mock_resolver)

    result = await inspector.inspect("dual.example.com")

    assert result.resolved is True
    assert result.ipv4_addresses == ["93.184.216.34"]
    assert result.ipv6_addresses == ["2606:2800:220:1:248:1893:25c8:1946"]
    assert result.error is None


@pytest.mark.anyio
async def test_4_multiple_addresses() -> None:
    """Verify that multiple records for the same family are all captured."""
    mock_resolver = AsyncMock(spec=dns.asyncresolver.Resolver)

    async def mock_resolve(qname: str, rdtype: str, *args: Any, **kwargs: Any) -> Any:
        if rdtype == "A":
            return [MockRecord("104.20.23.154"), MockRecord("172.66.147.243")]
        raise dns.resolver.NoAnswer()

    mock_resolver.resolve.side_effect = mock_resolve
    inspector = DnsInspector(resolver=mock_resolver)

    result = await inspector.inspect("multi.example.com")

    assert result.resolved is True
    assert result.ipv4_addresses == ["104.20.23.154", "172.66.147.243"]


@pytest.mark.anyio
async def test_5_duplicate_address_removal() -> None:
    """Verify that duplicate IP records are deduplicated while preserving order."""
    mock_resolver = AsyncMock(spec=dns.asyncresolver.Resolver)

    async def mock_resolve(qname: str, rdtype: str, *args: Any, **kwargs: Any) -> Any:
        if rdtype == "A":
            return [MockRecord("104.20.23.154"), MockRecord("172.66.147.243"), MockRecord("104.20.23.154")]
        raise dns.resolver.NoAnswer()

    mock_resolver.resolve.side_effect = mock_resolve
    inspector = DnsInspector(resolver=mock_resolver)

    result = await inspector.inspect("dup.example.com")

    assert result.ipv4_addresses == ["104.20.23.154", "172.66.147.243"]


@pytest.mark.anyio
async def test_6_empty_result() -> None:
    """Verify that NoAnswer for both record types results in resolved=False."""
    mock_resolver = AsyncMock(spec=dns.asyncresolver.Resolver)
    mock_resolver.resolve.side_effect = dns.resolver.NoAnswer()
    inspector = DnsInspector(resolver=mock_resolver)

    result = await inspector.inspect("empty.example.com")

    assert result.resolved is False
    assert result.ipv4_addresses == []
    assert result.ipv6_addresses == []
    assert result.error is not None
    assert "No A or AAAA records found" in result.error


@pytest.mark.anyio
async def test_7_dns_resolution_failure_nxdomain() -> None:
    """Verify that NXDOMAIN is handled safely without raising unhandled exceptions."""
    mock_resolver = AsyncMock(spec=dns.asyncresolver.Resolver)
    mock_resolver.resolve.side_effect = dns.resolver.NXDOMAIN()
    inspector = DnsInspector(resolver=mock_resolver)

    result = await inspector.inspect("does-not-exist.example")

    assert result.resolved is False
    assert result.ipv4_addresses == []
    assert result.ipv6_addresses == []
    assert result.error is not None
    assert "NXDOMAIN" in result.error


@pytest.mark.anyio
async def test_8_invalid_hostname_handling() -> None:
    """Verify empty or invalid hostname is caught and returned safely."""
    inspector = DnsInspector()

    result = await inspector.inspect("")

    assert result.resolved is False
    assert result.error == "Invalid or empty hostname."
    assert any("does not specify a valid hostname" in obs for obs in result.observations)


@pytest.mark.anyio
async def test_9_resolution_timing_exists_and_numeric() -> None:
    """Verify that resolution_time_ms is populated as a non-negative float."""
    mock_resolver = AsyncMock(spec=dns.asyncresolver.Resolver)

    async def mock_resolve(qname: str, rdtype: str, *args: Any, **kwargs: Any) -> Any:
        if rdtype == "A":
            return [MockRecord("93.184.216.34")]
        raise dns.resolver.NoAnswer()

    mock_resolver.resolve.side_effect = mock_resolve
    inspector = DnsInspector(resolver=mock_resolver)

    result = await inspector.inspect("timed.example.com")

    assert isinstance(result.resolution_time_ms, float)
    assert result.resolution_time_ms >= 0.0


# ============================================================================
# Hostname Extraction Tests
# ============================================================================


def test_10_correct_hostname_extraction_from_url() -> None:
    """Verify hostname is cleanly extracted from a full URL."""
    assert DnsInspector.extract_hostname("https://api.example.com/users") == "api.example.com"
    assert DnsInspector.extract_hostname("http://sub.api.example.com/") == "sub.api.example.com"


def test_11_query_parameters_do_not_affect_hostname() -> None:
    """Verify query parameters are excluded from the extracted hostname."""
    assert DnsInspector.extract_hostname("https://example.com/path?key=value&foo=bar") == "example.com"


def test_12_path_does_not_affect_hostname() -> None:
    """Verify URL path segments do not pollute the extracted hostname."""
    assert DnsInspector.extract_hostname("https://example.com/v1/api/endpoint/subpath") == "example.com"


def test_13_https_url_handling() -> None:
    """Verify HTTPS scheme URLs are supported."""
    assert DnsInspector.extract_hostname("https://secure.example.com:443/data") == "secure.example.com"


def test_14_http_url_handling() -> None:
    """Verify HTTP scheme URLs are supported."""
    assert DnsInspector.extract_hostname("http://plain.example.com:80/data") == "plain.example.com"


@pytest.mark.anyio
async def test_15_ip_literal_fast_path() -> None:
    """Verify that IP literals skip DNS resolution and are populated directly."""
    inspector = DnsInspector()

    res_ipv4 = await inspector.inspect("93.184.216.34")
    assert res_ipv4.resolved is True
    assert res_ipv4.ipv4_addresses == ["93.184.216.34"]
    assert res_ipv4.ipv6_addresses == []
    assert any("is an IP literal" in obs for obs in res_ipv4.observations)

    res_ipv6 = await inspector.inspect("2001:db8::1")
    assert res_ipv6.resolved is True
    assert res_ipv6.ipv6_addresses == ["2001:db8::1"]
    assert res_ipv6.ipv4_addresses == []
    assert any("is an IP literal" in obs for obs in res_ipv6.observations)


# ============================================================================
# Integration Tests with POST /api/requests
# ============================================================================


def test_16_integration_through_api_requests() -> None:
    """Verify POST /api/requests returns dns_analysis in response payload."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code=200,
            headers={"Content-Type": "application/json"},
            content=b'{"status": "ok"}',
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.mock-api.org/items"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    dns_analysis = data.get("dns_analysis")
    assert dns_analysis is not None
    assert dns_analysis["hostname"] == "api.mock-api.org"
    assert dns_analysis["resolved"] is True
    assert "93.184.216.34" in dns_analysis["ipv4_addresses"]
    assert isinstance(dns_analysis["resolution_time_ms"], float)


def test_17_dns_failure_does_not_crash_request_handling() -> None:
    """Verify that a non-resolvable domain does not cause a 500 error."""
    # When socket.getaddrinfo or dns_inspector fails for a non-existent domain:
    response = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://nonexistent-domain-xyz-404.test/ping"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "DNS_ERROR"


def test_18_existing_ssrf_protection_remains_active() -> None:
    """Verify that loopback and private IP SSRF protection remains fully active."""
    resp1 = client.post(
        "/api/requests",
        json={"method": "GET", "url": "http://127.0.0.1:8000/health"},
    )
    assert resp1.status_code == 200
    assert resp1.json()["success"] is False
    assert resp1.json()["error"]["code"] == "SSRF_BLOCKED"

    resp2 = client.post(
        "/api/requests",
        json={"method": "GET", "url": "http://localhost:8000/health"},
    )
    assert resp2.status_code == 200
    assert resp2.json()["success"] is False
    assert resp2.json()["error"]["code"] == "SSRF_BLOCKED"
