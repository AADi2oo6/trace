"""TRACE Secret Sanitization & Redaction Utility.

Guarantees that sensitive authentication credentials, tokens, session cookies,
and API keys are NEVER persisted to the SQLite database or exposed in history APIs.
"""

from typing import Any

# Header names that must always be redacted (case-insensitive)
SENSITIVE_HEADERS = {
    "authorization",
    "proxy-authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "x-auth-token",
    "api-key",
    "apikey",
    "access-token",
    "secret",
}

# Redaction placeholder value
REDACTED_VALUE = "[REDACTED]"


def sanitize_headers(headers: dict[str, str] | None) -> dict[str, str] | None:
    """Return a new headers dict with sensitive headers replaced by REDACTED_VALUE."""
    if not headers:
        return headers

    sanitized: dict[str, str] = {}
    for key, value in headers.items():
        if key.lower().strip() in SENSITIVE_HEADERS:
            sanitized[key] = REDACTED_VALUE
        else:
            sanitized[key] = value

    return sanitized


def sanitize_header_analysis(header_items: list[dict[str, Any]] | None) -> list[dict[str, Any]] | None:
    """Sanitize any sensitive values inside structured HeaderAnalysisItem records."""
    if not header_items:
        return header_items

    sanitized_items = []
    for item in header_items:
        item_copy = dict(item)
        name = item_copy.get("name", "")
        if name.lower().strip() in SENSITIVE_HEADERS:
            item_copy["value"] = REDACTED_VALUE
        sanitized_items.append(item_copy)

    return sanitized_items
