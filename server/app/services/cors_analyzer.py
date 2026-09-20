"""CORS analyzer service for evaluating CORS configurations across HTTP request and response."""

from collections.abc import Mapping
from typing import Any

from app.schemas.request import CorsAnalysis


class CorsAnalyzer:
    """Service providing structured, technically accurate analysis of CORS configuration."""

    @classmethod
    def analyze(
        cls,
        request_method: str,
        request_headers: Mapping[str, str],
        response_headers: Mapping[str, str],
    ) -> CorsAnalysis:
        """Analyze HTTP exchange for CORS headers, origin matching, and preflight rules."""
        # Case-insensitive header lookups
        req_lower: dict[str, str] = {
            k.strip().lower(): v for k, v in request_headers.items()
        }
        resp_lower: dict[str, str] = {
            k.strip().lower(): v for k, v in response_headers.items()
        }

        # Check for presence of CORS request and response headers
        has_cors_request = any(
            h in req_lower
            for h in ("origin", "access-control-request-method", "access-control-request-headers")
        )
        has_cors_response = any(
            k.startswith("access-control-")
            for k in resp_lower
        )

        if not has_cors_request and not has_cors_response:
            return CorsAnalysis(
                is_cors_request=False,
                observations=["No CORS-related request or response headers were detected."],
            )

        observations: list[str] = []

        # 1. Origin Analysis
        request_origin: str | None = None
        if "origin" in req_lower:
            raw_orig = req_lower["origin"].strip()
            request_origin = raw_orig if raw_orig else None

        allowed_origin: str | None = None
        if "access-control-allow-origin" in resp_lower:
            raw_allowed = resp_lower["access-control-allow-origin"].strip()
            allowed_origin = raw_allowed if raw_allowed else None

        wildcard_origin = allowed_origin == "*"
        origin_allowed: bool | None = None

        if request_origin is None:
            origin_allowed = None
            if allowed_origin is not None:
                observations.append(
                    f"Server returned Access-Control-Allow-Origin: '{allowed_origin}', but no Origin header was supplied in the request."
                )
            else:
                observations.append("No Origin header was supplied in the request.")
        else:
            observations.append("Origin was supplied by the request.")
            if allowed_origin is None:
                origin_allowed = False
                observations.append("No Access-Control-Allow-Origin header was returned by the server.")
            elif wildcard_origin:
                origin_allowed = True
                observations.append("The server uses wildcard origin (*).")
            else:
                # Exact match after case-insensitive scheme and host normalization
                if request_origin.strip().lower() == allowed_origin.strip().lower():
                    origin_allowed = True
                    observations.append("The server explicitly allows the requested origin.")
                else:
                    origin_allowed = False
                    observations.append(
                        f"The requested origin '{request_origin}' does not match the server-allowed origin '{allowed_origin}'."
                    )

        # 2. Requested Method Analysis (Independent of resource-level Allow)
        requested_method: str | None = None
        if "access-control-request-method" in req_lower:
            requested_method = req_lower["access-control-request-method"].strip().upper()
        elif has_cors_request:
            requested_method = request_method.strip().upper()

        allowed_methods: list[str] | None = None
        if "access-control-allow-methods" in resp_lower:
            raw_methods = [
                m.strip().upper()
                for m in resp_lower["access-control-allow-methods"].split(",")
                if m.strip()
            ]
            allowed_methods = list(dict.fromkeys(raw_methods))

        method_allowed: bool | None = None
        if requested_method is not None and allowed_methods is not None:
            if "*" in allowed_methods or requested_method in allowed_methods:
                method_allowed = True
                observations.append(
                    f"The requested method '{requested_method}' is listed in Access-Control-Allow-Methods."
                )
            else:
                method_allowed = False
                observations.append(
                    f"The requested method '{requested_method}' is not listed in Access-Control-Allow-Methods."
                )
        elif requested_method is not None and "access-control-request-method" in req_lower and allowed_methods is None:
            method_allowed = False
            observations.append(
                f"Access-Control-Request-Method '{requested_method}' was sent, but no Access-Control-Allow-Methods header was returned."
            )

        # 3. Requested Headers Analysis
        requested_headers: list[str] | None = None
        if "access-control-request-headers" in req_lower:
            raw_req_h = [
                h.strip()
                for h in req_lower["access-control-request-headers"].split(",")
                if h.strip()
            ]
            requested_headers = list(dict.fromkeys(raw_req_h))

        allowed_headers: list[str] | None = None
        if "access-control-allow-headers" in resp_lower:
            raw_allow_h = [
                h.strip()
                for h in resp_lower["access-control-allow-headers"].split(",")
                if h.strip()
            ]
            allowed_headers = list(dict.fromkeys(raw_allow_h))

        headers_allowed: bool | None = None
        if requested_headers is not None:
            if allowed_headers is not None:
                if "*" in allowed_headers:
                    headers_allowed = True
                    observations.append(
                        "All requested CORS headers are permitted by wildcard Access-Control-Allow-Headers."
                    )
                else:
                    allowed_lower = {h.lower() for h in allowed_headers}
                    missing = [h for h in requested_headers if h.lower() not in allowed_lower]
                    if not missing:
                        headers_allowed = True
                        observations.append("All requested CORS headers are listed in Access-Control-Allow-Headers.")
                    else:
                        headers_allowed = False
                        observations.append(
                            f"The following requested headers are not listed in Access-Control-Allow-Headers: {', '.join(missing)}."
                        )
            else:
                headers_allowed = False
                observations.append(
                    f"Requested headers ({', '.join(requested_headers)}) were sent, but no Access-Control-Allow-Headers header was returned."
                )

        # 4. Credentials Analysis
        allow_credentials: bool | None = None
        if "access-control-allow-credentials" in resp_lower:
            cred_val = resp_lower["access-control-allow-credentials"].strip().lower()
            if cred_val == "true":
                allow_credentials = True
                observations.append("Credentials are enabled (Access-Control-Allow-Credentials: true).")
            elif cred_val == "false":
                allow_credentials = False
                observations.append("Credentials are explicitly disabled (Access-Control-Allow-Credentials: false).")
        elif has_cors_request:
            observations.append("Credentials are not enabled.")

        # Wildcard Origin + Credentials combination check
        if wildcard_origin and allow_credentials is True:
            observations.append(
                "Wildcard origin '*' is combined with Access-Control-Allow-Credentials: true, which is restricted in browser CORS specifications."
            )

        # 5. Max-Age Analysis
        max_age: int | None = None
        if "access-control-max-age" in resp_lower:
            raw_max_age = resp_lower["access-control-max-age"].strip()
            try:
                parsed_age = int(raw_max_age)
                if parsed_age >= 0:
                    max_age = parsed_age
                    observations.append(
                        f"Access-Control-Max-Age permits preflight caching for {max_age} seconds."
                    )
            except ValueError:
                max_age = None

        # 6. Expose-Headers Analysis
        expose_headers: list[str] | None = None
        if "access-control-expose-headers" in resp_lower:
            raw_expose = [
                h.strip()
                for h in resp_lower["access-control-expose-headers"].split(",")
                if h.strip()
            ]
            expose_headers = list(dict.fromkeys(raw_expose))
            observations.append(
                f"Access-Control-Expose-Headers exposes: {', '.join(expose_headers)}."
            )

        return CorsAnalysis(
            is_cors_request=has_cors_request,
            request_origin=request_origin,
            allowed_origin=allowed_origin,
            origin_allowed=origin_allowed,
            wildcard_origin=wildcard_origin,
            requested_method=requested_method,
            allowed_methods=allowed_methods,
            method_allowed=method_allowed,
            requested_headers=requested_headers,
            allowed_headers=allowed_headers,
            headers_allowed=headers_allowed,
            allow_credentials=allow_credentials,
            max_age=max_age,
            expose_headers=expose_headers,
            observations=observations,
        )


cors_analyzer = CorsAnalyzer()
