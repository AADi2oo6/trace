"""TRACE Artifact Storage & Management Service."""

import io
import json
import logging
import os
import shutil
import time
import uuid
import zipfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.schemas.request import ContentMetadata

logger = logging.getLogger("trace.artifact_service")


@dataclass
class ArtifactRecord:
    """Metadata record for a stored response payload artifact."""

    artifact_id: str
    request_id: str
    created_at: float
    url: str
    method: str
    status_code: int
    filename: str
    content_type: str
    file_size: int
    headers: dict[str, str]
    category: str


class ArtifactService:
    """Service managing raw response artifact storage, streaming, and zip export."""

    def __init__(self, storage_dir: str | None = None) -> None:
        self.storage_dir = Path(storage_dir or settings.artifact_storage_dir)
        self._memory_cache: dict[str, tuple[bytes, ArtifactRecord]] = {}
        self._ensure_storage_dir()

    def _ensure_storage_dir(self) -> None:
        """Create storage directory if it does not exist."""
        try:
            self.storage_dir.mkdir(parents=True, exist_ok=True)
        except Exception as exc:
            logger.warning("Could not create artifact storage directory %s: %s", self.storage_dir, exc)

    def save_artifact(
        self,
        request_id: str,
        raw_bytes: bytes,
        url: str,
        method: str,
        status_code: int,
        headers: dict[str, str],
        content_metadata: ContentMetadata,
    ) -> str:
        """Persist a response payload artifact to memory and disk, returning unique artifact_id."""
        self.cleanup_expired()

        artifact_id = f"art_{uuid.uuid4().hex[:16]}"
        now = time.time()

        record = ArtifactRecord(
            artifact_id=artifact_id,
            request_id=request_id,
            created_at=now,
            url=url,
            method=method,
            status_code=status_code,
            filename=content_metadata.filename,
            content_type=content_metadata.mime_type,
            file_size=len(raw_bytes),
            headers=headers,
            category=content_metadata.category.value,
        )

        # Store in fast memory cache (bounded)
        if len(self._memory_cache) > settings.artifact_max_count:
            # Evict oldest entry
            oldest_key = min(self._memory_cache.keys(), key=lambda k: self._memory_cache[k][1].created_at)
            self._memory_cache.pop(oldest_key, None)

        self._memory_cache[artifact_id] = (raw_bytes, record)

        # Persist to disk
        try:
            art_file = self.storage_dir / f"{artifact_id}.bin"
            art_file.write_bytes(raw_bytes)

            meta_file = self.storage_dir / f"{artifact_id}.json"
            meta_file.write_text(json.dumps(asdict(record), indent=2), encoding="utf-8")
        except Exception as exc:
            logger.warning("Failed to write artifact %s to disk: %s", artifact_id, exc)

        return artifact_id

    def get_artifact(self, artifact_id: str) -> tuple[bytes, ArtifactRecord] | None:
        """Retrieve artifact bytes and record by artifact_id."""
        # Check memory cache first
        if artifact_id in self._memory_cache:
            return self._memory_cache[artifact_id]

        # Check disk storage
        art_file = self.storage_dir / f"{artifact_id}.bin"
        meta_file = self.storage_dir / f"{artifact_id}.json"

        if art_file.exists() and meta_file.exists():
            try:
                raw_bytes = art_file.read_bytes()
                meta_dict = json.loads(meta_file.read_text(encoding="utf-8"))
                record = ArtifactRecord(**meta_dict)
                self._memory_cache[artifact_id] = (raw_bytes, record)
                return raw_bytes, record
            except Exception as exc:
                logger.warning("Error reading artifact %s from disk: %s", artifact_id, exc)

        return None

    def create_zip_archive(self, artifact_id: str) -> tuple[bytes, str] | None:
        """Generate a secure, self-contained ZIP archive for an artifact.

        Returns (zip_bytes, zip_filename) or None if artifact not found.
        """
        artifact_data = self.get_artifact(artifact_id)
        if not artifact_data:
            return None

        raw_bytes, record = artifact_data
        zip_buffer = io.BytesIO()

        # Strict safe filename inside archive
        safe_payload_name = f"payload/{record.filename}"

        with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            # 1. Payload file
            zf.writestr(safe_payload_name, raw_bytes)

            # 2. Response headers JSON
            headers_json = json.dumps(record.headers, indent=2)
            zf.writestr("metadata/response_headers.json", headers_json)

            # 3. Request details JSON
            request_details = {
                "request_id": record.request_id,
                "url": record.url,
                "method": record.method,
                "status_code": record.status_code,
                "created_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created_at)),
                "content_type": record.content_type,
                "content_category": record.category,
                "payload_bytes": record.file_size,
            }
            zf.writestr("metadata/request_details.json", json.dumps(request_details, indent=2))

            # 4. Human-readable README summary
            readme_text = (
                f"TRACE Universal Content Explorer Export\n"
                f"=======================================\n"
                f"Export Timestamp : {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(record.created_at))}\n"
                f"Target URL       : {record.url}\n"
                f"HTTP Method      : {record.method}\n"
                f"Status Code      : {record.status_code}\n"
                f"Payload File     : {record.filename} ({record.file_size} bytes)\n"
                f"Content Type     : {record.content_type}\n"
                f"Category         : {record.category}\n\n"
                f"Archive Contents:\n"
                f"  - {safe_payload_name} (original response payload)\n"
                f"  - metadata/response_headers.json (all response headers)\n"
                f"  - metadata/request_details.json (execution metadata)\n"
                f"  - README.txt (this file)\n\n"
                f"Generated by TRACE API Testing and Network Analysis Tool.\n"
            )
            zf.writestr("README.txt", readme_text)

        zip_bytes = zip_buffer.getvalue()
        zip_filename = f"trace_export_{record.request_id}.zip"
        return zip_bytes, zip_filename

    def cleanup_expired(self) -> None:
        """Evict artifacts older than TTL or prune if storage exceeds count limit."""
        now = time.time()
        max_age = settings.artifact_max_age_seconds

        # Clean memory cache
        expired_keys = [k for k, (_, rec) in self._memory_cache.items() if (now - rec.created_at) > max_age]
        for k in expired_keys:
            self._memory_cache.pop(k, None)

        # Clean disk storage
        if not self.storage_dir.exists():
            return

        try:
            for item in self.storage_dir.glob("art_*.json"):
                try:
                    if (now - item.stat().st_mtime) > max_age:
                        base_id = item.stem
                        bin_file = self.storage_dir / f"{base_id}.bin"
                        if bin_file.exists():
                            bin_file.unlink()
                        item.unlink()
                except Exception:
                    pass
        except Exception as exc:
            logger.warning("Error during artifact cleanup: %s", exc)


artifact_service = ArtifactService()
