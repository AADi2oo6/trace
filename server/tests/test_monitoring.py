"""Tests for TRACE API Monitoring, Performance Analytics, and Scheduler."""

import asyncio
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from app.main import app
from app.models.monitor import Monitor, MonitorResult, utc_now
from app.schemas.monitor import (
    MonitorCreate,
    MonitorUpdate,
    MonitorMethod,
    MonitorStatus,
    compute_monitor_status,
)
from app.services.monitor_service import monitor_service
from app.services.request_service import request_service
from app.services.scheduler import monitoring_scheduler, ConcurrentExecutionError
import httpx

# In-memory SQLite shared across test threads
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_mock_transport():
    def handler(request: httpx.Request) -> httpx.Response:
        url_str = str(request.url)
        if "status/500" in url_str:
            return httpx.Response(500, json={"error": "Server Error"}, request=request)
        if "status/404" in url_str:
            return httpx.Response(404, json={"error": "Not Found"}, request=request)
        return httpx.Response(200, json={"status": "ok"}, headers={"Content-Type": "application/json"}, request=request)

    orig = request_service.transport
    request_service.transport = httpx.MockTransport(handler)
    yield
    request_service.transport = orig


@pytest.fixture(autouse=True)
def setup_test_db():
    orig_factory = monitoring_scheduler._session_factory
    monitoring_scheduler._session_factory = TestingSessionLocal
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    monitoring_scheduler._session_factory = orig_factory


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


# ── 1. Database Model & Cascade Deletion Tests ──────────────────────────────

def test_monitor_creation_and_cascade_delete(db_session):
    # Create monitor
    data = MonitorCreate(
        name="Example Check",
        url="https://example.com",
        method=MonitorMethod.GET,
        interval_seconds=60,
        timeout_seconds=5.0,
    )
    monitor = monitor_service.create_monitor(db_session, data)
    assert monitor.id.startswith("mon_")
    assert monitor.name == "Example Check"
    assert monitor.enabled is True
    assert monitor.interval_seconds == 60

    # Add results
    res1 = MonitorResult(
        monitor_id=monitor.id,
        success=True,
        status_code=200,
        duration_ms=45.2,
    )
    res2 = MonitorResult(
        monitor_id=monitor.id,
        success=False,
        status_code=500,
        duration_ms=120.0,
        error_code="HTTP_500",
    )
    db_session.add_all([res1, res2])
    db_session.commit()

    # Query results
    results, count = monitor_service.get_results(db_session, monitor.id)
    assert count == 2

    # Cascade delete monitor
    deleted = monitor_service.delete_monitor(db_session, monitor.id)
    assert deleted is True

    # Confirm results were cascaded
    orphan_results = db_session.query(MonitorResult).filter(MonitorResult.monitor_id == monitor.id).all()
    assert len(orphan_results) == 0


def test_monitor_status_computation():
    now = utc_now()
    # Untested
    assert compute_monitor_status(enabled=True, last_checked_at=None, last_result=None) == MonitorStatus.UNKNOWN
    # Paused
    assert compute_monitor_status(enabled=False, last_checked_at=now, last_result="UP") == MonitorStatus.PAUSED
    # Up
    assert compute_monitor_status(enabled=True, last_checked_at=now, last_result="UP") == MonitorStatus.UP
    # Down
    assert compute_monitor_status(enabled=True, last_checked_at=now, last_result="DOWN") == MonitorStatus.DOWN


# ── 2. Security & SSRF Protection Tests ──────────────────────────────────────

def test_create_monitor_ssrf_blocked_localhost(client):
    payload = {
        "name": "Localhost Monitor",
        "url": "http://localhost:8000/api/health",
        "method": "GET",
        "interval_seconds": 60,
    }
    res = client.post("/api/monitors", json=payload)
    assert res.status_code == 422
    data = res.json()
    assert "SSRF_BLOCKED" in str(data)


def test_create_monitor_ssrf_blocked_private_ip(client):
    payload = {
        "name": "Internal IP",
        "url": "http://192.168.1.10/status",
        "method": "GET",
        "interval_seconds": 60,
    }
    res = client.post("/api/monitors", json=payload)
    assert res.status_code == 422


def test_create_monitor_invalid_method(client):
    payload = {
        "name": "POST Monitor",
        "url": "https://example.com",
        "method": "POST",  # POST is disallowed for recurring monitoring
        "interval_seconds": 60,
    }
    res = client.post("/api/monitors", json=payload)
    assert res.status_code == 422


def test_create_monitor_interval_below_minimum(client):
    payload = {
        "name": "Fast Monitor",
        "url": "https://example.com",
        "method": "GET",
        "interval_seconds": 30,  # Below 60s minimum
    }
    res = client.post("/api/monitors", json=payload)
    assert res.status_code == 422


# ── 3. Monitor Execution & Health Classification Tests ───────────────────────

