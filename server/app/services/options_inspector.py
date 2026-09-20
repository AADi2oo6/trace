"""OPTIONS response inspector service for interpreting server-advertised capabilities and policies."""

from collections.abc import Mapping
from typing import Any

from app.schemas.request import OptionsAnalysis, OptionsCorsInfo


class OptionsInspector:
    """Service providing structured interpretation of HTTP OPTIONS responses."""

    @classmethod
    def inspect(
        cls,
        method: str,
        response_headers: Mapping[str, str],
    ) -> OptionsAnalysis | None:
        """Inspect response headers for an OPTIONS request.

        Returns None if the executed HTTP method is not OPTIONS.
        """
        if method.strip().upper() != "OPTIONS":
            return None

        # Build case-insensitive lookup dictionary for response headers
        headers_lower: dict[str, str] = {
            k.strip().lower(): v for k, v in response_headers.items()
        }

        observations: list[str] = []

        # 1. Parse Allow header
        has_allow = "allow" in headers_lower
        allowed_methods: list[str] = []

        if has_allow:
            raw_allow = headers_lower["allow"]
            raw_methods = [
                m.strip().upper()
                for m in raw_allow.split(",")
                if m.strip()
            ]
            # Deduplicate while preserving order
            allowed_methods = list(dict.fromkeys(raw_methods))

            if allowed_methods:
                observations.append(
                    f"The response advertises allowed methods through the Allow header: {', '.join(allowed_methods)}."
                )
            else:
                observations.append(
                    "The Allow header was present in the response but did not specify any methods."
                )
        else:
            observations.append("The response did not include an Allow header.")

        # 2. Extract and inspect CORS-related headers
        cors_info = cls._extract_cors_info(headers_lower, observations)

        return OptionsAnalysis(
            is_options_request=True,
            has_allow_header=has_allow,
            allowed_methods=allowed_methods,
            cors=cors_info,
            observations=observations,
        )

    @classmethod
    def _extract_cors_info(
        cls,
        headers_lower: dict[str, str],
        observations: list[str],
    ) -> OptionsCorsInfo | None:
        """Extract and structure CORS headers neutrally without browser decision logic."""
        cors_keys = (
            "access-control-allow-origin",
            "access-control-allow-methods",
            "access-control-allow-headers",
            "access-control-allow-credentials",
            "access-control-max-age",
            "access-control-expose-headers",
        )

        has_any_cors = any(k in headers_lower for k in cors_keys)
        if not has_any_cors:
            observations.append("No CORS-related headers were present in the response.")
            return None

        # Origin
        allow_origin: str | None = None
        if "access-control-allow-origin" in headers_lower:
            raw_origin = headers_lower["access-control-allow-origin"].strip()
            allow_origin = raw_origin if raw_origin else None

        # Methods (normalized to uppercase and deduplicated)
        allow_methods: list[str] | None = None
        if "access-control-allow-methods" in headers_lower:
            raw_methods = [
                m.strip().upper()
                for m in headers_lower["access-control-allow-methods"].split(",")
                if m.strip()
            ]
            allow_methods = list(dict.fromkeys(raw_methods))

        # Headers (preserving useful casing and deduplicated)
        allow_headers: list[str] | None = None
        if "access-control-allow-headers" in headers_lower:
            raw_headers = [
                h.strip()
                for h in headers_lower["access-control-allow-headers"].split(",")
                if h.strip()
            ]
            allow_headers = list(dict.fromkeys(raw_headers))

        # Credentials
        allow_credentials: bool | None = None
        if "access-control-allow-credentials" in headers_lower:
            cred_val = headers_lower["access-control-allow-credentials"].strip().lower()
            if cred_val == "true":
                allow_credentials = True
            elif cred_val == "false":
                allow_credentials = False
            else:
                allow_credentials = None

        # Max-Age (integer seconds)
        max_age: int | None = None
        if "access-control-max-age" in headers_lower:
            raw_max_age = headers_lower["access-control-max-age"].strip()
            try:
                parsed_age = int(raw_max_age)
                if parsed_age >= 0:
                    max_age = parsed_age
            except ValueError:
                max_age = None

        # Expose-Headers
        expose_headers: list[str] | None = None
        if "access-control-expose-headers" in headers_lower:
            raw_expose = [
                h.strip()
                for h in headers_lower["access-control-expose-headers"].split(",")
                if h.strip()
            ]
            expose_headers = list(dict.fromkeys(raw_expose))

        # Observations for CORS headers
        observations.append("CORS response headers are present.")

        if allow_origin is not None:
            observations.append(f"Access-Control-Allow-Origin is set to '{allow_origin}'.")

        if allow_methods is not None:
            observations.append(
                f"Access-Control-Allow-Methods advertises: {', '.join(allow_methods)}."
            )

        if allow_credentials is True:
            observations.append("Access-Control-Allow-Credentials is set to true.")
        elif allow_credentials is False:
            observations.append("Access-Control-Allow-Credentials is set to false.")

        if max_age is not None:
            observations.append(
                f"Access-Control-Max-Age permits preflight caching for {max_age} seconds."
            )

        return OptionsCorsInfo(
            allow_origin=allow_origin,
            allow_methods=allow_methods,
            allow_headers=allow_headers,
            allow_credentials=allow_credentials,
            max_age=max_age,
            expose_headers=expose_headers,
        )


options_inspector = OptionsInspector()
