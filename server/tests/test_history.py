"""Tests for SQLite persistence, secret sanitization, and /api/history endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.sanitizer import sanitize_headers, sanitize_header_analysis, REDACTED_VALUE
from app.db.session import Base, get_db
from app.main import app
from app.models.history import RequestHistory
from app.schemas.request import RequestCreate, HTTPMethod, RequestResponse, StatusCategory
from app.services.history_service import history_service

# Test database using in-memory SQLite with StaticPool so all threads share the connection
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


# ── 1. Unit Tests for Secret Sanitization ────────────────────────────────────

def test_sanitize_headers_redacts_sensitive_keys():
    raw_headers = {
        "Authorization": "Bearer my_super_secret_token_123",
        "Proxy-Authorization": "Basic dXNlcjpwYXNz",
        "Cookie": "session_id=abcdef123456",
        "Set-Cookie": "auth=xyz; Path=/",
        "X-Api-Key": "secret_key_456",
        "User-Agent": "TRACE-Agent/1.0",
        "Content-Type": "application/json",
    }
    sanitized = sanitize_headers(raw_headers)
    assert sanitized["Authorization"] == REDACTED_VALUE
    assert sanitized["Proxy-Authorization"] == REDACTED_VALUE
    assert sanitized["Cookie"] == REDACTED_VALUE
    assert sanitized["Set-Cookie"] == REDACTED_VALUE
    assert sanitized["X-Api-Key"] == REDACTED_VALUE
    assert sanitized["User-Agent"] == "TRACE-Agent/1.0"
    assert sanitized["Content-Type"] == "application/json"


def test_sanitize_header_analysis():
    items = [
        {"name": "Authorization", "value": "Bearer test12345", "description": "Auth header"},
        {"name": "Content-Type", "value": "application/json", "description": "Mime type"},
    ]
    sanitized = sanitize_header_analysis(items)
    assert sanitized[0]["value"] == REDACTED_VALUE
    assert sanitized[1]["value"] == "application/json"


# ── 2. Database Model & Service CRUD ─────────────────────────────────────────

def test_save_and_retrieve_history(db_session):
    req = RequestCreate(
        method=HTTPMethod.POST,
        url="https://api.example.com/data",
        headers={"Authorization": "Bearer secret", "Accept": "application/json"},
        body={"foo": "bar"},
    )
    resp = RequestResponse(
        success=True,
        status_code=201,
        status_text="Created",
        status_category=StatusCategory.SUCCESS,
        duration_ms=85.5,
        content_type="application/json",
        body='{"foo": "bar"}',
        body_size=14,
        headers={"Content-Type": "application/json", "Set-Cookie": "id=1"},
    )

    # Save via service using test db session
    record_id = history_service.save_request_execution(req, resp)
    assert record_id is not None

    # Retrieve detail
    detail = history_service.get_history_detail(record_id)
    assert detail is not None
    assert detail.method == HTTPMethod.POST
    assert detail.url == "https://api.example.com/data"
    assert detail.status_code == 201
    assert detail.request_headers["Authorization"] == REDACTED_VALUE
    assert detail.response_headers["Set-Cookie"] == REDACTED_VALUE

    # Retrieve list
    list_res = history_service.get_history_list()
    assert list_res.total >= 1
    assert any(item.id == record_id for item in list_res.items)

    # Delete single
    deleted = history_service.delete_history_item(record_id)
    assert deleted is True
    assert history_service.get_history_detail(record_id) is None


def test_clear_all_history(db_session):
    req = RequestCreate(method=HTTPMethod.GET, url="https://example.com")
    resp = RequestResponse(success=True, status_code=200)

    history_service.save_request_execution(req, resp)
    history_service.save_request_execution(req, resp)

    cleared = history_service.clear_all_history()
    assert cleared >= 2

    list_res = history_service.get_history_list()
    assert list_res.total == 0


# ── 3. API Endpoints Integration Tests ────────────────────────────────────────

def test_api_history_lifecycle(client):
    # 1. Execute a request via POST /api/requests with secret headers
    payload = {
        "method": "GET",
        "url": "https://example.com",
        "headers": {
            "Authorization": "Bearer SUPER_SECRET_TOKEN",
            "Cookie": "session=MY_SECRET_SESSION",
            "Accept": "text/html",
        },
    }
    exec_res = client.post("/api/requests", json=payload)
    assert exec_res.status_code == 200

    # 2. Query GET /api/history
    list_res = client.get("/api/history")
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total"] >= 1
    record = data["items"][0]
    rec_id = record["id"]

    # 3. Query GET /api/history/{id}
    detail_res = client.get(f"/api/history/{rec_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["url"] == "https://example.com"
    # Ensure sensitive credentials were redacted
    assert detail["request_headers"]["Authorization"] == REDACTED_VALUE
    assert detail["request_headers"]["Cookie"] == REDACTED_VALUE
    assert detail["request_headers"]["Accept"] == "text/html"

    # 4. Delete single record
    del_res = client.delete(f"/api/history/{rec_id}")
    assert del_res.status_code == 200
    assert del_res.json()["deleted_count"] == 1

    # 5. Confirm 404 for deleted record
    not_found = client.get(f"/api/history/{rec_id}")
    assert not_found.status_code == 404

    # 6. Clear all
    clear_res = client.delete("/api/history")
    assert clear_res.status_code == 200
    list_after_clear = client.get("/api/history").json()
    assert list_after_clear["total"] == 0


def test_history_ssrf_blocked_persists(client):
    # Execute SSRF request
    payload = {
        "method": "GET",
        "url": "http://127.0.0.1:8000/api/health",
    }
    exec_res = client.post("/api/requests", json=payload)
    assert exec_res.status_code == 200
    resp_data = exec_res.json()
    assert resp_data["success"] is False
    assert resp_data["error"]["code"] == "SSRF_BLOCKED"

    # Verify it is stored in history
    list_res = client.get("/api/history")
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert len(items) >= 1
    item = items[0]
    assert item["status_code"] is None
    assert item["error"]["code"] == "SSRF_BLOCKED"

    # Verify detail
    detail_res = client.get(f"/api/history/{item['id']}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["status_code"] is None
    assert detail["error"]["code"] == "SSRF_BLOCKED"


def test_history_large_body_truncation(db_session):
    large_body = "x" * (600 * 1024)  # 600 KB
    req = RequestCreate(method=HTTPMethod.GET, url="https://example.com/large")
    resp = RequestResponse(
        success=True,
        status_code=200,
        status_text="OK",
        body=large_body,
        body_size=len(large_body),
    )

    rec_id = history_service.save_request_execution(req, resp)
    assert rec_id is not None

    detail = history_service.get_history_detail(rec_id)
    assert detail is not None
    assert detail.response_body_truncated is True
    assert len(detail.response_body) == 512 * 1024

