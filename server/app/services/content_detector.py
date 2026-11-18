"""TRACE Content Detector Service — Content Classification and Format Intelligence."""

import os
import re
from urllib.parse import parse_qs, unquote, urlparse

from app.schemas.request import ContentCategory, ContentMetadata, YouTubeMetadata

# MIME type mapping table
MIME_TO_CATEGORY: dict[str, tuple[ContentCategory, str, bool, bool]] = {
    # MIME -> (Category, Extension, is_binary, is_preview_supported)
    # HTML
    "text/html": (ContentCategory.HTML, ".html", False, True),
    "application/xhtml+xml": (ContentCategory.HTML, ".xhtml", False, True),
    # JSON
    "application/json": (ContentCategory.JSON, ".json", False, True),
    "text/json": (ContentCategory.JSON, ".json", False, True),
    "application/ld+json": (ContentCategory.JSON, ".jsonld", False, True),
    "application/problem+json": (ContentCategory.JSON, ".json", False, True),
    # XML
    "application/xml": (ContentCategory.XML, ".xml", False, True),
    "text/xml": (ContentCategory.XML, ".xml", False, True),
    "application/rss+xml": (ContentCategory.XML, ".xml", False, True),
    "application/atom+xml": (ContentCategory.XML, ".xml", False, True),
    "image/svg+xml": (ContentCategory.IMAGE, ".svg", False, True),
    # Images
    "image/png": (ContentCategory.IMAGE, ".png", True, True),
    "image/jpeg": (ContentCategory.IMAGE, ".jpg", True, True),
    "image/jpg": (ContentCategory.IMAGE, ".jpg", True, True),
    "image/gif": (ContentCategory.IMAGE, ".gif", True, True),
    "image/webp": (ContentCategory.IMAGE, ".webp", True, True),
    "image/x-icon": (ContentCategory.IMAGE, ".ico", True, True),
    "image/vnd.microsoft.icon": (ContentCategory.IMAGE, ".ico", True, True),
    "image/bmp": (ContentCategory.IMAGE, ".bmp", True, True),
    "image/avif": (ContentCategory.IMAGE, ".avif", True, True),
    # Video
    "video/mp4": (ContentCategory.VIDEO, ".mp4", True, True),
    "video/webm": (ContentCategory.VIDEO, ".webm", True, True),
    "video/ogg": (ContentCategory.VIDEO, ".ogv", True, True),
    "video/quicktime": (ContentCategory.VIDEO, ".mov", True, True),
    # Audio
    "audio/mpeg": (ContentCategory.AUDIO, ".mp3", True, True),
    "audio/mp3": (ContentCategory.AUDIO, ".mp3", True, True),
    "audio/wav": (ContentCategory.AUDIO, ".wav", True, True),
    "audio/x-wav": (ContentCategory.AUDIO, ".wav", True, True),
    "audio/ogg": (ContentCategory.AUDIO, ".ogg", True, True),
    "audio/aac": (ContentCategory.AUDIO, ".aac", True, True),
    "audio/flac": (ContentCategory.AUDIO, ".flac", True, True),
    "audio/webm": (ContentCategory.AUDIO, ".weba", True, True),
    # PDF
    "application/pdf": (ContentCategory.PDF, ".pdf", True, True),
    # Plain text
    "text/plain": (ContentCategory.TEXT, ".txt", False, True),
    "text/markdown": (ContentCategory.TEXT, ".md", False, True),
    "text/csv": (ContentCategory.TEXT, ".csv", False, True),
    "text/css": (ContentCategory.TEXT, ".css", False, True),
    "text/javascript": (ContentCategory.TEXT, ".js", False, True),
    "application/javascript": (ContentCategory.TEXT, ".js", False, True),
    # Binary archives
    "application/zip": (ContentCategory.BINARY, ".zip", True, False),
    "application/gzip": (ContentCategory.BINARY, ".gz", True, False),
    "application/x-tar": (ContentCategory.BINARY, ".tar", True, False),
    "application/octet-stream": (ContentCategory.BINARY, ".bin", True, False),
}

WINDOWS_RESERVED_NAMES = {
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
}

YOUTUBE_VIDEO_ID_REGEX = re.compile(r"^[a-zA-Z0-9_-]{11}$")


