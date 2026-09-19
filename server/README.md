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
│   │   ├── config.py          # Application settings & execution limits
│   │   ├── errors.py          # Standardized ErrorCode enum & ErrorDetail models
│   │   └── security.py        # SSRF validation & target IP inspection
│   ├── api/
│   │   └── routes/
│   │       └── requests.py    # Request execution routes (POST /api/requests)
│   ├── schemas/
│   │   └── request.py         # RequestCreate & RequestResponse Pydantic models
│   ├── services/
│   │   └── request_service.py # Bounded HTTP request execution engine (httpx)
│   ├── models/                # SQLAlchemy database models (future)
│   ├── analyzers/             # Header, CORS, OPTIONS, and DNS analyzers (future)
│   └── utils/                 # General utility helpers
├── tests/
│   ├── test_execution.py      # Real HTTP request execution & response handling
│   ├── test_health.py         # Health check tests
│   ├── test_security.py       # SSRF protection and network boundary tests
│   └── test_validation.py     # Schema constraints & method validation tests
├── pyproject.toml             # uv package and dependency configuration
├── uv.lock                    # Locked dependency specifications
└── .python-version            # Python version pin (3.13)
```

---

## API Contract

### Request Execution

* **Endpoint**: `POST /api/requests` (alias: `POST /api/requests/execute`)
* **Purpose**: Receive user-defined HTTP request specifications, validate structure, inspect for security hazards, and execute outbound requests.

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
  "success": true,
  "status_code": 200,
  "message": "Request executed successfully.",
  "request_id": "req_a1b2c3d4e5f6",
  "method": "GET",
  "url": "https://example.com/api",
  "headers": {
    "content-type": "application/json",
    "server": "nginx"
  },
  "body": "{\n  \"status\": \"ok\"\n}",
  "duration_ms": 142.5,
  "error": null
}
```

---

## Security & Execution Controls

The execution engine incorporates mandatory guardrails before and during outbound communication:

1. **SSRF Protection (`app.core.security`)**:
   * Blocks loopback (`127.0.0.0/8`, `::1`), private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`), link-local (`169.254.0.0/16`, `fe80::/10`), IPv4-mapped IPv6, carrier-grade NAT (`100.64.0.0/10`), and cloud metadata (`169.254.169.254`).
   * Resolves domain names prior to execution and rejects any host mapping to blocked address space.
2. **Finite Timeout**: Strict 10-second timeout on all outbound requests to prevent connection hanging.
3. **Bounded Redirects**: Maximum of 5 redirects; each redirect hop is re-validated against SSRF to prevent public-to-private redirect pivoting.
4. **Response Body Cap**: Maximum payload size capped at 2 MB. Stream aborts and returns `RESPONSE_TOO_LARGE` if exceeded.
5. **Safe Body Representation**: Plain text and JSON are decoded with fallback protection (`errors="replace"`); binary files are summarized safely without dumping raw bytes.
6. **Sanitized Logging**: Request metadata (ID, method, host, status, duration) is logged without recording credentials, tokens, or bodies.

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
