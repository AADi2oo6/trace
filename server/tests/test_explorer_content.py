"""TRACE Step 20 — Universal Content Explorer & Artifact Tests."""

import io
import zipfile
import pytest
from fastapi.testclient import TestClient
import httpx

from app.main import app
from app.schemas.request import ContentCategory, HTTPMethod, RequestCreate
from app.services.artifact_service import artifact_service
from app.services.content_detector import content_detector
from app.services.request_service import request_service

client = TestClient(app)


def test_content_detector_html():
    """Verify HTML detection and metadata."""
    html_bytes = b"<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>"
    meta = content_detector.detect(html_bytes, {"content-type": "text/html; charset=utf-8"}, "https://example.com/")
    assert meta.category == ContentCategory.HTML
    assert meta.mime_type == "text/html"
    assert meta.extension == ".html"
    assert meta.is_binary is False
    assert meta.is_preview_supported is True
    assert meta.encoding == "utf-8"


def test_content_detector_json():
    """Verify JSON detection and metadata."""
    json_bytes = b'{"status": "ok", "count": 42}'
    meta = content_detector.detect(json_bytes, {"content-type": "application/json"}, "https://api.example.com/data.json")
    assert meta.category == ContentCategory.JSON
    assert meta.mime_type == "application/json"
    assert meta.is_binary is False
    assert meta.filename == "data.json"


def test_content_detector_image_png():
    """Verify PNG detection via magic bytes even if Content-Type is generic."""
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    meta = content_detector.detect(png_bytes, {"content-type": "application/octet-stream"}, "https://example.com/avatar")
    assert meta.category == ContentCategory.IMAGE
    assert meta.mime_type == "image/png"
    assert meta.extension == ".png"
    assert meta.is_binary is True
    assert meta.is_preview_supported is True
    assert meta.filename == "avatar.png"


def test_content_detector_pdf():
    """Verify PDF detection via magic bytes."""
    pdf_bytes = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>"
    meta = content_detector.detect(pdf_bytes, {}, "https://example.com/manual")
    assert meta.category == ContentCategory.PDF
    assert meta.mime_type == "application/pdf"
    assert meta.is_binary is True
    assert meta.filename == "manual.pdf"


def test_content_detector_audio_wav():
    """Verify WAV audio detection."""
    wav_bytes = b"RIFF\x24\x00\x00\x00WAVEfmt "
    meta = content_detector.detect(wav_bytes, {}, "https://example.com/sound.wav")
    assert meta.category == ContentCategory.AUDIO
    assert meta.mime_type == "audio/wav"
    assert meta.is_binary is True
    assert meta.is_preview_supported is True


def test_content_detector_youtube():
    """Verify YouTube intelligence and metadata extraction without downloading video."""
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    meta = content_detector.detect(b"mock html", {}, url)
    assert meta.category == ContentCategory.YOUTUBE
    assert meta.youtube_metadata is not None
    assert meta.youtube_metadata.video_id == "dQw4w9WgXcQ"
    assert "youtube-nocookie.com/embed/dQw4w9WgXcQ" in meta.youtube_metadata.embed_url
    assert "img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg" in meta.youtube_metadata.thumbnail_url
    assert meta.is_preview_supported is True
    assert "Direct YouTube video stream extraction" in (meta.preview_limitation or "")

    # Test youtu.be short URL
    short_url = "https://youtu.be/dQw4w9WgXcQ"
    meta_short = content_detector.detect(b"", {}, short_url)
    assert meta_short.category == ContentCategory.YOUTUBE
    assert meta_short.youtube_metadata.video_id == "dQw4w9WgXcQ"


def test_filename_sanitization():
    """Verify directory traversal and invalid characters are stripped from filenames."""
    dirty_name = "../../../etc/passwd"
    clean = content_detector.sanitize_filename(dirty_name)
    assert "/" not in clean and "\\" not in clean
    assert clean == "passwd"

    windows_reserved = "CON.txt"
    clean_win = content_detector.sanitize_filename(windows_reserved)
    assert clean_win.startswith("safe_")

    invalid_chars = 'my:cool*file<name>?.png'
    clean_chars = content_detector.sanitize_filename(invalid_chars)
    assert ":" not in clean_chars and "*" not in clean_chars
    assert clean_chars == "my_cool_file_name__.png"


