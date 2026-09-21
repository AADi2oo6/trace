"""TRACE Request Service Layer — Real HTTP Request Execution Engine."""

import json
import logging
import time
import uuid
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.core.errors import ErrorCode, ErrorDetail
from app.core.security import SecurityValidationError, validate_url_for_ssrf
from app.schemas.request import DnsAnalysis, RequestCreate, RequestResponse
from app.services.cors_analyzer import cors_analyzer
from app.services.dns_inspector import dns_inspector
from app.services.header_analyzer import header_analyzer
from app.services.options_inspector import options_inspector
from app.services.request_journey import request_journey_service
from app.services.response_inspector import response_inspector

logger = logging.getLogger("trace.request_service")


class RequestService:
    """Service handling the lifecycle of API request execution, security, and diagnostics."""

    def __init__(self, transport: httpx.AsyncBaseTransport | None = None) -> None:
        self._transport = transport

    @property
    def transport(self) -> httpx.AsyncBaseTransport | None:
        return self._transport

    @transport.setter
    def transport(self, value: httpx.AsyncBaseTransport | None) -> None:
        self._transport = value

    async def execute_request(self, request_data: RequestCreate) -> RequestResponse:
        """Execute an outbound HTTP request with bounded timeouts, redirect limits, and SSRF checks."""
        request_id = f"req_{uuid.uuid4().hex[:12]}"
        start_time = time.perf_counter()
        method = request_data.method.value
        current_url = request_data.url

        # Prepare request payload & headers
        headers = dict(request_data.headers)
        params = dict(request_data.query_params) if request_data.query_params else None
        body = request_data.body

        json_data: Any | None = None
        content: bytes | None = None

        if body is not None:
            if isinstance(body, (dict, list)):
                json_data = body
            elif isinstance(body, str):
                content = body.encode("utf-8")
            else:
                content = str(body).encode("utf-8")

        redirect_count = 0
        dns_analysis_result: DnsAnalysis | None = None

        try:
            # Enforce finite timeout and security boundary
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(settings.request_timeout_seconds),
                transport=self._transport,
            ) as client:
                while True:
                    # 1. SSRF Validation for current target (including redirect hops)
                    validate_url_for_ssrf(current_url)

                    # 2. Perform DNS Inspection for current target
                    dns_analysis_result = await dns_inspector.inspect(current_url)

                    # 3. Build request
                    req = client.build_request(
                        method=method,
                        url=current_url,
                        headers=headers,
                        params=params if redirect_count == 0 else None,
                        json=json_data if redirect_count == 0 else None,
                        content=content if redirect_count == 0 else None,
                    )

                    # 4. Send streaming request to bound memory
                    response = await client.send(req, stream=True)

                    # 5. Handle bounded redirects manually to protect against SSRF redirect bypass
                    if response.is_redirect:
                        await response.aclose()
                        redirect_count += 1
                        if redirect_count > settings.max_redirects:
                            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
                            self._log_result(request_id, method, current_url, duration_ms, False, ErrorCode.REDIRECT_ERROR.value)
                            journey = request_journey_service.build(
                                url=current_url,
                                method=method,
                                total_duration_ms=duration_ms,
                                dns_analysis=dns_analysis_result,
                                success=False,
                                error_message=f"Exceeded maximum allowed redirect limit of {settings.max_redirects}.",
                            )
                            return RequestResponse(
                                success=False,
                                request_id=request_id,
                                method=method,
                                url=current_url,
                                duration_ms=duration_ms,
                                dns_analysis=dns_analysis_result,
                                request_journey=journey,
                                error=ErrorDetail(
                                    code=ErrorCode.REDIRECT_ERROR,
                                    message=f"Exceeded maximum allowed redirect limit of {settings.max_redirects}.",
                                ),
                            )

                        location = response.headers.get("location")
                        if not location:
                            break

                        # Resolve relative or absolute redirect target URL
                        current_url = str(response.url.join(location))

                        # Standard HTTP redirect semantics for method changes
                        if response.status_code in (301, 302, 303) and method not in ("GET", "HEAD"):
                            method = "GET"
                            json_data = None
                            content = None
                        continue
                    else:
                        break

                # 5. Check Content-Length if advertised
                try:
                    content_length = response.headers.get("content-length")
                    if content_length and content_length.isdigit():
                        if int(content_length) > settings.max_response_bytes:
                            await response.aclose()
                            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
                            self._log_result(request_id, method, current_url, duration_ms, False, ErrorCode.RESPONSE_TOO_LARGE.value)
                            journey = request_journey_service.build(
                                url=str(response.url),
                                method=method,
                                total_duration_ms=duration_ms,
                                dns_analysis=dns_analysis_result,
                                success=False,
                                status_code=response.status_code,
                                error_message=f"Response Content-Length ({content_length} bytes) exceeds limit of {settings.max_response_bytes} bytes.",
                            )
                            return RequestResponse(
                                success=False,
                                request_id=request_id,
                                status_code=response.status_code,
                                method=method,
                                url=str(response.url),
                                duration_ms=duration_ms,
                                dns_analysis=dns_analysis_result,
                                request_journey=journey,
                                error=ErrorDetail(
                                    code=ErrorCode.RESPONSE_TOO_LARGE,
                                    message=f"Response Content-Length ({content_length} bytes) exceeds limit of {settings.max_response_bytes} bytes.",
                                ),
                            )

                    # 6. Stream and accumulate response bytes up to size limit
                    chunks: list[bytes] = []
                    total_bytes = 0
                    async for chunk in response.aiter_bytes():
                        total_bytes += len(chunk)
                        if total_bytes > settings.max_response_bytes:
                            await response.aclose()
                            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
                            self._log_result(request_id, method, current_url, duration_ms, False, ErrorCode.RESPONSE_TOO_LARGE.value)
                            journey = request_journey_service.build(
                                url=str(response.url),
                                method=method,
                                total_duration_ms=duration_ms,
                                dns_analysis=dns_analysis_result,
                                success=False,
                                status_code=response.status_code,
                                error_message=f"Response payload exceeded maximum allowed size of {settings.max_response_bytes} bytes.",
                            )
                            return RequestResponse(
                                success=False,
                                request_id=request_id,
                                status_code=response.status_code,
                                method=method,
                                url=str(response.url),
                                duration_ms=duration_ms,
                                dns_analysis=dns_analysis_result,
                                request_journey=journey,
                                error=ErrorDetail(
                                    code=ErrorCode.RESPONSE_TOO_LARGE,
                                    message=f"Response payload exceeded maximum allowed size of {settings.max_response_bytes} bytes.",
                                ),
                            )
                        chunks.append(chunk)

                    raw_bytes = b"".join(chunks)
                finally:
                    await response.aclose()

            # 7. Normalize and inspect response via ResponseInspector
            response_headers = {k: v for k, v in response.headers.items()}
            inspected = response_inspector.inspect(
                status_code=response.status_code,
                headers=response_headers,
                raw_bytes=raw_bytes,
            )

            # 8. Analyze headers via HeaderAnalyzer (request and response)
            analyzed_headers = header_analyzer.analyze_all(
                request_headers=headers,
                response_headers=inspected.headers,
            )

            # 9. Inspect OPTIONS capabilities and advertised policies if applicable
            options_result = options_inspector.inspect(
                method=method,
                response_headers=inspected.headers,
            )

            # 10. Analyze CORS configuration across request and response
            cors_result = cors_analyzer.analyze(
                request_method=method,
                request_headers=headers,
                response_headers=inspected.headers,
            )
            has_cors_resp_headers = any(k.lower().startswith("access-control-") for k in inspected.headers)
            cors_analysis_data = cors_result if (cors_result.is_cors_request or has_cors_resp_headers) else None

            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            self._log_result(request_id, method, str(response.url), duration_ms, True, str(response.status_code))

            journey = request_journey_service.build(
                url=str(response.url),
                method=method,
                total_duration_ms=duration_ms,
                dns_analysis=dns_analysis_result,
                success=True,
                status_code=inspected.status_code,
            )

            return RequestResponse(
                success=True,
                status_code=inspected.status_code,
                status_text=inspected.status_text,
                status_category=inspected.status_category,
                message="Request executed successfully.",
                request_id=request_id,
                method=method,
                url=str(response.url),
                headers=inspected.headers,
                content_type=inspected.content_type,
                body=inspected.body,
                body_type=inspected.body_type,
                body_size=inspected.body_size,
                duration_ms=duration_ms,
                header_analysis=analyzed_headers,
                options_analysis=options_result,
                cors_analysis=cors_analysis_data,
                dns_analysis=dns_analysis_result,
                request_journey=journey,
                error=None,
            )

        except SecurityValidationError as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            self._log_result(request_id, method, current_url, duration_ms, False, exc.code.value)
            if exc.code == ErrorCode.DNS_ERROR and dns_analysis_result is None:
                try:
                    dns_analysis_result = await dns_inspector.inspect(current_url)
                except Exception:
                    pass
            journey = request_journey_service.build(
                url=current_url,
                method=method,
                total_duration_ms=duration_ms,
                dns_analysis=dns_analysis_result,
                success=False,
                error_message=exc.message,
            )
            return RequestResponse(
                success=False,
                request_id=request_id,
                method=method,
                url=current_url,
                duration_ms=duration_ms,
                dns_analysis=dns_analysis_result,
                request_journey=journey,
                error=ErrorDetail(code=exc.code, message=exc.message),
            )

        except httpx.TimeoutException:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            self._log_result(request_id, method, current_url, duration_ms, False, ErrorCode.REQUEST_TIMEOUT.value)
            journey = request_journey_service.build(
                url=current_url,
                method=method,
                total_duration_ms=duration_ms,
                dns_analysis=dns_analysis_result,
                success=False,
                error_message="The target server did not respond within the allowed time.",
            )
            return RequestResponse(
                success=False,
                request_id=request_id,
                method=method,
                url=current_url,
                duration_ms=duration_ms,
                dns_analysis=dns_analysis_result,
                request_journey=journey,
                error=ErrorDetail(
                    code=ErrorCode.REQUEST_TIMEOUT,
                    message="The target server did not respond within the allowed time.",
                ),
            )

        except (httpx.ConnectError, httpx.NetworkError) as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            self._log_result(request_id, method, current_url, duration_ms, False, ErrorCode.CONNECTION_ERROR.value)
            journey = request_journey_service.build(
                url=current_url,
                method=method,
                total_duration_ms=duration_ms,
                dns_analysis=dns_analysis_result,
                success=False,
                error_message=f"Failed to connect to target server: {exc.__class__.__name__}",
            )
            return RequestResponse(
                success=False,
                request_id=request_id,
                method=method,
                url=current_url,
                duration_ms=duration_ms,
                dns_analysis=dns_analysis_result,
                request_journey=journey,
                error=ErrorDetail(
                    code=ErrorCode.CONNECTION_ERROR,
                    message=f"Failed to connect to target server: {exc.__class__.__name__}",
                ),
            )

        except httpx.UnsupportedProtocol as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            self._log_result(request_id, method, current_url, duration_ms, False, ErrorCode.INVALID_URL.value)
            journey = request_journey_service.build(
                url=current_url,
                method=method,
                total_duration_ms=duration_ms,
                dns_analysis=dns_analysis_result,
                success=False,
                error_message="Unsupported or invalid URL protocol.",
            )
            return RequestResponse(
                success=False,
                request_id=request_id,
                method=method,
                url=current_url,
                duration_ms=duration_ms,
                dns_analysis=dns_analysis_result,
                request_journey=journey,
                error=ErrorDetail(
                    code=ErrorCode.INVALID_URL,
                    message="Unsupported or invalid URL protocol.",
                ),
            )

        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            self._log_result(request_id, method, current_url, duration_ms, False, "UNEXPECTED_ERROR")
            journey = request_journey_service.build(
                url=current_url,
                method=method,
                total_duration_ms=duration_ms,
                dns_analysis=dns_analysis_result,
                success=False,
                error_message=f"An unexpected error occurred during request execution: {exc.__class__.__name__}",
            )
            return RequestResponse(
                success=False,
                request_id=request_id,
                method=method,
                url=current_url,
                duration_ms=duration_ms,
                dns_analysis=dns_analysis_result,
                request_journey=journey,
                error=ErrorDetail(
                    code=ErrorCode.CONNECTION_ERROR,
                    message=f"An unexpected error occurred during request execution: {exc.__class__.__name__}",
                ),
            )

    @staticmethod
    def _log_result(
        request_id: str,
        method: str,
        target_url: str,
        duration_ms: float,
        success: bool,
        detail: str,
    ) -> None:
        """Minimal sanitized logging without secrets, credentials, or payloads."""
        host = urlparse(target_url).hostname or "unknown"
        if success:
            logger.info(
                "Request executed | ID: %s | Method: %s | Host: %s | Status: %s | Duration: %sms",
                request_id,
                method,
                host,
                detail,
                duration_ms,
            )
        else:
            logger.warning(
                "Request failed | ID: %s | Method: %s | Host: %s | Reason: %s | Duration: %sms",
                request_id,
                method,
                host,
                detail,
                duration_ms,
            )


request_service = RequestService()
