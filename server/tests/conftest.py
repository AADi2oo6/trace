"""Shared pytest fixtures for TRACE test suite."""

import socket
from typing import Any
import pytest

MOCK_PUBLIC_IP = "93.184.216.34"


@pytest.fixture(autouse=True)
def mock_dns_for_test_domains(monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock socket.getaddrinfo so tests do not rely on live external DNS resolution."""
    real_getaddrinfo = socket.getaddrinfo

    def patched_getaddrinfo(host: str, port: Any, *args: Any, **kwargs: Any) -> Any:
        if "mock-api" in host or "example.com" in host or "target.test" in host:
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (MOCK_PUBLIC_IP, port or 0))]
        return real_getaddrinfo(host, port, *args, **kwargs)

    monkeypatch.setattr(socket, "getaddrinfo", patched_getaddrinfo)
