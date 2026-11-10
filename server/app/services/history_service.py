"""TRACE History Persistence Service.

Provides CRUD operations for RequestHistory using SQLAlchemy sessions,
with automatic secret sanitization, response body size capping, and graceful error handling.
"""

import json
import logging
import time
from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.sanitizer import sanitize_headers, sanitize_header_analysis
from app.db.session import SessionLocal
from app.models.history import RequestHistory
from app.schemas.history import HistoryListItem, HistoryListResponse, HistoryDetailResponse
from app.schemas.request import RequestCreate, RequestResponse

logger = logging.getLogger("trace.history_service")

# Safety cap for stored response bodies (e.g. 512 KB) to prevent SQLite database bloat
MAX_STORED_BODY_CHARS = 512 * 1024


class HistoryService:
    """Service managing persistence and retrieval of request histories."""

    @staticmethod
    def save_request_execution(
        request_data: RequestCreate,
        response_data: RequestResponse,
        db: Session | None = None,
    ) -> str | None:
        """Safely persist an executed request and its diagnostic results to SQLite.

        Guarantees that database failures do not raise exceptions or alter
        the execution result returned to the client.
        """
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True
        try:
            # 1. Sanitize request headers
            sanitized_req_headers = sanitize_headers(request_data.headers)

            # 2. Extract request body as string
            req_body_str: str | None = None
            req_body_type: str | None = None
            if request_data.body is not None:
                if isinstance(request_data.body, (dict, list)):
                    req_body_str = json.dumps(request_data.body)
                    req_body_type = "json"
                elif isinstance(request_data.body, str):
                    req_body_str = request_data.body
                    req_body_type = "text"
                else:
                    req_body_str = str(request_data.body)
                    req_body_type = "other"

            # 3. Sanitize response headers
            sanitized_resp_headers = sanitize_headers(response_data.headers)

            # 4. Handle response body capping
            resp_body = response_data.body
            is_truncated = False
            if resp_body and len(resp_body) > MAX_STORED_BODY_CHARS:
                resp_body = resp_body[:MAX_STORED_BODY_CHARS]
                is_truncated = True

            # 5. Extract & sanitize structured analyses (converting Pydantic models to dicts)
            dns_dict = response_data.dns_analysis.model_dump() if response_data.dns_analysis else None
            options_dict = response_data.options_analysis.model_dump() if response_data.options_analysis else None
            cors_dict = response_data.cors_analysis.model_dump() if response_data.cors_analysis else None
            journey_dict = response_data.request_journey.model_dump() if response_data.request_journey else None
            error_dict = response_data.error.model_dump() if response_data.error else None

            header_analysis_list: list[dict[str, Any]] | None = None
            if response_data.header_analysis:
                raw_items = [item.model_dump() for item in response_data.header_analysis]
                header_analysis_list = sanitize_header_analysis(raw_items)

            # 6. Construct RequestHistory record
            history_record = RequestHistory(
                id=response_data.request_id or f"req_{int(time.time() * 1000)}",
                method=request_data.method.value,
                url=request_data.url,
                query_params=request_data.query_params or None,
                request_headers=sanitized_req_headers,
                request_body=req_body_str,
                request_body_type=req_body_type,
                success=response_data.success,
                status_code=response_data.status_code,
                status_text=response_data.status_text,
                status_category=response_data.status_category.value if response_data.status_category else None,
                duration_ms=response_data.duration_ms,
                content_type=response_data.content_type,
                response_size=response_data.body_size,
                response_body=resp_body,
                response_body_truncated=is_truncated,
                response_headers=sanitized_resp_headers,
                dns_analysis=dns_dict,
                header_analysis=header_analysis_list,
                cors_analysis=cors_dict,
                options_analysis=options_dict,
                request_journey=journey_dict,
                error=error_dict,
            )

            db.add(history_record)
            db.commit()
            db.refresh(history_record)
            return history_record.id

        except Exception as exc:
            db.rollback()
            logger.error("Failed to persist request execution to SQLite: %s", exc, exc_info=True)
            return None
        finally:
            if close_session:
                db.close()

    @staticmethod
    def get_history_list(
        limit: int = 50,
        offset: int = 0,
        db: Session | None = None,
    ) -> HistoryListResponse:
        """Retrieve paginated lightweight history records, ordered newest first."""
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            total = db.query(RequestHistory).count()
            records = (
                db.query(RequestHistory)
                .order_by(desc(RequestHistory.created_at))
                .offset(offset)
                .limit(limit)
                .all()
            )

            items = [
                HistoryListItem(
                    id=r.id,
                    created_at=r.created_at,
                    method=r.method,  # type: ignore[arg-type]
                    url=r.url,
                    status_code=r.status_code,
                    status_text=r.status_text,
                    status_category=r.status_category,  # type: ignore[arg-type]
                    duration_ms=r.duration_ms,
                    response_size=r.response_size,
                    content_type=r.content_type,
                    success=r.success,
                    error=r.error,  # type: ignore[arg-type]
                )
                for r in records
            ]
            return HistoryListResponse(items=items, total=total)
        finally:
            if close_session:
                db.close()

    @staticmethod
    def get_history_detail(
        record_id: str,
        db: Session | None = None,
    ) -> HistoryDetailResponse | None:
        """Retrieve complete history record for full inspection and reproduction."""
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            r = db.query(RequestHistory).filter(RequestHistory.id == record_id).first()
            if not r:
                return None

            return HistoryDetailResponse(
                id=r.id,
                created_at=r.created_at,
                method=r.method,  # type: ignore[arg-type]
                url=r.url,
                query_params=r.query_params,
                request_headers=r.request_headers,
                request_body=r.request_body,
                request_body_type=r.request_body_type,
                success=r.success,
                status_code=r.status_code,
                status_text=r.status_text,
                status_category=r.status_category,  # type: ignore[arg-type]
                duration_ms=r.duration_ms,
                content_type=r.content_type,
                response_size=r.response_size,
                response_body=r.response_body,
                response_body_truncated=r.response_body_truncated,
                response_headers=r.response_headers,
                dns_analysis=r.dns_analysis,  # type: ignore[arg-type]
                header_analysis=r.header_analysis,  # type: ignore[arg-type]
                cors_analysis=r.cors_analysis,  # type: ignore[arg-type]
                options_analysis=r.options_analysis,  # type: ignore[arg-type]
                request_journey=r.request_journey,  # type: ignore[arg-type]
                error=r.error,  # type: ignore[arg-type]
            )
        finally:
            if close_session:
                db.close()

    @staticmethod
    def delete_history_item(
        record_id: str,
        db: Session | None = None,
    ) -> bool:
        """Delete a single history item by id. Returns True if deleted, False if not found."""
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            r = db.query(RequestHistory).filter(RequestHistory.id == record_id).first()
            if not r:
                return False
            db.delete(r)
            db.commit()
            return True
        except Exception:
            db.rollback()
            raise
        finally:
            if close_session:
                db.close()

    @staticmethod
    def clear_all_history(db: Session | None = None) -> int:
        """Delete all history records. Returns count of deleted rows."""
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            count = db.query(RequestHistory).delete()
            db.commit()
            return count
        except Exception:
            db.rollback()
            raise
        finally:
            if close_session:
                db.close()


history_service = HistoryService()
