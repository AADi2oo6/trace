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
    max_response_bytes: int = 10 * 1024 * 1024  # 10 MB limit for full media/explorer payloads
    allowed_schemes: tuple[str, ...] = ("http", "https")

    # Artifact Storage Settings
    artifact_storage_dir: str = "./data/artifacts"
    artifact_max_age_seconds: int = 3600  # 1 hour retention
    artifact_max_count: int = 200

    # Database Configuration
    database_url: str = "sqlite:///./data/trace.db"

    # Monitoring & Performance Analytics Settings
    monitoring_min_interval_seconds: int = 60
    monitoring_default_interval_seconds: int = 300
    monitoring_max_concurrent_checks: int = 5
    monitoring_retention_days: int = 30
    monitoring_check_tick_seconds: float = 2.0


settings = Settings()
