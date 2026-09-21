"""Tests for Step 10: Request Journey."""

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.request import (
    DnsAnalysis,
    JourneyPhaseSource,
    JourneyPhaseStatus,
    RequestCreate,
)
from app.services.request_journey import request_journey_service
from app.services.request_service import request_service


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


# ---------------------------------------------------------------------------
# Unit Tests for RequestJourneyService
# ---------------------------------------------------------------------------


def test_successful_journey_construction() -> None:
    """Test full journey construction for a successful HTTPS request."""
    dns_data = DnsAnalysis(
        hostname="api.example.com",
        resolved=True,
        ipv4_addresses=["93.184.216.34"],
        ipv6_addresses=["2606:2800:220:1:248:1893:25c8:1946"],
        resolution_time_ms=14.5,
        observations=["Resolved 1 IPv4 address."],
    )

    journey = request_journey_service.build(
        url="https://api.example.com/items",
        method="GET",
        total_duration_ms=88.2,
        dns_analysis=dns_data,
        success=True,
        status_code=200,
    )

    assert journey.completed is True
    assert journey.total_duration_ms == 88.2
    assert len(journey.phases) == 5

    phase_names = [p.name for p in journey.phases]
    assert phase_names == ["dns", "connection", "tls", "http", "response"]


def test_dns_phase_completed_with_duration() -> None:
    """Verify the DNS phase truthfully reports resolution time and addresses."""
    dns_data = DnsAnalysis(
        hostname="example.com",
        resolved=True,
        ipv4_addresses=["93.184.216.34"],
        ipv6_addresses=[],
        resolution_time_ms=22.3,
    )

    journey = request_journey_service.build(
        url="https://example.com/api",
        method="GET",
        total_duration_ms=105.0,
        dns_analysis=dns_data,
        success=True,
        status_code=200,
    )

    dns_phase = journey.phases[0]
    assert dns_phase.name == "dns"
    assert dns_phase.status == JourneyPhaseStatus.COMPLETED
    assert dns_phase.duration_ms == 22.3
    assert dns_phase.source == JourneyPhaseSource.DNS_INSPECTOR
    assert any("example.com" in obs for obs in dns_phase.observations)
    assert any("93.184.216.34" in obs for obs in dns_phase.observations)


def test_connection_phase_truthfully_unavailable() -> None:
    """Verify the TCP connection phase is truthfully marked unavailable with null duration."""
    dns_data = DnsAnalysis(hostname="example.com", resolved=True, resolution_time_ms=10.0)

    journey = request_journey_service.build(
        url="https://example.com/api",
        method="POST",
        total_duration_ms=75.0,
        dns_analysis=dns_data,
        success=True,
        status_code=201,
    )

    conn_phase = journey.phases[1]
    assert conn_phase.name == "connection"
    assert conn_phase.status == JourneyPhaseStatus.UNAVAILABLE
    assert conn_phase.duration_ms is None
    assert conn_phase.source == JourneyPhaseSource.DERIVED
    assert any("not independently measured" in obs for obs in conn_phase.observations)


def test_tls_phase_https_unavailable() -> None:
    """Verify HTTPS requests mark TLS phase as unavailable with null duration."""
    dns_data = DnsAnalysis(hostname="example.com", resolved=True, resolution_time_ms=12.0)

    journey = request_journey_service.build(
        url="https://example.com/secure",
        method="GET",
        total_duration_ms=90.0,
        dns_analysis=dns_data,
        success=True,
        status_code=200,
    )

    tls_phase = journey.phases[2]
    assert tls_phase.name == "tls"
    assert tls_phase.status == JourneyPhaseStatus.UNAVAILABLE
    assert tls_phase.duration_ms is None
    assert tls_phase.source == JourneyPhaseSource.DERIVED
    assert any("not independently measured" in obs for obs in tls_phase.observations)


def test_tls_phase_http_not_applicable() -> None:
    """Verify plain HTTP requests mark TLS phase as not_applicable with null duration."""
    dns_data = DnsAnalysis(hostname="example.com", resolved=True, resolution_time_ms=8.0)

    journey = request_journey_service.build(
        url="http://example.com/plain",
        method="GET",
        total_duration_ms=50.0,
        dns_analysis=dns_data,
        success=True,
        status_code=200,
    )

    tls_phase = journey.phases[2]
    assert tls_phase.name == "tls"
    assert tls_phase.status == JourneyPhaseStatus.NOT_APPLICABLE
    assert tls_phase.duration_ms is None
    assert tls_phase.source == JourneyPhaseSource.DERIVED
    assert any("not applicable for plain HTTP" in obs for obs in tls_phase.observations)


