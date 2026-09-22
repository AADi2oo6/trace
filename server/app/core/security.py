"""TRACE Security and SSRF Protection Module."""

import ipaddress
import socket
from urllib.parse import urlparse

from app.core.config import settings
from app.core.errors import ErrorCode


class SecurityValidationError(Exception):
    """Base security validation error."""

    def __init__(self, code: ErrorCode, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class SSRFBlockedError(SecurityValidationError):
    """Raised when a request targets a private, loopback, or reserved destination."""

    def __init__(self, message: str = "Access to private, local, or reserved network addresses is blocked.") -> None:
        super().__init__(ErrorCode.SSRF_BLOCKED, message)


class InvalidURLSecurityError(SecurityValidationError):
    """Raised when a URL has an invalid scheme or malformed structure."""

    def __init__(self, message: str = "Target URL is invalid or uses an unsupported scheme.") -> None:
        super().__init__(ErrorCode.INVALID_URL, message)


class DNSLookupError(SecurityValidationError):
    """Raised when host resolution fails during security checks."""

    def __init__(self, message: str = "Host name could not be resolved.") -> None:
        super().__init__(ErrorCode.DNS_ERROR, message)


# Specific networks to block in addition to standard ipaddress properties
CARRIER_GRADE_NAT = ipaddress.ip_network("100.64.0.0/10")
CLOUD_METADATA_IP = ipaddress.ip_address("169.254.169.254")
NAT64_PREFIX = ipaddress.ip_network("64:ff9b::/96")

BLOCKED_HOSTNAME_SUFFIXES = (
    "localhost",
    ".localhost",
    ".local",
    ".internal",
    ".lan",
    ".home",
    ".corp",
)


def is_ip_blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Check if an IP address belongs to loopback, private, link-local, or reserved ranges."""
    # Handle IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        ip = ip.ipv4_mapped
    # Handle RFC 6052 NAT64 well-known prefix addresses (e.g. 64:ff9b::9f59:8c7a)
    elif isinstance(ip, ipaddress.IPv6Address) and ip in NAT64_PREFIX:
        ip = ipaddress.IPv4Address(ip.packed[-4:])

    if (
        ip.is_loopback
        or ip.is_private
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    ):
        return True

    if isinstance(ip, ipaddress.IPv4Address):
        if ip in CARRIER_GRADE_NAT or ip == CLOUD_METADATA_IP:
            return True

    return False


def validate_url_for_ssrf(url: str) -> str:
    """Validate that a URL uses an allowed scheme and does not target private or local destinations.

    Returns the cleaned URL if safe, or raises SecurityValidationError.
    """
    if not url or not isinstance(url, str):
        raise InvalidURLSecurityError("URL cannot be empty.")

    cleaned_url = url.strip()
    parsed = urlparse(cleaned_url)

    # 1. Validate Scheme
    if not parsed.scheme or parsed.scheme.lower() not in settings.allowed_schemes:
        allowed = ", ".join(settings.allowed_schemes)
        raise InvalidURLSecurityError(f"Unsupported scheme '{parsed.scheme}'. Only {allowed} are allowed.")

    # 2. Validate Hostname existence
    hostname = parsed.hostname
    if not hostname:
        raise InvalidURLSecurityError("Target URL must contain a valid hostname.")

    hostname_lower = hostname.lower().strip("[]")

    # 3. Check blocked hostnames
    if hostname_lower in BLOCKED_HOSTNAME_SUFFIXES or any(
        hostname_lower.endswith(suffix) for suffix in BLOCKED_HOSTNAME_SUFFIXES
    ):
        raise SSRFBlockedError(f"Access to local or internal domain '{hostname}' is blocked.")

    # 4. Check if hostname is an IP address literal
    try:
        ip = ipaddress.ip_address(hostname_lower)
        if is_ip_blocked(ip):
            raise SSRFBlockedError(f"Access to private/reserved IP address '{ip}' is blocked.")
        return cleaned_url
    except ValueError:
        # Hostname is a domain name, not an IP literal
        pass

    # 5. Resolve hostname to detect DNS-based private targets
    try:
        addr_info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise DNSLookupError(f"Host '{hostname}' could not be resolved.") from exc

    if not addr_info:
        raise DNSLookupError(f"No IP addresses resolved for host '{hostname}'.")

    for family, _, _, _, sockaddr in addr_info:
        ip_str = sockaddr[0]
        try:
            resolved_ip = ipaddress.ip_address(ip_str)
            if is_ip_blocked(resolved_ip):
                raise SSRFBlockedError(
                    f"Host '{hostname}' resolved to private/reserved address '{resolved_ip}', which is blocked."
                )
        except ValueError:
            continue

    return cleaned_url
