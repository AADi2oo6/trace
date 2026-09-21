"""DNS Inspector service for resolving hostnames and inspecting IPv4/IPv6 records and resolution timing."""

import asyncio
import ipaddress
import time
from typing import Any
from urllib.parse import urlparse

import dns.asyncresolver
import dns.exception
import dns.resolver

from app.schemas.request import DnsAnalysis


class DnsInspector:
    """Service providing asynchronous DNS resolution, address categorization, and lookup diagnostics."""

    def __init__(self, resolver: dns.asyncresolver.Resolver | None = None) -> None:
        self.resolver = resolver or dns.asyncresolver.Resolver()

    @staticmethod
    def extract_hostname(host_or_url: str) -> str:
        """Extract clean hostname from URL or raw hostname string without port, path, or query params."""
        cleaned = host_or_url.strip()
        if "://" in cleaned:
            parsed = urlparse(cleaned)
            hostname = parsed.hostname or ""
        elif "/" in cleaned or "?" in cleaned or "#" in cleaned:
            parsed = urlparse(f"http://{cleaned}")
            hostname = parsed.hostname or ""
        else:
            # Handle potential port e.g. "example.com:8080"
            if ":" in cleaned and not cleaned.startswith("[") and cleaned.count(":") == 1:
                hostname = cleaned.split(":")[0]
            else:
                hostname = cleaned

        return hostname.strip("[]").strip().lower()

    async def inspect(self, host_or_url: str) -> DnsAnalysis:
        """Perform asynchronous DNS resolution for a hostname or URL.

        Returns structured DnsAnalysis with separated IPv4 and IPv6 records and timing.
        """
        hostname = self.extract_hostname(host_or_url)
        if not hostname:
            return DnsAnalysis(
                hostname=host_or_url,
                resolved=False,
                ipv4_addresses=[],
                ipv6_addresses=[],
                resolution_time_ms=0.0,
                error="Invalid or empty hostname.",
                observations=["Target does not specify a valid hostname for DNS resolution."],
            )

        # Fast path: Check if target is already an IP address literal
        try:
            ip_obj = ipaddress.ip_address(hostname)
            is_ipv4 = isinstance(ip_obj, ipaddress.IPv4Address)
            return DnsAnalysis(
                hostname=hostname,
                resolved=True,
                ipv4_addresses=[hostname] if is_ipv4 else [],
                ipv6_addresses=[hostname] if not is_ipv4 else [],
                resolution_time_ms=0.0,
                error=None,
                observations=[f"Target '{hostname}' is an IP literal; DNS resolution was skipped."],
            )
        except ValueError:
            # Not an IP literal; proceed to DNS resolution
            pass

        start_time = time.perf_counter()
        ipv4_list: list[str] = []
        ipv6_list: list[str] = []
        errors: list[str] = []

        # Query IPv4 (A) records
        try:
            answer_a = await self.resolver.resolve(hostname, "A")
            for record in answer_a:
                addr = getattr(record, "address", str(record)).strip()
                if addr:
                    ipv4_list.append(addr)
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN) as exc:
            if isinstance(exc, dns.resolver.NXDOMAIN):
                errors.append("Domain does not exist (NXDOMAIN).")
        except dns.resolver.Timeout:
            errors.append("DNS query timed out for IPv4 (A).")
        except dns.exception.DNSException as exc:
            errors.append(f"DNS IPv4 resolution error: {exc.__class__.__name__}")
        except Exception as exc:
            errors.append(f"Unexpected error resolving IPv4: {exc.__class__.__name__}")

        # Query IPv6 (AAAA) records
        try:
            answer_aaaa = await self.resolver.resolve(hostname, "AAAA")
            for record in answer_aaaa:
                addr = getattr(record, "address", str(record)).strip()
                if addr:
                    ipv6_list.append(addr)
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN) as exc:
            if isinstance(exc, dns.resolver.NXDOMAIN) and not errors:
                errors.append("Domain does not exist (NXDOMAIN).")
        except dns.resolver.Timeout:
            errors.append("DNS query timed out for IPv6 (AAAA).")
        except dns.exception.DNSException as exc:
            errors.append(f"DNS IPv6 resolution error: {exc.__class__.__name__}")
        except Exception as exc:
            errors.append(f"Unexpected error resolving IPv6: {exc.__class__.__name__}")

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Deduplicate addresses while preserving order
        dedup_ipv4 = list(dict.fromkeys(ipv4_list))
        dedup_ipv6 = list(dict.fromkeys(ipv6_list))

        resolved = len(dedup_ipv4) > 0 or len(dedup_ipv6) > 0
        observations: list[str] = []

        if resolved:
            error_message = None
            observations.append("Hostname resolved successfully.")
            if dedup_ipv4:
                observations.append(
                    f"Resolved {len(dedup_ipv4)} IPv4 address(es): {', '.join(dedup_ipv4)}."
                )
            if dedup_ipv6:
                observations.append(
                    f"Resolved {len(dedup_ipv6)} IPv6 address(es): {', '.join(dedup_ipv6)}."
                )
        else:
            error_message = " | ".join(errors) if errors else f"No A or AAAA records found for host '{hostname}'."
            observations.append(f"DNS resolution failed for hostname '{hostname}': {error_message}")

        return DnsAnalysis(
            hostname=hostname,
            resolved=resolved,
            ipv4_addresses=dedup_ipv4,
            ipv6_addresses=dedup_ipv6,
            resolution_time_ms=duration_ms,
            error=error_message,
            observations=observations,
        )


dns_inspector = DnsInspector()