@pytest.mark.anyio
async def test_execute_monitor_check_success(db_session):
    data = MonitorCreate(
        name="Example Target",
        url="https://example.com",
        method=MonitorMethod.GET,
        interval_seconds=300,
    )
    monitor = monitor_service.create_monitor(db_session, data)

    # Execute check
    result = await monitor_service.execute_monitor_check(monitor.id, db_session)
    assert result is not None
    assert result.monitor_id == monitor.id
    assert result.status_code == 200
    assert result.success is True
    assert result.duration_ms is not None

    # Check monitor state updated
    db_session.refresh(monitor)
    assert monitor.last_status_code == 200
    assert monitor.last_result == "UP"
    assert monitor.consecutive_failures == 0
    assert monitor.next_run_at is not None
    assert monitor.next_run_at > utc_now()


@pytest.mark.anyio
async def test_execute_monitor_check_ssrf_blocked_runtime(db_session):
    # Manually insert a monitor with internal IP to test runtime validation
    monitor = Monitor(
        name="Bypass Attempt",
        url="http://127.0.0.1:8000/internal",
        method="GET",
        interval_seconds=60,
        timeout_seconds=5.0,
        enabled=True,
    )
    db_session.add(monitor)
    db_session.commit()

    # Runtime check must block SSRF
    result = await monitor_service.execute_monitor_check(monitor.id, db_session)
    assert result is not None
    assert result.success is False
    assert result.status_code is None
    assert result.error_code == "SSRF_BLOCKED"

    db_session.refresh(monitor)
    assert monitor.last_result == "DOWN"
    assert monitor.consecutive_failures == 1


# ── 4. Analytics Calculations & Edge Cases ───────────────────────────────────

def test_analytics_calculation_with_results(db_session):
    data = MonitorCreate(name="Stats Monitor", url="https://example.com", method=MonitorMethod.GET)
    monitor = monitor_service.create_monitor(db_session, data)

    now = utc_now()
    r1 = MonitorResult(monitor_id=monitor.id, checked_at=now - timedelta(minutes=10), success=True, status_code=200, duration_ms=100.0)
    r2 = MonitorResult(monitor_id=monitor.id, checked_at=now - timedelta(minutes=5), success=True, status_code=200, duration_ms=200.0)
    r3 = MonitorResult(monitor_id=monitor.id, checked_at=now - timedelta(minutes=1), success=False, status_code=500, duration_ms=300.0)
    db_session.add_all([r1, r2, r3])
    monitor.last_checked_at = now
    monitor.last_result = "DOWN"
    db_session.commit()

    analytics = monitor_service.get_analytics(db_session, monitor.id, period="24h")
    assert analytics is not None
    assert analytics.total_checks == 3
    assert analytics.successful_checks == 2
    assert analytics.failed_checks == 1
    # 2/3 = 66.67%
    assert analytics.uptime_percentage == 66.67
    assert analytics.average_duration_ms == 200.0
    assert analytics.minimum_duration_ms == 100.0
    assert analytics.maximum_duration_ms == 300.0
    assert len(analytics.history_points) == 3


def test_analytics_no_results_returns_none_uptime(db_session):
    data = MonitorCreate(name="Empty Monitor", url="https://example.com", method=MonitorMethod.GET)
    monitor = monitor_service.create_monitor(db_session, data)

    analytics = monitor_service.get_analytics(db_session, monitor.id, period="24h")
    assert analytics is not None
    assert analytics.total_checks == 0
    # Must NOT claim fake 100%
    assert analytics.uptime_percentage is None
    assert analytics.average_duration_ms is None
    assert len(analytics.history_points) == 0


def test_retention_policy_cleanup(db_session):
    data = MonitorCreate(name="Retention Monitor", url="https://example.com")
    monitor = monitor_service.create_monitor(db_session, data)

    now = utc_now()
    old_res = MonitorResult(monitor_id=monitor.id, checked_at=now - timedelta(days=35), success=True, status_code=200)
    new_res = MonitorResult(monitor_id=monitor.id, checked_at=now - timedelta(days=5), success=True, status_code=200)
    db_session.add_all([old_res, new_res])
    db_session.commit()

    deleted_count = monitor_service.cleanup_old_results(db_session, retention_days=30)
    assert deleted_count == 1

    remaining = db_session.query(MonitorResult).filter(MonitorResult.monitor_id == monitor.id).all()
    assert len(remaining) == 1
    assert remaining[0].id == new_res.id


# ── 5. Full REST API Lifecycle Tests ─────────────────────────────────────────

