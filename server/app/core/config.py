"""TRACE Backend Core Configuration."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "TRACE API & Network Analysis"
    app_version: str = "0.1.0"
    debug: bool = True
    api_prefix: str = "/api"


settings = Settings()
