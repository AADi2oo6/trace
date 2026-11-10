"""TRACE Monitor and MonitorResult Database Models."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


def utc_now() -> datetime:
    """Return naive UTC datetime for seamless SQLite storage and comparison."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Monitor(Base):
    """SQLAlchemy model for configured API monitoring targets."""

    __tablename__ = "monitors"

    # Identity
    id = Column(String(36), primary_key=True, default=lambda: f"mon_{uuid.uuid4().hex[:12]}", index=True)
    name = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Configuration
    url = Column(String(2048), nullable=False)
    method = Column(String(16), nullable=False, default="GET")  # GET or HEAD only for MVP
    interval_seconds = Column(Integer, nullable=False, default=300)  # Min 60s
    timeout_seconds = Column(Float, nullable=False, default=10.0)
    enabled = Column(Boolean, nullable=False, default=True, index=True)
    next_run_at = Column(DateTime, nullable=True, index=True)

    # State & Health Metrics
    last_checked_at = Column(DateTime, nullable=True)
    last_status_code = Column(Integer, nullable=True)
    last_duration_ms = Column(Float, nullable=True)
    last_result = Column(String(32), nullable=True)  # "UP", "DOWN", or None (untested)
    consecutive_failures = Column(Integer, nullable=False, default=0)

    # Cascade relationship: Deleting a monitor deletes its associated results
    results = relationship(
        "MonitorResult",
        back_populates="monitor",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class MonitorResult(Base):
    """SQLAlchemy model for periodic monitoring execution records."""

    __tablename__ = "monitor_results"

    id = Column(String(36), primary_key=True, default=lambda: f"res_{uuid.uuid4().hex[:12]}", index=True)
    monitor_id = Column(
        String(36),
        ForeignKey("monitors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    checked_at = Column(DateTime, default=utc_now, nullable=False, index=True)

    # Execution telemetry
    success = Column(Boolean, nullable=False)
    status_code = Column(Integer, nullable=True)  # null if network error / SSRF blocked
    duration_ms = Column(Float, nullable=True)
    response_size = Column(Integer, nullable=True)

    # Error classification if unsuccessful
    error_code = Column(String(64), nullable=True)
    error_message = Column(String(512), nullable=True)

    # Back-reference
    monitor = relationship("Monitor", back_populates="results")