def test_api_monitor_lifecycle(client):
    # 1. Create monitor
    payload = {
        "name": "Production API",
        "url": "https://example.com",
        "method": "HEAD",
        "interval_seconds": 300,
        "timeout_seconds": 8.0,
    }
    create_res = client.post("/api/monitors", json=payload)
    assert create_res.status_code == 201
    mon = create_res.json()
    mon_id = mon["id"]
    assert mon["name"] == "Production API"
    assert mon["method"] == "HEAD"
    assert mon["status"] == "UNKNOWN"

    # 2. List monitors
    list_res = client.get("/api/monitors")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1

    # 3. Get monitor detail
    detail_res = client.get(f"/api/monitors/{mon_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == mon_id

    # 4. Update monitor
    update_res = client.patch(f"/api/monitors/{mon_id}", json={"name": "Production API Renamed", "interval_seconds": 600})
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Production API Renamed"
    assert update_res.json()["interval_seconds"] == 600

    # 5. Run immediate check
    run_res = client.post(f"/api/monitors/{mon_id}/run")
    assert run_res.status_code == 200
    check_result = run_res.json()
    assert check_result["monitor_id"] == mon_id
    assert check_result["status_code"] == 200
    assert check_result["success"] is True

    # 6. Check updated monitor status via GET
    updated_detail = client.get(f"/api/monitors/{mon_id}").json()
    assert updated_detail["status"] == "UP"
    assert updated_detail["last_status_code"] == 200

    # 7. Pause monitor
    pause_res = client.post(f"/api/monitors/{mon_id}/pause")
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "PAUSED"
    assert pause_res.json()["enabled"] is False

    # 8. Resume monitor
    resume_res = client.post(f"/api/monitors/{mon_id}/resume")
    assert resume_res.status_code == 200
    assert resume_res.json()["enabled"] is True

    # 9. Get results
    results_res = client.get(f"/api/monitors/{mon_id}/results")
    assert results_res.status_code == 200
    assert results_res.json()["total"] >= 1

    # 10. Get analytics
    analytics_res = client.get(f"/api/monitors/{mon_id}/analytics?period=24h")
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()
    assert analytics_data["total_checks"] >= 1
    assert analytics_data["uptime_percentage"] == 100.0

    # 11. Delete monitor
    del_res = client.delete(f"/api/monitors/{mon_id}")
    assert del_res.status_code == 200

    # 12. Confirm 404
    not_found = client.get(f"/api/monitors/{mon_id}")
    assert not_found.status_code == 404


@pytest.mark.anyio
async def test_scheduler_concurrent_run_prevention(db_session):
    data = MonitorCreate(name="Race Test", url="https://example.com")
    monitor = monitor_service.create_monitor(db_session, data)

    # Manually mark as active in scheduler lock
    monitoring_scheduler._active_monitor_ids.add(monitor.id)
    try:
        with pytest.raises(ConcurrentExecutionError):
            await monitoring_scheduler.trigger_immediate_run(monitor.id, db_session)
    finally:
        monitoring_scheduler._active_monitor_ids.discard(monitor.id)


@pytest.mark.anyio
async def test_scheduler_recovery_no_burst(db_session):
    # Create two enabled monitors with missed run times in the past
    m1 = Monitor(
        name="Missed 1",
        url="https://example.com/1",
        method="GET",
        interval_seconds=60,
        enabled=True,
        next_run_at=utc_now() - timedelta(minutes=45),
    )
    m2 = Monitor(
        name="Missed 2",
        url="https://example.com/2",
        method="GET",
        interval_seconds=300,
        enabled=True,
        next_run_at=utc_now() - timedelta(hours=2),
    )
    paused = Monitor(
        name="Paused Target",
        url="https://example.com/paused",
        method="GET",
        interval_seconds=60,
        enabled=False,
        next_run_at=None,
    )
    db_session.add_all([m1, m2, paused])
    db_session.commit()

    # Calling start should recover them cleanly without running missed checks in a burst
    await monitoring_scheduler.start()
    try:
        assert monitoring_scheduler.is_running is True
        db_session.refresh(m1)
        db_session.refresh(m2)
        db_session.refresh(paused)

        # Both missed monitors should have next_run_at >= now
        now = utc_now()
        assert m1.next_run_at is not None
        assert m1.next_run_at >= now - timedelta(seconds=1)
        assert m2.next_run_at is not None
        assert m2.next_run_at >= now - timedelta(seconds=1)
        assert paused.next_run_at is None
    finally:
        await monitoring_scheduler.stop()
        assert monitoring_scheduler.is_running is False


@pytest.mark.anyio
async def test_scheduler_tick_execution(db_session):
    data = MonitorCreate(
        name="Tick Test",
        url="https://example.com/tick",
        method=MonitorMethod.GET,
        interval_seconds=60,
    )
    monitor = monitor_service.create_monitor(db_session, data)
    # Ensure next_run_at is due
    monitor.next_run_at = utc_now() - timedelta(seconds=5)
    db_session.commit()

    # Run one tick
    await monitoring_scheduler._tick()

    # Wait for the background task to finish executing
    await asyncio.sleep(0.1)

    db_session.refresh(monitor)
    assert monitor.last_checked_at is not None
    assert monitor.last_status_code == 200
    assert monitor.last_result == "UP"


