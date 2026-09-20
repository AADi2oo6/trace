"""TRACE Response Inspector Service — HTTP Response Normalization and Inspection."""

import http.client
import json
from dataclasses import dataclass

from app.schemas.request import BodyType, StatusCategory

# Media types typically associated with binary non-text content
BINARY_MEDIA_SUBSTRINGS = (
    "image/",
    "video/",
    "audio/",
    "application/octet-stream",
    "application/pdf",
    "application/zip",
    "application/gzip",
    "application/x-tar",
    "application/wasm",
)


@dataclass(frozen=True)
class InspectedResponse:
    """Normalized response attributes extracted by the Response Inspector."""

    status_code: int
    status_text: str
    status_category: StatusCategory
    headers: dict[str, str]
    content_type: str | None
    body_type: BodyType
    body: str | None
    body_size: int


class ResponseInspector:
    """Service responsible for normalizing and inspecting received HTTP response attributes."""

    @classmethod
    def inspect(
        cls,
        status_code: int,
        headers: dict[str, str],
        raw_bytes: bytes,
    ) -> InspectedResponse:
        """Inspect and categorize raw HTTP response data into a clean, normalized structure."""
        # 1. Normalize headers (case-insensitive keys for easy lookup, clean string values)
        normalized_headers = {k.lower(): str(v) for k, v in headers.items()}
        raw_content_type = normalized_headers.get("content-type")
        content_type = raw_content_type.split(";")[0].strip() if raw_content_type else None

        # 2. Categorize Status Code and Reason Phrase
        status_category = cls._categorize_status(status_code)
        status_text = http.client.responses.get(status_code, "Unknown Status")

        # 3. Analyze Body and detect BodyType
        body_size = len(raw_bytes)
        body_type, body_content = cls._inspect_body(raw_bytes, normalized_headers, content_type)

        return InspectedResponse(
            status_code=status_code,
            status_text=status_text,
            status_category=status_category,
            headers=normalized_headers,
            content_type=raw_content_type,
            body_type=body_type,
            body=body_content,
            body_size=body_size,
        )

    @staticmethod
    def _categorize_status(code: int) -> StatusCategory:
        """Categorize an HTTP status code into standard RFC ranges."""
        if 100 <= code < 200:
            return StatusCategory.INFORMATIONAL
        if 200 <= code < 300:
            return StatusCategory.SUCCESS
        if 300 <= code < 400:
            return StatusCategory.REDIRECTION
        if 400 <= code < 500:
            return StatusCategory.CLIENT_ERROR
        return StatusCategory.SERVER_ERROR

    @classmethod
    def _inspect_body(
        cls,
        raw_bytes: bytes,
        headers: dict[str, str],
        content_type: str | None,
    ) -> tuple[BodyType, str | None]:
        """Detect body format, decode safely, and return (BodyType, formatted_body)."""
        if len(raw_bytes) == 0:
            return BodyType.EMPTY, None

        # Detect binary payloads
        ct_lower = (content_type or "").lower()
        is_binary = b"\x00" in raw_bytes[:1024] or any(
            sub in ct_lower for sub in BINARY_MEDIA_SUBSTRINGS
        )

        if is_binary:
            return BodyType.BINARY, None

        # Attempt UTF-8 decoding with fallback replacement
        decoded = raw_bytes.decode("utf-8", errors="replace")
        stripped = decoded.strip()

        # Check for HTML
        if "text/html" in ct_lower or stripped.lower().startswith(("<!doctype html", "<html")):
            return BodyType.HTML, decoded

        # Check for JSON
        is_json_mime = "json" in ct_lower
        is_json_structure = (
            (stripped.startswith("{") and stripped.endswith("}"))
            or (stripped.startswith("[") and stripped.endswith("]"))
        )

        if is_json_mime or is_json_structure:
            try:
                parsed = json.loads(decoded)
                pretty_json = json.dumps(parsed, indent=2)
                return BodyType.JSON, pretty_json
            except Exception:
                # If content-type declared json but syntax is invalid, fallback to text safely
                return BodyType.TEXT, decoded

        # Fallback to plain text
        return BodyType.TEXT, decoded


response_inspector = ResponseInspector()
