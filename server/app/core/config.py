"""TRACE Backend Core Configuration."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "TRACE API & Network Analysis"
    app_version: str = "0.1.0"
    debug: bool = True
    api_prefix: str = "/api"

    # Browser Development CORS Origins
    cors_allowed_origins: tuple[str, ...] = (
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    )

    # Request Execution Engine Limits
    request_timeout_seconds: float = 10.0
    max_redirects: int = 5
    max_response_bytes: int = 2 * 1024 * 1024  # 2 MB limit
    allowed_schemes: tuple[str, ...] = ("http", "https")


settings = Settings()
