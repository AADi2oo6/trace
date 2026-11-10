"""TRACE Monitoring Background Scheduler.

Lightweight, in-process asynchronous scheduler executing periodic health checks
for enabled monitors with concurrency controls, deduplication, and safe shutdown.
"""

import asyncio
from datetime import datetime, timezone, timedelta
import logging
from typing import Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.monitor import Monitor, MonitorResult, utc_now
from app.services.monitor_service import monitor_service

logger = logging.getLogger("trace.scheduler")


class ConcurrentExecutionError(Exception):
    """Raised when an immediate check is requested for a monitor already running."""
    pass


class MonitoringScheduler:
    """Manages the periodic execution loop for active API health checks."""

    def __init__(self, session_factory=SessionLocal) -> None:
        self._session_factory = session_factory
        self._loop_task: asyncio.Task[None] | None = None
        self._running = False
        self._stopping = False
        self._active_monitor_ids: set[str] = set()
        self._lock = asyncio.Lock()
        self._semaphore: asyncio.Semaphore | None = None
        self._last_retention_cleanup = datetime.min

    @property
    def is_running(self) -> bool:
        return self._running

    async def start(self) -> None:
        """Initialize the background scheduling loop and recover enabled monitors."""
        if self._running:
            return

        self._running = True
        self._stopping = False
        self._semaphore = asyncio.Semaphore(settings.monitoring_max_concurrent_checks)

        # 1. Recover enabled monitors after application restart
        # Missed checks during downtime are NOT fired all at once; instead, we reset next_run_at to now
        # with small staggering to prevent an initial thundering herd.
        try:
            with self._session_factory() as db:
                enabled_monitors = db.query(Monitor).filter(Monitor.enabled == True).all()  # noqa: E712
                now = utc_now()
                for i, m in enumerate(enabled_monitors):
                    if m.next_run_at is None or m.next_run_at < now:
                        # Stagger by 1-2 seconds per monitor to distribute load cleanly
                        stagger_seconds = min(i * 1.5, 30.0)
                        m.next_run_at = now + timedelta(seconds=stagger_seconds)
                db.commit()
                logger.info(
                    "Scheduler recovered %d enabled monitors on startup",
                    len(enabled_monitors),
                )
        except Exception as exc:
            logger.error("Failed to recover monitors on scheduler startup: %s", exc, exc_info=True)

        # 2. Launch background asyncio worker task
        self._loop_task = asyncio.create_task(self._run_loop())
        logger.info("TRACE Monitoring Scheduler started")

    async def stop(self) -> None:
        """Gracefully stop the background monitoring loop and wait for active checks."""
        if not self._running:
            return

        logger.info("Stopping TRACE Monitoring Scheduler...")
        self._stopping = True
        self._running = False

        if self._loop_task:
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass
            self._loop_task = None

        logger.info("TRACE Monitoring Scheduler stopped cleanly")

    async def _run_loop(self) -> None:
        """Main tick loop checking for due monitors every tick interval."""
        while not self._stopping:
            try:
                await self._tick()
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("Unexpected error in monitoring scheduler tick: %s", exc, exc_info=True)

            try:
                await asyncio.sleep(settings.monitoring_check_tick_seconds)
            except asyncio.CancelledError:
                break

    async def _tick(self) -> None:
        """Find due monitors and dispatch asynchronous check tasks within semaphore bounds."""
        now = utc_now()

        # Run periodic retention cleanup every 6 hours
        if now - self._last_retention_cleanup > timedelta(hours=6):
            self._last_retention_cleanup = now
            try:
                with self._session_factory() as db:
                    monitor_service.cleanup_old_results(db, settings.monitoring_retention_days)
            except Exception as exc:
                logger.warning("Retention cleanup error in scheduler: %s", exc)

        # Query due monitors
        due_monitor_ids: list[str] = []
        try:
            with self._session_factory() as db:
                due_monitors = (
                    db.query(Monitor.id)
                    .filter(
                        Monitor.enabled == True,  # noqa: E712
                        Monitor.next_run_at <= now,
                    )
                    .all()
                )
                due_monitor_ids = [m[0] for m in due_monitors]
        except Exception as exc:
            logger.error("Database query failed while fetching due monitors: %s", exc)
            return

        # Dispatch due checks
        for monitor_id in due_monitor_ids:
            async with self._lock:
                if monitor_id in self._active_monitor_ids:
                    # Already running (e.g. triggered manually or slow check), skip
                    continue
                self._active_monitor_ids.add(monitor_id)

            # Fire check asynchronously bounded by semaphore
            asyncio.create_task(self._execute_bounded_check(monitor_id))

    async def _execute_bounded_check(self, monitor_id: str) -> None:
        """Run monitor check protected by semaphore and cleanup active ID tracking."""
        sem = self._semaphore or asyncio.Semaphore(settings.monitoring_max_concurrent_checks)
        async with sem:
            try:
                with self._session_factory() as db:
                    await monitor_service.execute_monitor_check(monitor_id, db)
            except Exception as exc:
                logger.error("Error executing monitor check for '%s': %s", monitor_id, exc, exc_info=True)
            finally:
                async with self._lock:
                    self._active_monitor_ids.discard(monitor_id)

    async def trigger_immediate_run(self, monitor_id: str, db: Session) -> Any:
        """Manually trigger an immediate check for a monitor.

        Prevents duplicate concurrent execution if the monitor is currently running.
        """
        async with self._lock:
            if monitor_id in self._active_monitor_ids:
                raise ConcurrentExecutionError(
                    f"A check is already running for monitor '{monitor_id}'."
                )
            self._active_monitor_ids.add(monitor_id)

        try:
            sem = self._semaphore or asyncio.Semaphore(settings.monitoring_max_concurrent_checks)
            async with sem:
                result = await monitor_service.execute_monitor_check(monitor_id, db)
                return result
        finally:
            async with self._lock:
                self._active_monitor_ids.discard(monitor_id)


# Global singleton instance
monitoring_scheduler = MonitoringScheduler()