def test_http_phase_completed_with_duration() -> None:
    """Verify HTTP exchange phase reports measured round-trip request duration."""
    dns_data = DnsAnalysis(hostname="example.com", resolved=True, resolution_time_ms=11.0)

    journey = request_journey_service.build(
        url="https://example.com/resource",
        method="GET",
        total_duration_ms=142.5,
        dns_analysis=dns_data,
        success=True,
        status_code=200,
    )

    http_phase = journey.phases[3]
    assert http_phase.name == "http"
    assert http_phase.status == JourneyPhaseStatus.COMPLETED
    assert http_phase.duration_ms == 142.5
    assert http_phase.source == JourneyPhaseSource.HTTP_EXECUTION
    assert any("GET" in obs for obs in http_phase.observations)


def test_response_phase_completed_no_fake_duration() -> None:
    """Verify response phase is marked completed with status code and null duration."""
    dns_data = DnsAnalysis(hostname="example.com", resolved=True, resolution_time_ms=10.0)

    journey = request_journey_service.build(
        url="https://example.com/resource",
        method="GET",
        total_duration_ms=100.0,
        dns_analysis=dns_data,
        success=True,
        status_code=204,
    )

    resp_phase = journey.phases[4]
    assert resp_phase.name == "response"
    assert resp_phase.status == JourneyPhaseStatus.COMPLETED
    assert resp_phase.duration_ms is None
    assert resp_phase.source == JourneyPhaseSource.RESPONSE_INSPECTOR
    assert any("204" in obs for obs in resp_phase.observations)


def test_technical_honesty_zero_fabricated_timings() -> None:
    """Strict assertion: TCP, TLS, and Response phases must never have fabricated timings."""
    dns_data = DnsAnalysis(hostname="example.com", resolved=True, resolution_time_ms=15.0)

    journey = request_journey_service.build(
        url="https://example.com/test",
        method="GET",
        total_duration_ms=200.0,
        dns_analysis=dns_data,
        success=True,
        status_code=200,
    )

    phase_by_name = {p.name: p for p in journey.phases}

    # Connection must be None
    assert phase_by_name["connection"].duration_ms is None
    # TLS must be None
    assert phase_by_name["tls"].duration_ms is None
    # Response must be None
    assert phase_by_name["response"].duration_ms is None


def test_dns_duration_not_added_to_total() -> None:
    """Strict assertion: DNS lookup duration must never be added to total HTTP round-trip duration."""
    dns_duration = 35.5
    http_duration = 120.0

    dns_data = DnsAnalysis(
        hostname="example.com",
        resolved=True,
        resolution_time_ms=dns_duration,
    )

    journey = request_journey_service.build(
        url="https://example.com/test",
        method="GET",
        total_duration_ms=http_duration,
        dns_analysis=dns_data,
        success=True,
        status_code=200,
    )

    # total_duration_ms must equal the measured HTTP execution time, NOT http_duration + dns_duration
    assert journey.total_duration_ms == http_duration
    assert journey.total_duration_ms != (http_duration + dns_duration)


def test_dns_failure_halts_journey() -> None:
    """Verify that a DNS failure halts downstream phases cleanly."""
    dns_data = DnsAnalysis(
        hostname="nonexistent.example.com",
        resolved=False,
        error="NXDOMAIN name does not exist",
        resolution_time_ms=45.0,
    )

    journey = request_journey_service.build(
        url="https://nonexistent.example.com/api",
        method="GET",
        total_duration_ms=45.0,
        dns_analysis=dns_data,
        success=False,
        error_message="DNS resolution failed",
    )

    assert journey.completed is False

    phase_by_name = {p.name: p for p in journey.phases}
    assert phase_by_name["dns"].status == JourneyPhaseStatus.FAILED
    assert phase_by_name["dns"].duration_ms == 45.0
    assert phase_by_name["connection"].status == JourneyPhaseStatus.UNAVAILABLE
    assert phase_by_name["tls"].status == JourneyPhaseStatus.UNAVAILABLE
    assert phase_by_name["http"].status == JourneyPhaseStatus.UNAVAILABLE
    assert phase_by_name["response"].status == JourneyPhaseStatus.NOT_APPLICABLE


