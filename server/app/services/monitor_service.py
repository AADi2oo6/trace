"""TRACE Monitor Service Layer.

Provides CRUD operations, health check execution, analytics, and retention cleanup
for API monitors and monitoring results.
"""

from datetime import datetime, timezone, timedelta
import logging
from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.core.security import validate_url_for_ssrf, SecurityValidationError
from app.models.monitor import Monitor, MonitorResult, utc_now
from app.schemas.monitor import (
    MonitorCreate,
    MonitorUpdate,
    MonitorListItem,
    MonitorListResponse,
    MonitorDetailResponse,
    MonitorStatus,
    compute_monitor_status,
    MonitorAnalyticsResponse,
    AnalyticsDataPoint,
)
from app.schemas.request import RequestCreate, HTTPMethod
from app.services.request_service import request_service

logger = logging.getLogger("trace.monitor_service")


class MonitorService:
    """Service managing monitor lifecycle, periodic checks, analytics, and retention."""

    @staticmethod
    def create_monitor(db: Session, data: MonitorCreate) -> Monitor:
        """Validate URL and create a new monitoring target."""
        # 1. SSRF and URL validation
        validate_url_for_ssrf(data.url)

        # 2. Check method safety (GET or HEAD only for MVP)
        method_str = data.method.value.upper()
        if method_str not in ("GET", "HEAD"):
            raise ValueError("Only GET and HEAD methods are supported for monitoring checks.")

        now = utc_now()
        monitor = Monitor(
            name=data.name.strip(),
            url=data.url.strip(),
            method=method_str,
            interval_seconds=max(data.interval_seconds, settings.monitoring_min_interval_seconds),
            timeout_seconds=data.timeout_seconds,
            enabled=True,
            next_run_at=now,  # Due immediately
            created_at=now,
            updated_at=now,
        )
        db.add(monitor)
        db.commit()
        db.refresh(monitor)
        logger.info("Created monitor '%s' (%s) for %s", monitor.name, monitor.id, monitor.url)
        return monitor

    @staticmethod
    def get_monitors(db: Session) -> MonitorListResponse:
        """Retrieve all monitors with computed summary stats."""
        monitors = db.query(Monitor).order_by(desc(Monitor.created_at)).all()

        total = len(monitors)
        total_up = 0
        total_down = 0
        total_paused = 0
        valid_durations: list[float] = []

        items: list[MonitorListItem] = []
        for m in monitors:
            status = compute_monitor_status(m.enabled, m.last_checked_at, m.last_result)
            if status == MonitorStatus.UP:
                total_up += 1
            elif status == MonitorStatus.DOWN:
                total_down += 1
            elif status == MonitorStatus.PAUSED:
                total_paused += 1

            if m.last_duration_ms is not None and m.last_duration_ms > 0:
                valid_durations.append(m.last_duration_ms)

            items.append(
                MonitorListItem(
                    id=m.id,
                    name=m.name,
                    url=m.url,
                    method=m.method,
                    interval_seconds=m.interval_seconds,
                    timeout_seconds=m.timeout_seconds,
                    enabled=m.enabled,
                    status=status,
                    last_checked_at=m.last_checked_at,
                    next_run_at=m.next_run_at,
                    last_status_code=m.last_status_code,
                    last_duration_ms=m.last_duration_ms,
                    consecutive_failures=m.consecutive_failures,
                    created_at=m.created_at,
                )
            )

        avg_dur = round(sum(valid_durations) / len(valid_durations), 2) if valid_durations else None

        return MonitorListResponse(
            items=items,
            total=total,
            total_up=total_up,
            total_down=total_down,
            total_paused=total_paused,
            avg_response_time_ms=avg_dur,
        )

    @staticmethod
    def get_monitor(db: Session, monitor_id: str) -> Monitor | None:
        """Retrieve a single monitor by ID."""
        return db.query(Monitor).filter(Monitor.id == monitor_id).first()

    @staticmethod
    def get_monitor_detail(db: Session, monitor_id: str) -> MonitorDetailResponse | None:
        """Retrieve detailed monitor schema by ID."""
        m = db.query(Monitor).filter(Monitor.id == monitor_id).first()
        if not m:
            return None

        status = compute_monitor_status(m.enabled, m.last_checked_at, m.last_result)
        return MonitorDetailResponse(
            id=m.id,
            name=m.name,
            url=m.url,
            method=m.method,
            interval_seconds=m.interval_seconds,
            timeout_seconds=m.timeout_seconds,
            enabled=m.enabled,
            status=status,
            last_checked_at=m.last_checked_at,
            next_run_at=m.next_run_at,
            last_status_code=m.last_status_code,
            last_duration_ms=m.last_duration_ms,
            consecutive_failures=m.consecutive_failures,
            created_at=m.created_at,
            updated_at=m.updated_at,
        )

    @staticmethod
    def update_monitor(db: Session, monitor_id: str, data: MonitorUpdate) -> Monitor | None:
        """Update monitor configuration with URL and parameter validation."""
        monitor = db.query(Monitor).filter(Monitor.id == monitor_id).first()
        if not monitor:
            return None

        if data.url is not None:
            validate_url_for_ssrf(data.url)
            monitor.url = data.url.strip()

        if data.name is not None:
            monitor.name = data.name.strip()

        if data.method is not None:
            m_str = data.method.value.upper()
            if m_str not in ("GET", "HEAD"):
                raise ValueError("Only GET and HEAD methods are supported for monitoring checks.")
            monitor.method = m_str

        if data.interval_seconds is not None:
            monitor.interval_seconds = max(data.interval_seconds, settings.monitoring_min_interval_seconds)

        if data.timeout_seconds is not None:
            monitor.timeout_seconds = data.timeout_seconds

        monitor.updated_at = utc_now()
        db.commit()
        db.refresh(monitor)
        return monitor

    @staticmethod
    def delete_monitor(db: Session, monitor_id: str) -> bool:
        """Delete monitor and its historical results via cascade."""
        monitor = db.query(Monitor).filter(Monitor.id == monitor_id).first()
        if not monitor:
            return False

        # Explicitly delete child results to guarantee consistency across all SQLite configurations
        db.query(MonitorResult).filter(MonitorResult.monitor_id == monitor_id).delete(synchronize_session=False)
        db.delete(monitor)
        db.commit()
        logger.info("Deleted monitor '%s' (%s)", monitor.name, monitor_id)
        return True

    @staticmethod
    def pause_monitor(db: Session, monitor_id: str) -> Monitor | None:
        """Pause a monitor so no new checks are scheduled."""
        monitor = db.query(Monitor).filter(Monitor.id == monitor_id).first()
        if not monitor:
            return None

        monitor.enabled = False
        monitor.next_run_at = None
        monitor.updated_at = utc_now()
        db.commit()
        db.refresh(monitor)
        logger.info("Paused monitor '%s' (%s)", monitor.name, monitor_id)
        return monitor

    @staticmethod
    def resume_monitor(db: Session, monitor_id: str) -> Monitor | None:
        """Resume a paused monitor and schedule immediate execution."""
        monitor = db.query(Monitor).filter(Monitor.id == monitor_id).first()
        if not monitor:
            return None

        monitor.enabled = True
        monitor.next_run_at = utc_now()  # Due immediately upon resume
        monitor.updated_at = utc_now()
        db.commit()
        db.refresh(monitor)
        logger.info("Resumed monitor '%s' (%s)", monitor.name, monitor_id)
        return monitor

    @staticmethod
    async def execute_monitor_check(monitor_id: str, db: Session) -> MonitorResult | None:
        """Execute a health check using the secured HTTP request engine.

        Re-validates SSRF at runtime, records results to SQLite, and updates monitor state.
        """
        monitor = db.query(Monitor).filter(Monitor.id == monitor_id).first()
        if not monitor:
            return None

        now = utc_now()
        success = False
        status_code: int | None = None
        duration_ms: float | None = None
        response_size: int | None = None
        error_code: str | None = None
        error_message: str | None = None

        try:
            # 1. Runtime SSRF re-validation before executing check
            validate_url_for_ssrf(monitor.url)

            # 2. Execute request through secured RequestService
            http_method = HTTPMethod(monitor.method)
            req_data = RequestCreate(
                method=http_method,
                url=monitor.url,
                headers={"User-Agent": "TRACE-Monitor/0.1.0"},
            )

            resp = await request_service.execute_request(req_data)

            status_code = resp.status_code
            duration_ms = resp.duration_ms
            response_size = resp.body_size

            # Per TRACE MVP Step 17 requirement:
            # 4xx or 5xx is an actual HTTP response but classified as an UNSUCCESSFUL health check.
            # Only status_code < 400 is considered successful health check.
            if status_code is not None:
                if status_code < 400:
                    success = True
                else:
                    success = False
                    error_code = f"HTTP_{status_code}"
                    error_message = resp.status_text or f"HTTP {status_code} Error"
            else:
                # Network error, DNS failure, timeout, or SSRF block
                success = False
                error_code = resp.error.code.value if resp.error else "NETWORK_ERROR"
                error_message = resp.error.message if resp.error else "Failed to reach target server."

        except SecurityValidationError as sec_err:
            success = False
            status_code = None
            error_code = sec_err.code.value
            error_message = sec_err.message
        except Exception as exc:
            success = False
            status_code = None
            error_code = "INTERNAL_ERROR"
            error_message = str(exc)

        # 3. Create persistent MonitorResult record
        result = MonitorResult(
            monitor_id=monitor.id,
            checked_at=now,
            success=success,
            status_code=status_code,
            duration_ms=duration_ms,
            response_size=response_size,
            error_code=error_code,
            error_message=error_message,
        )
        db.add(result)

        # 4. Update Monitor current state
        monitor.last_checked_at = now
        monitor.last_status_code = status_code
        monitor.last_duration_ms = duration_ms
        monitor.last_result = "UP" if success else "DOWN"
        if success:
            monitor.consecutive_failures = 0
        else:
            monitor.consecutive_failures += 1

        # Calculate next scheduled execution
        if monitor.enabled:
            monitor.next_run_at = now + timedelta(seconds=monitor.interval_seconds)
        else:
            monitor.next_run_at = None

        monitor.updated_at = now
        db.commit()
        db.refresh(result)
        db.refresh(monitor)

        logger.info(
            "Monitor check complete | ID: %s | Success: %s | Status: %s | Duration: %sms",
            monitor.id,
            success,
            status_code,
            duration_ms,
        )
        return result

    @staticmethod
    def get_results(
        db: Session,
        monitor_id: str,
        limit: int = 50,
        offset: int = 0,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> tuple[list[MonitorResult], int]:
        """Query historical results with pagination and time filters."""
        query = db.query(MonitorResult).filter(MonitorResult.monitor_id == monitor_id)

        if start_time is not None:
            query = query.filter(MonitorResult.checked_at >= start_time)
        if end_time is not None:
            query = query.filter(MonitorResult.checked_at <= end_time)

        total = query.count()
        items = query.order_by(desc(MonitorResult.checked_at)).offset(offset).limit(limit).all()
        return items, total

    @staticmethod
    def get_analytics(db: Session, monitor_id: str, period: str = "24h") -> MonitorAnalyticsResponse | None:
        """Calculate uptime, response time statistics, and historical performance points."""
        monitor = db.query(Monitor).filter(Monitor.id == monitor_id).first()
        if not monitor:
            return None

        # Determine cutoff window
        delta_map = {
            "1h": timedelta(hours=1),
            "24h": timedelta(hours=24),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
        }
        window = delta_map.get(period, timedelta(hours=24))
        cutoff = utc_now() - window

        # Query all records in window, ordered chronological for chart rendering
        results = (
            db.query(MonitorResult)
            .filter(MonitorResult.monitor_id == monitor_id, MonitorResult.checked_at >= cutoff)
            .order_by(MonitorResult.checked_at.asc())
            .all()
        )

        total_checks = len(results)
        successful_checks = sum(1 for r in results if r.success)
        failed_checks = total_checks - successful_checks

        uptime_pct: float | None = None
        if total_checks > 0:
            uptime_pct = round((successful_checks / total_checks) * 100, 2)

        durations = [r.duration_ms for r in results if r.duration_ms is not None and r.duration_ms > 0]
        avg_dur: float | None = None
        min_dur: float | None = None
        max_dur: float | None = None

        if durations:
            avg_dur = round(sum(durations) / len(durations), 2)
            min_dur = round(min(durations), 2)
            max_dur = round(max(durations), 2)

        history_points: list[AnalyticsDataPoint] = [
            AnalyticsDataPoint(
                timestamp=r.checked_at.isoformat(),
                duration_ms=r.duration_ms,
                status_code=r.status_code,
                success=r.success,
            )
            for r in results
        ]

        status = compute_monitor_status(monitor.enabled, monitor.last_checked_at, monitor.last_result)

        return MonitorAnalyticsResponse(
            period=period,
            total_checks=total_checks,
            successful_checks=successful_checks,
            failed_checks=failed_checks,
            uptime_percentage=uptime_pct,
            average_duration_ms=avg_dur,
            minimum_duration_ms=min_dur,
            maximum_duration_ms=max_dur,
            latest_status=status,
            latest_check_at=monitor.last_checked_at,
            history_points=history_points,
        )

    @staticmethod
    def cleanup_old_results(db: Session, retention_days: int = 30) -> int:
        """Delete monitoring results exceeding the retention threshold."""
        cutoff = utc_now() - timedelta(days=retention_days)
        deleted = (
            db.query(MonitorResult)
            .filter(MonitorResult.checked_at < cutoff)
            .delete(synchronize_session=False)
        )
        db.commit()
        if deleted > 0:
            logger.info("Cleaned up %d expired monitor results older than %s", deleted, cutoff)
        return deleted


monitor_service = MonitorService()
