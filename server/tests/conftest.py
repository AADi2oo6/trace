"""Shared pytest fixtures for TRACE test suite."""

import socket
from typing import Any
import dns.asyncresolver
import dns.resolver
import pytest

MOCK_PUBLIC_IP = "93.184.216.34"


class MockDnsRecord:
    """Mock dnspython record returned by patched async resolver."""

    def __init__(self, address: str) -> None:
        self.address = address

    def to_text(self) -> str:
        return self.address

    def __str__(self) -> str:
        return self.address


@pytest.fixture(autouse=True)
def mock_dns_for_test_domains(monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock socket.getaddrinfo and dnspython async resolver so tests run 100% offline."""
    # 1. Patch socket.getaddrinfo for security.py
    real_getaddrinfo = socket.getaddrinfo

    def patched_getaddrinfo(host: str, port: Any, *args: Any, **kwargs: Any) -> Any:
        if "mock-api" in host or "example.com" in host or "target.test" in host:
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (MOCK_PUBLIC_IP, port or 0))]
        return real_getaddrinfo(host, port, *args, **kwargs)

    monkeypatch.setattr(socket, "getaddrinfo", patched_getaddrinfo)

    # 2. Patch dns.asyncresolver.Resolver.resolve for dns_inspector.py
    real_async_resolve = dns.asyncresolver.Resolver.resolve

    async def patched_async_resolve(self: Any, qname: Any, rdtype: Any = "A", *args: Any, **kwargs: Any) -> Any:
        qname_str = str(qname).lower()
        if any(d in qname_str for d in ("mock-api", "example.com", "target.test")):
            rdtype_str = str(rdtype).upper()
            if rdtype_str in ("A", "1"):
                return [MockDnsRecord(MOCK_PUBLIC_IP)]
            elif rdtype_str in ("AAAA", "28"):
                raise dns.resolver.NoAnswer()
        return await real_async_resolve(self, qname, rdtype, *args, **kwargs)

    monkeypatch.setattr(dns.asyncresolver.Resolver, "resolve", patched_async_resolve)