def test_http_failure_marks_phases_failed() -> None:
    """Verify HTTP execution failure (e.g. timeout or connection drop)."""
    dns_data = DnsAnalysis(hostname="example.com", resolved=True, resolution_time_ms=10.0)

    journey = request_journey_service.build(
        url="https://example.com/slow",
        method="GET",
        total_duration_ms=5000.0,
        dns_analysis=dns_data,
        success=False,
        error_message="Request timed out",
    )

    assert journey.completed is False
    phase_by_name = {p.name: p for p in journey.phases}
    assert phase_by_name["dns"].status == JourneyPhaseStatus.COMPLETED
    assert phase_by_name["http"].status == JourneyPhaseStatus.FAILED
    assert phase_by_name["http"].duration_ms == 5000.0
    assert phase_by_name["response"].status == JourneyPhaseStatus.FAILED


def test_missing_dns_analysis_fallback() -> None:
    """Verify handling when dns_analysis is None."""
    journey = request_journey_service.build(
        url="http://example.com/api",
        method="GET",
        total_duration_ms=60.0,
        dns_analysis=None,
        success=True,
        status_code=200,
    )

    phase_by_name = {p.name: p for p in journey.phases}
    assert phase_by_name["dns"].status == JourneyPhaseStatus.UNAVAILABLE
    assert phase_by_name["dns"].duration_ms is None


def test_source_attribution() -> None:
    """Verify each phase has the correct source attribution enum."""
    dns_data = DnsAnalysis(hostname="example.com", resolved=True, resolution_time_ms=10.0)
    journey = request_journey_service.build(
        url="https://example.com/test",
        method="GET",
        total_duration_ms=50.0,
        dns_analysis=dns_data,
        success=True,
        status_code=200,
    )

    sources = {p.name: p.source for p in journey.phases}
    assert sources["dns"] == JourneyPhaseSource.DNS_INSPECTOR
    assert sources["connection"] == JourneyPhaseSource.DERIVED
    assert sources["tls"] == JourneyPhaseSource.DERIVED
    assert sources["http"] == JourneyPhaseSource.HTTP_EXECUTION
    assert sources["response"] == JourneyPhaseSource.RESPONSE_INSPECTOR


# ---------------------------------------------------------------------------
# Integration Tests via API Route
# ---------------------------------------------------------------------------


def test_api_integration_successful_request(client: TestClient) -> None:
    """Verify POST /api/requests returns populated request_journey."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code=200,
            headers={"content-type": "application/json"},
            json={"status": "ok"},
        )

    original_transport = request_service.transport
    request_service.transport = httpx.MockTransport(handler)

    try:
        response = client.post(
            "/api/requests",
            json={
                "method": "GET",
                "url": "https://example.com/api/test",
            },
        )
        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        journey = data.get("request_journey")
        assert journey is not None
        assert journey["completed"] is True
        assert isinstance(journey["total_duration_ms"], (int, float))

        phases = journey["phases"]
        assert len(phases) == 5

        # Check DNS phase
        assert phases[0]["name"] == "dns"
        assert phases[0]["status"] == "completed"

        # Check Connection phase
        assert phases[1]["name"] == "connection"
        assert phases[1]["status"] == "unavailable"
        assert phases[1]["duration_ms"] is None

        # Check TLS phase for HTTPS
        assert phases[2]["name"] == "tls"
        assert phases[2]["status"] == "unavailable"
        assert phases[2]["duration_ms"] is None

        # Check HTTP phase
        assert phases[3]["name"] == "http"
        assert phases[3]["status"] == "completed"
        assert phases[3]["duration_ms"] is not None

        # Check Response phase
        assert phases[4]["name"] == "response"
        assert phases[4]["status"] == "completed"
        assert phases[4]["duration_ms"] is None

    finally:
        request_service.transport = original_transport


def test_api_integration_http_scheme_not_applicable_tls(client: TestClient) -> None:
    """Verify plain HTTP request yields not_applicable for TLS phase via API."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, text="hello")

    original_transport = request_service.transport
    request_service.transport = httpx.MockTransport(handler)

    try:
        response = client.post(
            "/api/requests",
            json={
                "method": "GET",
                "url": "http://example.com/test",
            },
        )
        assert response.status_code == 200
        data = response.json()

        journey = data["request_journey"]
        tls_phase = next(p for p in journey["phases"] if p["name"] == "tls")
        assert tls_phase["status"] == "not_applicable"
        assert tls_phase["duration_ms"] is None

    finally:
        request_service.transport = original_transport


def test_api_integration_ssrf_blocked_halts_journey(client: TestClient) -> None:
    """Verify SSRF blocked requests assemble a halted request journey."""
    response = client.post(
        "/api/requests",
        json={
            "method": "GET",
            "url": "http://127.0.0.1:8000/internal",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "SSRF_BLOCKED"

    journey = data.get("request_journey")
    assert journey is not None
    assert journey["completed"] is False