class ContentDetector:
    """Intelligent classification and metadata extraction for response payloads and URLs."""

    @classmethod
    def detect(
        cls,
        raw_bytes: bytes,
        headers: dict[str, str],
        url: str,
        artifact_id: str | None = None,
    ) -> ContentMetadata:
        """Classify content from URL, headers, and magic byte sniffing."""
        # 1. Check for YouTube URL pattern first
        youtube_meta = cls.detect_youtube(url)
        if youtube_meta:
            filename = cls.sanitize_filename(f"youtube_{youtube_meta.video_id}.html")
            return ContentMetadata(
                category=ContentCategory.YOUTUBE,
                mime_type="text/html",
                extension=".html",
                filename=filename,
                file_size=len(raw_bytes),
                is_binary=False,
                is_preview_supported=True,
                preview_limitation="Direct YouTube video stream extraction and downloading is restricted for user security and platform terms. TRACE provides the official sandboxed YouTube embed and public metadata.",
                encoding="utf-8",
                artifact_id=artifact_id,
                youtube_metadata=youtube_meta,
            )

        # 2. Extract header Content-Type & charset
        raw_content_type = headers.get("content-type") or ""
        mime_type = ""
        encoding = None

        if raw_content_type:
            parts = raw_content_type.split(";")
            mime_type = parts[0].strip().lower()
            for part in parts[1:]:
                part_strip = part.strip()
                if part_strip.lower().startswith("charset="):
                    encoding = part_strip.split("=", 1)[1].strip().strip('"').strip("'")

        # 3. Magic bytes / body inspection fallback
        sniffed_category, sniffed_mime, sniffed_ext, sniffed_binary = cls.sniff_content(raw_bytes)

        # Determine authoritative classification
        if mime_type in MIME_TO_CATEGORY and mime_type != "application/octet-stream":
            category, ext, is_binary, is_preview = MIME_TO_CATEGORY[mime_type]
            final_mime = mime_type
            final_ext = ext
        elif sniffed_mime:
            final_mime = sniffed_mime
            category = sniffed_category
            final_ext = sniffed_ext
            is_binary = sniffed_binary
            is_preview = category in (
                ContentCategory.HTML,
                ContentCategory.JSON,
                ContentCategory.XML,
                ContentCategory.IMAGE,
                ContentCategory.VIDEO,
                ContentCategory.AUDIO,
                ContentCategory.PDF,
                ContentCategory.TEXT,
            )
        elif mime_type == "application/octet-stream":
            category = ContentCategory.BINARY
            final_mime = "application/octet-stream"
            final_ext = ".bin"
            is_binary = True
            is_preview = False
        else:
            # Default fallback for unknown text or empty
            if b"\x00" in raw_bytes[:1024]:
                category = ContentCategory.BINARY
                final_mime = "application/octet-stream"
                final_ext = ".bin"
                is_binary = True
                is_preview = False
            else:
                category = ContentCategory.TEXT
                final_mime = "text/plain"
                final_ext = ".txt"
                is_binary = False
                is_preview = True

        # 4. Extract and sanitize filename
        filename = cls.extract_filename(headers, url, final_ext)

        return ContentMetadata(
            category=category,
            mime_type=final_mime,
            extension=final_ext,
            filename=filename,
            file_size=len(raw_bytes),
            is_binary=is_binary,
            is_preview_supported=is_preview,
            encoding=encoding or ("utf-8" if not is_binary else None),
            artifact_id=artifact_id,
            youtube_metadata=None,
        )

    @classmethod
    def sniff_content(cls, raw_bytes: bytes) -> tuple[ContentCategory, str, str, bool]:
        """Sniff content type from magic bytes and payload structure."""
        if not raw_bytes:
            return ContentCategory.TEXT, "text/plain", ".txt", False

        # Magic Bytes checks
        # PNG
        if raw_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            return ContentCategory.IMAGE, "image/png", ".png", True

        # JPEG
        if raw_bytes.startswith(b"\xff\xd8\xff"):
            return ContentCategory.IMAGE, "image/jpeg", ".jpg", True

        # GIF
        if raw_bytes.startswith(b"GIF87a") or raw_bytes.startswith(b"GIF89a"):
            return ContentCategory.IMAGE, "image/gif", ".gif", True

        # WebP
        if len(raw_bytes) >= 12 and raw_bytes.startswith(b"RIFF") and raw_bytes[8:12] == b"WEBP":
            return ContentCategory.IMAGE, "image/webp", ".webp", True

        # PDF
        if raw_bytes.startswith(b"%PDF"):
            return ContentCategory.PDF, "application/pdf", ".pdf", True

        # WAV
        if len(raw_bytes) >= 12 and raw_bytes.startswith(b"RIFF") and raw_bytes[8:12] == b"WAVE":
            return ContentCategory.AUDIO, "audio/wav", ".wav", True

        # OGG
        if raw_bytes.startswith(b"OggS"):
            return ContentCategory.AUDIO, "audio/ogg", ".ogg", True

        # MP3 (ID3 tag or sync frames)
        if raw_bytes.startswith(b"ID3") or (len(raw_bytes) > 2 and raw_bytes[:2] in (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2")):
            return ContentCategory.AUDIO, "audio/mpeg", ".mp3", True

        # MP4 (ftyp box in first 16 bytes)
        if len(raw_bytes) >= 12 and raw_bytes[4:8] == b"ftyp":
            return ContentCategory.VIDEO, "video/mp4", ".mp4", True

        # ZIP
        if raw_bytes.startswith((b"PK\x03\x04", b"PK\x05\x06")):
            return ContentCategory.BINARY, "application/zip", ".zip", True

        # GZIP
        if raw_bytes.startswith(b"\x1f\x8b"):
            return ContentCategory.BINARY, "application/gzip", ".gz", True

        # Text Inspection (UTF-8 safe check)
        try:
            sample = raw_bytes[:4096].decode("utf-8", errors="replace").strip()
            sample_lower = sample.lower()

            # HTML
            if sample_lower.startswith(("<!doctype html", "<html")):
                return ContentCategory.HTML, "text/html", ".html", False

            # SVG
            if "<svg" in sample_lower:
                return ContentCategory.IMAGE, "image/svg+xml", ".svg", False

            # XML
            if sample_lower.startswith("<?xml") or (sample_lower.startswith("<") and ">" in sample_lower and "</" in sample_lower):
                return ContentCategory.XML, "application/xml", ".xml", False

            # JSON
            if (sample.startswith("{") and sample.endswith("}")) or (sample.startswith("[") and sample.endswith("]")):
                return ContentCategory.JSON, "application/json", ".json", False

            # Check for null bytes indicating binary
            if b"\x00" in raw_bytes[:1024]:
                return ContentCategory.BINARY, "application/octet-stream", ".bin", True

            return ContentCategory.TEXT, "text/plain", ".txt", False
        except Exception:
            return ContentCategory.BINARY, "application/octet-stream", ".bin", True

    @classmethod
    def extract_filename(cls, headers: dict[str, str], url: str, default_ext: str) -> str:
        """Extract and sanitize filename from Content-Disposition header or target URL."""
        # Check Content-Disposition header
        content_disposition = headers.get("content-disposition", "")
        if content_disposition:
            # Handle filename*=UTF-8''... (RFC 5987)
            match_star = re.search(r"filename\*\s*=\s*(?:[A-Za-z0-9_-]+'')?([^;]+)", content_disposition, re.IGNORECASE)
            if match_star:
                candidate = unquote(match_star.group(1).strip().strip('"').strip("'"))
                sanitized = cls.sanitize_filename(candidate)
                if sanitized:
                    return sanitized

            # Handle standard filename="..."
            match_normal = re.search(r'filename\s*=\s*(?:"([^"]+)"|([^;\s]+))', content_disposition, re.IGNORECASE)
            if match_normal:
                candidate = match_normal.group(1) or match_normal.group(2)
                sanitized = cls.sanitize_filename(candidate)
                if sanitized:
                    return sanitized

        # Extract from URL path
        try:
            parsed = urlparse(url)
            path = unquote(parsed.path)
            basename = os.path.basename(path.rstrip("/"))
            if basename and "." in basename:
                sanitized = cls.sanitize_filename(basename)
                if sanitized:
                    return sanitized
            elif basename:
                sanitized = cls.sanitize_filename(f"{basename}{default_ext}")
                if sanitized:
                    return sanitized
        except Exception:
            pass

        # Safe fallback default
        return f"response{default_ext}"

    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """Sanitize filename to prevent directory traversal and remove dangerous characters."""
        if not filename:
            return ""

        # Remove path separators
        clean = os.path.basename(filename.replace("\\", "/"))

        # Strip null bytes and non-printable chars
        clean = re.sub(r"[\x00-\x1f\x7f]", "", clean)

        # Replace invalid filename characters with underscore
        clean = re.sub(r'[<>:"/\\|?*]', "_", clean)

        # Remove leading/trailing dots and spaces
        clean = clean.strip(". ")

        # Guard against Windows reserved names
        name_root = clean.split(".")[0].upper()
        if name_root in WINDOWS_RESERVED_NAMES:
            clean = f"safe_{clean}"

        # Truncate length if overly long
        if len(clean) > 200:
            parts = clean.rsplit(".", 1)
            if len(parts) == 2:
                clean = parts[0][:190] + "." + parts[1]
            else:
                clean = clean[:200]

        return clean

    @classmethod
    def detect_youtube(cls, url: str) -> YouTubeMetadata | None:
        """Detect YouTube URLs and extract video ID and official embed details."""
        try:
            parsed = urlparse(url)
            host = (parsed.hostname or "").lower().rstrip(".")

            video_id: str | None = None

            # Pattern: youtube.com / m.youtube.com / www.youtube.com
            if host in ("youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"):
                path = parsed.path
                if path == "/watch":
                    query_params = parse_qs(parsed.query)
                    ids = query_params.get("v")
                    if ids and ids[0]:
                        video_id = ids[0]
                elif path.startswith("/embed/"):
                    video_id = path.split("/embed/")[1].split("/")[0].split("?")[0]
                elif path.startswith("/shorts/"):
                    video_id = path.split("/shorts/")[1].split("/")[0].split("?")[0]
                elif path.startswith("/v/"):
                    video_id = path.split("/v/")[1].split("/")[0].split("?")[0]

            # Pattern: youtu.be/ID
            elif host in ("youtu.be", "www.youtu.be"):
                path_parts = parsed.path.strip("/").split("/")
                if path_parts and path_parts[0]:
                    video_id = path_parts[0]

            if video_id and YOUTUBE_VIDEO_ID_REGEX.match(video_id):
                return YouTubeMetadata(
                    video_id=video_id,
                    embed_url=f"https://www.youtube-nocookie.com/embed/{video_id}",
                    thumbnail_url=f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                    watch_url=f"https://www.youtube.com/watch?v={video_id}",
                    title=f"YouTube Video ({video_id})",
                )
        except Exception:
            pass

        return None


content_detector = ContentDetector()
