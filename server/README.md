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
│   │   ├── request_service.py # Bounded HTTP request execution engine (httpx)
│   │   ├── response_inspector.py # Response normalization, status & body inspector
│   │   └── header_analyzer.py # Technical header categorization & neutral observations
│   ├── models/                # SQLAlchemy database models (future)
│   ├── analyzers/             # Header, CORS, OPTIONS, and DNS analyzers (future)
│   └── utils/                 # General utility helpers
├── tests/
│   ├── conftest.py            # Shared test fixtures & deterministic mock DNS
│   ├── test_execution.py      # Real HTTP request execution & response handling
│   ├── test_header_analyzer.py # Technical header categorization & masking tests
│   ├── test_health.py         # Health check tests
│   ├── test_response_inspector.py # Response Inspector status, body type & edge case tests
│   ├── test_security.py       # SSRF protection and network boundary tests
│   └── test_validation.py     # Schema constraints & method validation tests
├── pyproject.toml             # uv package and dependency configuration
├── uv.lock                    # Locked dependency specifications
└── .python-version            # Python version pin (3.13)
```

---

## API Contract

### Request Execution & Inspection

* **Endpoint**: `POST /api/requests` (alias: `POST /api/requests/execute`)
* **Purpose**: Receive user-defined HTTP request specifications, validate structure, inspect for security hazards, execute outbound requests, and normalize response metadata.

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
  "status_text": "OK",
  "status_category": "success",
  "message": "Request executed successfully.",
  "request_id": "req_a1b2c3d4e5f6",
  "method": "GET",
  "url": "https://example.com/api",
  "headers": {
    "content-type": "application/json; charset=utf-8",
    "server": "nginx"
  },
  "content_type": "application/json; charset=utf-8",
  "body": "{\n  \"status\": \"ok\"\n}",
  "body_type": "json",
  "body_size": 18,
  "duration_ms": 142.5,
  "header_analysis": [
    {
      "name": "Authorization",
      "value": "Bearer token",
      "category": "Authentication",
      "description": "Contains authentication credentials used to authenticate the client to the server.",
      "source": "request",
      "observations": [
        "Client authentication credentials transmitted."
      ]
    },
    {
      "name": "content-type",
      "value": "application/json; charset=utf-8",
      "category": "Content",
      "description": "Indicates the original media type of the resource before any encoding.",
      "source": "response",
      "observations": null
    }
  ],
  "error": null
}
```

* `status_category`: Normalized RFC range (`informational`, `success`, `redirection`, `client_error`, `server_error`).
* `status_text`: Standard HTTP reason phrase (e.g., `OK`, `Created`, `Not Found`).
* `body_type`: Normalized body format classification (`json`, `text`, `html`, `empty`, `binary`).
* `body_size`: Exact byte count of the received response body.
* `body`: Safe string representation (formatted JSON or text; `null` for binary or empty payloads).
* `header_analysis`: List of categorized headers with source attribution and technical observations.

---

## Response Inspector Engine (`app.services.response_inspector`)

The Response Inspector normalizes response data for frontend display:
1. **Status Code & Reason**: Maps numeric status codes to standard reason phrases and RFC categories.
2. **Body Format Classification**:
   * **JSON**: Detects JSON content-types or structure, verifies parsing, and pretty-prints formatting. Malformed JSON with `application/json` falls back safely to plain text without crashing.
   * **HTML**: Identifies HTML markup via MIME type or DOCTYPE tags.
   * **Text**: Handles plain text formats cleanly.
   * **Empty**: Gracefully identifies 0-byte or 204 No Content payloads (`body = null`, `body_size = 0`).
   * **Binary**: Detects null bytes and media streams (`image/*`, `video/*`, `audio/*`, `application/octet-stream`, `application/pdf`, etc.), returning `body = null` with exact byte counts to prevent raw byte corruption.

---

## Header Analyzer Engine (`app.services.header_analyzer`)

The Header Analyzer categorizes HTTP headers and attaches neutral, informative observations:
1. **Source Separation**: Strictly delineates request headers (`source: "request"`) from response headers (`source: "response"`).
2. **Canonical Categorization**: Categorizes headers into 11 controlled RFC categories:
   * `General` (`date`, `connection`, `trailer`)
   * `Content` (`content-type`, `content-length`, `content-encoding`, etc.)
   * `Caching` (`cache-control`, `etag`, `expires`, `if-none-match`, etc.)
   * `Security` (`strict-transport-security`, `content-security-policy`, `x-content-type-options`, `x-frame-options`, etc.)
   * `Authentication` (`authorization`, `www-authenticate`, `proxy-authenticate`)
   * `CORS` (`access-control-allow-origin`, `origin`, `access-control-allow-methods`, etc.)
   * `Cookies` (`cookie`, `set-cookie`)
   * `Connection` (`connection`, `keep-alive`, `upgrade`, `transfer-encoding`)
   * `Redirection` (`location`)
   * `Server` (`server`, `via`, `x-powered-by`)
   * `Other` (custom headers such as `x-custom-*` or unrecognized names)
3. **Neutral Observations**: Generates technical observations (e.g. HSTS `includeSubDomains`, `no-store` caching directive, `SameSite` / `Secure` cookie attributes) without speculative security scoring.
4. **Credential Protection**: Includes masking utilities (`mask_sensitive_value`) for Authorization bearer/basic tokens and Cookie session values. Headers are never logged to console or file logs.

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
