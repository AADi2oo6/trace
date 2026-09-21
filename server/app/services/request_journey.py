"""TRACE Request Journey Assembly Service.

Constructs a structured, truthful representation of the HTTP request lifecycle.
Adheres strictly to technical honesty principles:
- Independently measured timings (DNS, HTTP round-trip) are reported faithfully.
- Unmeasured timings (TCP connection, TLS handshake) are marked unavailable (duration_ms=None).
- Timings are never fabricated, estimated, or derived by subtraction.
- DNS duration is never added into the HTTP total_duration_ms.
"""

from urllib.parse import urlparse

from app.schemas.request import (
    DnsAnalysis,
    JourneyPhase,
    JourneyPhaseSource,
    JourneyPhaseStatus,
    RequestJourney,
)


class RequestJourneyService:
    """Service that truthfully synthesizes the request lifecycle phases."""

    def build(
        self,
        url: str,
        method: str,
        total_duration_ms: float | None,
        dns_analysis: DnsAnalysis | None = None,
        success: bool = False,
        status_code: int | None = None,
        error_message: str | None = None,
    ) -> RequestJourney:
        """Assemble the complete request journey from inspected diagnostic components.

        Args:
            url: Executed target URL.
            method: Executed HTTP method.
            total_duration_ms: Authoritative measured HTTP request round-trip duration.
            dns_analysis: Structured DNS inspection result, if available.
            success: Whether the HTTP request exchange concluded successfully.
            status_code: HTTP response status code if received.
            error_message: Error explanation if the exchange failed.

        Returns:
            A truthful RequestJourney object with ordered phases and diagnostic observations.
        """
        parsed_url = urlparse(url)
        scheme = (parsed_url.scheme or "http").lower()
        is_https = scheme == "https"
        method_str = method.upper() if method else "GET"

        phases: list[JourneyPhase] = []
        overall_observations: list[str] = []

        # 1. DNS Phase
        dns_phase, dns_ok = self._build_dns_phase(dns_analysis)
        phases.append(dns_phase)

        # 2. Connection Phase (TCP)
        conn_phase = self._build_connection_phase(dns_ok=dns_ok)
        phases.append(conn_phase)

        # 3. TLS Phase
        tls_phase = self._build_tls_phase(is_https=is_https, dns_ok=dns_ok)
        phases.append(tls_phase)

        # 4. HTTP Exchange Phase
        http_phase = self._build_http_phase(
            method=method_str,
            dns_ok=dns_ok,
            success=success,
            duration_ms=total_duration_ms,
            error_message=error_message,
        )
        phases.append(http_phase)

        # 5. Response Phase
        resp_phase = self._build_response_phase(
            dns_ok=dns_ok,
            success=success,
            status_code=status_code,
            error_message=error_message,
        )
        phases.append(resp_phase)

        # Determine overall completion status
        completed = success and dns_ok

        # Build overall journey observations
        if completed:
            if total_duration_ms is not None:
                overall_observations.append(
                    f"Request journey completed successfully in {total_duration_ms:.2f} ms."
                )
            else:
                overall_observations.append("Request journey completed successfully.")
            overall_observations.append(
                "TCP connection and TLS handshake timings are omitted in accordance with technical honesty principles."
            )
        elif not dns_ok:
            err = dns_analysis.error if dns_analysis and dns_analysis.error else (error_message or "DNS lookup failure")
            overall_observations.append(f"Request journey halted during DNS resolution: {err}.")
        else:
            err = error_message or "HTTP exchange failure"
            overall_observations.append(f"Request journey failed during HTTP execution: {err}.")

        return RequestJourney(
            total_duration_ms=total_duration_ms,
            completed=completed,
            phases=phases,
            observations=overall_observations,
        )

    def _build_dns_phase(
        self, dns_analysis: DnsAnalysis | None
    ) -> tuple[JourneyPhase, bool]:
        """Construct the DNS lifecycle phase truthfully from DnsAnalysis."""
        if dns_analysis is None:
            return (
                JourneyPhase(
                    name="dns",
                    status=JourneyPhaseStatus.UNAVAILABLE,
                    duration_ms=None,
                    source=JourneyPhaseSource.DNS_INSPECTOR,
                    observations=["DNS analysis was not performed or not available for this request."],
                ),
                True,  # Default to allowing downstream evaluation if DNS inspector was bypassed
            )

        if dns_analysis.resolved:
            observations: list[str] = []
            if dns_analysis.resolution_time_ms is not None:
                observations.append(
                    f"Resolved hostname '{dns_analysis.hostname}' via DNS in {dns_analysis.resolution_time_ms:.2f} ms."
                )
            else:
                observations.append(f"Resolved hostname '{dns_analysis.hostname}' via DNS.")

            addr_parts: list[str] = []
            if dns_analysis.ipv4_addresses:
                addr_parts.append(f"{len(dns_analysis.ipv4_addresses)} IPv4 ({', '.join(dns_analysis.ipv4_addresses)})")
            if dns_analysis.ipv6_addresses:
                addr_parts.append(f"{len(dns_analysis.ipv6_addresses)} IPv6 ({', '.join(dns_analysis.ipv6_addresses)})")
            if addr_parts:
                observations.append(f"Addresses: {'; '.join(addr_parts)}.")

            return (
                JourneyPhase(
                    name="dns",
                    status=JourneyPhaseStatus.COMPLETED,
                    duration_ms=dns_analysis.resolution_time_ms,
                    source=JourneyPhaseSource.DNS_INSPECTOR,
                    observations=observations,
                ),
                True,
            )

        # DNS failed
        err_msg = dns_analysis.error or "DNS resolution failed"
        return (
            JourneyPhase(
                name="dns",
                status=JourneyPhaseStatus.FAILED,
                duration_ms=dns_analysis.resolution_time_ms,
                source=JourneyPhaseSource.DNS_INSPECTOR,
                observations=[f"DNS resolution failed for hostname '{dns_analysis.hostname}': {err_msg}."],
            ),
            False,
        )

    def _build_connection_phase(self, dns_ok: bool) -> JourneyPhase:
        """Construct the TCP connection phase."""
        if not dns_ok:
            return JourneyPhase(
                name="connection",
                status=JourneyPhaseStatus.UNAVAILABLE,
                duration_ms=None,
                source=JourneyPhaseSource.DERIVED,
                observations=["TCP connection was not initiated because DNS resolution failed."],
            )

        return JourneyPhase(
            name="connection",
            status=JourneyPhaseStatus.UNAVAILABLE,
            duration_ms=None,
            source=JourneyPhaseSource.DERIVED,
            observations=[
                "TCP connection timing is not independently measured by the current HTTP transport.",
                "Phase duration marked unavailable to prevent inaccurate estimation.",
            ],
        )

    def _build_tls_phase(self, is_https: bool, dns_ok: bool) -> JourneyPhase:
        """Construct the TLS handshake phase."""
        if not is_https:
            return JourneyPhase(
                name="tls",
                status=JourneyPhaseStatus.NOT_APPLICABLE,
                duration_ms=None,
                source=JourneyPhaseSource.DERIVED,
                observations=["TLS handshake is not applicable for plain HTTP requests."],
            )

        if not dns_ok:
            return JourneyPhase(
                name="tls",
                status=JourneyPhaseStatus.UNAVAILABLE,
                duration_ms=None,
                source=JourneyPhaseSource.DERIVED,
                observations=["TLS handshake was not initiated because DNS resolution failed."],
            )

        return JourneyPhase(
            name="tls",
            status=JourneyPhaseStatus.UNAVAILABLE,
            duration_ms=None,
            source=JourneyPhaseSource.DERIVED,
            observations=[
                "TLS handshake timing is not independently measured by the current HTTP transport.",
                "Phase duration marked unavailable to prevent inaccurate estimation.",
            ],
        )

    def _build_http_phase(
        self,
        method: str,
        dns_ok: bool,
        success: bool,
        duration_ms: float | None,
        error_message: str | None,
    ) -> JourneyPhase:
        """Construct the HTTP request/response exchange phase."""
        if not dns_ok:
            return JourneyPhase(
                name="http",
                status=JourneyPhaseStatus.UNAVAILABLE,
                duration_ms=None,
                source=JourneyPhaseSource.HTTP_EXECUTION,
                observations=["HTTP request was not dispatched because DNS resolution failed."],
            )

        if success:
            obs = (
                [f"HTTP {method} exchange completed in {duration_ms:.2f} ms."]
                if duration_ms is not None
                else [f"HTTP {method} exchange completed."]
            )
            return JourneyPhase(
                name="http",
                status=JourneyPhaseStatus.COMPLETED,
                duration_ms=duration_ms,
                source=JourneyPhaseSource.HTTP_EXECUTION,
                observations=obs,
            )

        err = error_message or "HTTP exchange failed"
        return JourneyPhase(
            name="http",
            status=JourneyPhaseStatus.FAILED,
            duration_ms=duration_ms,
            source=JourneyPhaseSource.HTTP_EXECUTION,
            observations=[f"HTTP {method} request failed: {err}."],
        )

    def _build_response_phase(
        self,
        dns_ok: bool,
        success: bool,
        status_code: int | None,
        error_message: str | None,
    ) -> JourneyPhase:
        """Construct the Response phase."""
        if not dns_ok:
            return JourneyPhase(
                name="response",
                status=JourneyPhaseStatus.NOT_APPLICABLE,
                duration_ms=None,
                source=JourneyPhaseSource.RESPONSE_INSPECTOR,
                observations=["No HTTP response received due to earlier DNS resolution failure."],
            )

        if success:
            obs = (
                [f"Received HTTP {status_code} response."]
                if status_code is not None
                else ["Received HTTP response."]
            )
            return JourneyPhase(
                name="response",
                status=JourneyPhaseStatus.COMPLETED,
                duration_ms=None,
                source=JourneyPhaseSource.RESPONSE_INSPECTOR,
                observations=obs,
            )

        err = error_message or "Request failed"
        return JourneyPhase(
            name="response",
            status=JourneyPhaseStatus.FAILED,
            duration_ms=None,
            source=JourneyPhaseSource.RESPONSE_INSPECTOR,
            observations=[f"No valid HTTP response received: {err}."],
        )


request_journey_service = RequestJourneyService()