def test_filename_content_disposition():
    """Verify filename extracted from Content-Disposition header."""
    headers = {"content-disposition": 'attachment; filename="report-2026.pdf"'}
    filename = content_detector.extract_filename(headers, "https://example.com/download?id=123", ".pdf")
    assert filename == "report-2026.pdf"


def test_artifact_lifecycle_and_zip_export():
    """Verify artifact creation, retrieval, and ZIP export generation."""
    sample_payload = b"Hello TRACE Artifact Explorer Content!"
    headers = {"content-type": "text/plain", "x-custom-test": "demo"}
    url = "https://api.example.com/test.txt"

    meta = content_detector.detect(sample_payload, headers, url)
    artifact_id = artifact_service.save_artifact(
        request_id="req_test123",
        raw_bytes=sample_payload,
        url=url,
        method="GET",
        status_code=200,
        headers=headers,
        content_metadata=meta,
    )
    assert artifact_id.startswith("art_")

    # 1. Download endpoint
    res_download = client.get(f"/api/artifacts/{artifact_id}/download")
    assert res_download.status_code == 200
    assert res_download.content == sample_payload
    assert 'attachment; filename="test.txt"' in res_download.headers.get("content-disposition", "")

    # 2. Raw preview endpoint
    res_raw = client.get(f"/api/artifacts/{artifact_id}/raw")
    assert res_raw.status_code == 200
    assert res_raw.content == sample_payload
    assert "nosniff" in res_raw.headers.get("x-content-type-options", "")

    # 3. ZIP export endpoint
    res_zip = client.get(f"/api/artifacts/{artifact_id}/zip")
    assert res_zip.status_code == 200
    assert res_zip.headers.get("content-type") == "application/zip"
    assert "trace_export_req_test123.zip" in res_zip.headers.get("content-disposition", "")

    # Inspect ZIP structure
    zip_buf = io.BytesIO(res_zip.content)
    with zipfile.ZipFile(zip_buf, "r") as zf:
        namelist = zf.namelist()
        assert "payload/test.txt" in namelist
        assert "metadata/response_headers.json" in namelist
        assert "metadata/request_details.json" in namelist
        assert "README.txt" in namelist
        assert zf.read("payload/test.txt") == sample_payload


def test_artifact_not_found():
    """Verify 404 response for nonexistent artifact."""
    res = client.get("/api/artifacts/art_nonexistent123/download")
    assert res.status_code == 404


def test_demo_media_endpoints():
    """Verify that Demo API media endpoints return valid media and headers."""
    # HTML
    res_html = client.get("/demo/html")
    assert res_html.status_code == 200
    assert "text/html" in res_html.headers.get("content-type", "")
    assert "<!DOCTYPE html>" in res_html.text

    # Image (PNG)
    res_img = client.get("/demo/image")
    assert res_img.status_code == 200
    assert res_img.headers.get("content-type") == "image/png"
    assert res_img.content.startswith(b"\x89PNG")

    # SVG
    res_svg = client.get("/demo/svg")
    assert res_svg.status_code == 200
    assert "image/svg+xml" in res_svg.headers.get("content-type", "")
    assert "<svg" in res_svg.text

    # Audio (WAV)
    res_audio = client.get("/demo/audio")
    assert res_audio.status_code == 200
    assert res_audio.headers.get("content-type") == "audio/wav"
    assert res_audio.content.startswith(b"RIFF")

    # PDF
    res_pdf = client.get("/demo/pdf")
    assert res_pdf.status_code == 200
    assert res_pdf.headers.get("content-type") == "application/pdf"
    assert res_pdf.content.startswith(b"%PDF")

    # XML
    res_xml = client.get("/demo/xml")
    assert res_xml.status_code == 200
    assert "application/xml" in res_xml.headers.get("content-type", "")
    assert "<?xml" in res_xml.text


def test_request_execution_populates_explorer_metadata():
    """Verify that executing a request populates ContentMetadata and artifact_id."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "image/png", "Content-Disposition": 'inline; filename="chart.png"'},
            content=b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR",
            request=request,
        )

    request_service.transport = httpx.MockTransport(handler)

    res = client.post(
        "/api/requests",
        json={"method": "GET", "url": "https://api.example.com/chart"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["content_metadata"] is not None
    assert data["content_metadata"]["category"] == "image"
    assert data["content_metadata"]["filename"] == "chart.png"
    assert data["artifact_id"] is not None
    assert data["artifact_id"].startswith("art_")
