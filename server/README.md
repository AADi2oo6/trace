# TRACE — Backend

FastAPI backend service and network analysis engine for the TRACE developer platform.

---

## Architecture

The backend follows a layered, service-oriented structure designed to decouple HTTP transport, schema validation, diagnostic services, and future persistence:

```text
server/
├── app/
│   ├── main.py                # FastAPI entrypoint, router aggregation & health check
│   ├── core/
│   │   ├── config.py          # Application settings & environment configuration
│   │   └── errors.py          # Standardized ErrorCode enum & ErrorDetail models
│   ├── api/
│   │   └── routes/
│   │       └── requests.py    # Request execution routes (POST /api/requests)
│   ├── schemas/
│   │   └── request.py         # RequestCreate & RequestResponse Pydantic models
│   ├── services/
│   │   └── request_service.py # Business logic & future request execution pipeline
│   ├── models/                # SQLAlchemy database models (future)
│   ├── analyzers/             # Header, CORS, OPTIONS, and DNS analyzers (future)
│   └── utils/                 # General utility helpers
├── tests/
│   ├── test_health.py         # Health check tests
│   └── test_requests.py       # API contract validation & execution tests
├── pyproject.toml             # uv package and dependency configuration
├── uv.lock                    # Locked dependency specifications
└── .python-version            # Python version pin (3.13)
```

---

## API Contract

### Request Execution

* **Endpoint**: `POST /api/requests` (alias: `POST /api/requests/execute`)
* **Purpose**: Receive user-defined HTTP request specifications, validate structure, and dispatch to execution service.

#### Request Schema (`RequestCreate`)

```json
{
  "method": "GET",
  "url": "https://example.com/api",
  "headers": {
    "Accept": "application/json"
  },
  "params": {
    "limit": "10"
  },
  "body": null
}
```

* `method` *(string, required)*: One of `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS` (case-insensitive, normalized to uppercase).
* `url` *(string, required)*: Valid HTTP or HTTPS target URL with host.
* `headers` *(object, optional)*: Key-value string pairs.
* `params` *(object, optional)*: Query parameters key-value string pairs (aliased to `query_params`).
* `body` *(string | object | array | null, optional)*: Payload data.

#### Response Schema (`RequestResponse`)

```json
{
  "success": false,
  "status_code": null,
  "message": "HTTP request execution is not implemented yet.",
  "request_id": null,
  "method": "GET",
  "url": "https://example.com/api",
  "headers": null,
  "body": null,
  "duration_ms": null,
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "HTTP request execution is not implemented yet.",
    "details": null
  }
}
```

---

## Development & Environment

This service is managed exclusively using [uv](https://astral.sh/uv).

### Synchronization

```bash
uv sync
```

### Running Locally

```bash
uv run uvicorn app.main:app --reload --port 8000
```

* Health check: `http://127.0.0.1:8000/health`
* Swagger UI: `http://127.0.0.1:8000/docs`
* OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

### Running Tests

```bash
uv run pytest
```
