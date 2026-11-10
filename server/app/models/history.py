"""TRACE Database Models."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, JSON

from app.db.session import Base


class RequestHistory(Base):
    """SQLAlchemy model for persisting executed HTTP requests and diagnostic analyses."""

    __tablename__ = "request_history"

    # Identity
    id = Column(String(36), primary_key=True, index=True)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Request specification (sanitized)
    method = Column(String(16), nullable=False, index=True)
    url = Column(String(2048), nullable=False)
    query_params = Column(JSON, nullable=True)
    request_headers = Column(JSON, nullable=True)
    request_body = Column(Text, nullable=True)
    request_body_type = Column(String(32), nullable=True)

    # Execution status
    success = Column(Boolean, default=True, nullable=False)
    status_code = Column(Integer, nullable=True, index=True)
    status_text = Column(String(128), nullable=True)
    status_category = Column(String(32), nullable=True)
    duration_ms = Column(Float, nullable=True)

    # Response data
    content_type = Column(String(256), nullable=True)
    response_size = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    response_body_truncated = Column(Boolean, default=False, nullable=False)
    response_headers = Column(JSON, nullable=True)

    # Structured technical analyses
    dns_analysis = Column(JSON, nullable=True)
    header_analysis = Column(JSON, nullable=True)
    cors_analysis = Column(JSON, nullable=True)
    options_analysis = Column(JSON, nullable=True)
    request_journey = Column(JSON, nullable=True)

    # Error details if failed
    error = Column(JSON, nullable=True)
