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
│   │   ├── header_analyzer.py # Technical header categorization & neutral observations
│   │   ├── options_inspector.py # Server capability & advertised policy interpreter
│   │   ├── cors_analyzer.py   # Cross-origin policy & header matching analyzer
│   │   ├── dns_inspector.py   # Asynchronous DNS resolution & address inspector
│   │   └── request_journey.py # Structured request lifecycle & truthful phase synthesizer
│   ├── models/                # SQLAlchemy database models (future)
│   ├── analyzers/             # Header, CORS, OPTIONS, and DNS analyzers (future)
│   └── utils/                 # General utility helpers
├── tests/
│   ├── conftest.py            # Shared test fixtures & deterministic mock DNS
│   ├── test_cors_analyzer.py  # CORS rules, origin, method & header matching tests
│   ├── test_cors_middleware.py # Browser-to-backend CORS preflight & origin permission tests
│   ├── test_dns_inspector.py  # DNS resolution, IPv4/IPv6 & timing tests
│   ├── test_execution.py      # Real HTTP request execution & response handling
│   ├── test_header_analyzer.py # Technical header categorization & masking tests
│   ├── test_health.py         # Health check tests
│   ├── test_options_inspector.py # OPTIONS capabilities and CORS header extraction tests
│   ├── test_request_journey.py # Request journey lifecycle, phase ordering & technical honesty tests
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
  "options_analysis": {
    "is_options_request": true,
    "has_allow_header": true,
    "allowed_methods": ["GET", "POST", "OPTIONS"],
    "cors": {
      "allow_origin": "*",
      "allow_methods": ["GET", "POST"],
      "allow_headers": ["Content-Type"],
      "allow_credentials": null,
      "max_age": 300,
      "expose_headers": null
    },
    "observations": [
      "The response advertises allowed methods through the Allow header: GET, POST, OPTIONS.",
      "CORS response headers are present.",
      "Access-Control-Allow-Origin is set to '*'.",
      "Access-Control-Allow-Methods advertises: GET, POST.",
      "Access-Control-Max-Age permits preflight caching for 300 seconds."
    ]
  },
  "cors_analysis": {
    "is_cors_request": true,
    "request_origin": "https://myapp.dev",
    "allowed_origin": "https://myapp.dev",
    "origin_allowed": true,
    "wildcard_origin": false,
    "requested_method": "GET",
    "allowed_methods": ["GET", "POST"],
    "method_allowed": true,
    "requested_headers": null,
    "allowed_headers": null,
    "headers_allowed": null,
    "allow_credentials": true,
    "max_age": null,
    "expose_headers": null,
    "observations": [
      "Origin was supplied by the request.",
      "The server explicitly allows the requested origin.",
      "Credentials are enabled (Access-Control-Allow-Credentials: true)."
    ]
  },
  "dns_analysis": {
    "hostname": "myapp.dev",
    "resolved": true,
    "ipv4_addresses": ["93.184.216.34"],
    "ipv6_addresses": ["2606:2800:220:1:248:1893:25c8:1946"],
    "resolution_time_ms": 12.4,
    "error": null,
    "observations": [
      "Hostname resolved successfully.",
      "Resolved 1 IPv4 address(es): 93.184.216.34.",
      "Resolved 1 IPv6 address(es): 2606:2800:220:1:248:1893:25c8:1946."
    ]
  },
  "request_journey": {
    "total_duration_ms": 142.5,
    "completed": true,
    "phases": [
      {
        "name": "dns",
        "status": "completed",
        "duration_ms": 12.4,
        "source": "dns_inspector",
        "observations": ["Resolved hostname 'myapp.dev' via DNS in 12.40 ms."]
      },
      {
        "name": "connection",
        "status": "unavailable",
        "duration_ms": null,
        "source": "derived",
        "observations": ["TCP connection timing is not independently measured by the current HTTP transport."]
      },
      {
        "name": "tls",
        "status": "unavailable",
        "duration_ms": null,
        "source": "derived",
        "observations": ["TLS handshake timing is not independently measured by the current HTTP transport."]
      },
      {
        "name": "http",
        "status": "completed",
        "duration_ms": 142.5,
        "source": "http_execution",
        "observations": ["HTTP GET exchange completed in 142.50 ms."]
      },
      {
        "name": "response",
        "status": "completed",
        "duration_ms": null,
        "source": "response_inspector",
        "observations": ["Received HTTP 200 response."]
      }
    ],
    "observations": [
      "Request journey completed successfully in 142.50 ms.",
      "TCP connection and TLS handshake timings are omitted in accordance with technical honesty principles."
    ]
  },
  "error": null
}
```

* `status_category`: Normalized RFC range (`informational`, `success`, `redirection`, `client_error`, `server_error`).
* `status_text`: Standard HTTP reason phrase (e.g., `OK`, `Created`, `Not Found`).
* `body_type`: Normalized body format classification (`json`, `text`, `html`, `empty`, `binary`).
* `body_size`: Exact byte count of the received response body.
* `body`: Safe string representation (formatted JSON or text; `null` for binary or empty payloads).
* `header_analysis`: List of categorized headers with source attribution and technical observations.
* `options_analysis`: Structured interpretation of server capabilities and CORS policies (populated only for `OPTIONS` requests).
* `cors_analysis`: Technical evaluation of CORS configurations and origin/method/header matches (populated when CORS headers exist).
* `dns_analysis`: Structured DNS resolution details (hostname, resolved IPv4/IPv6 addresses, lookup duration in ms).
* `request_journey`: Truthful representation of the end-to-end request lifecycle with independent phase measurements.

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

## OPTIONS Inspector Engine (`app.services.options_inspector`)

The OPTIONS Inspector interprets server capabilities and advertised policies specifically for `OPTIONS` requests:
1. **Targeted Execution**: Only runs when the executed HTTP method is `OPTIONS`. For all other methods, `options_analysis` evaluates to `null`.
2. **`Allow` Header Analysis**:
   * Parses and normalizes method names to uppercase (e.g., `GET`, `POST`, `PUT`, `DELETE`).
   * Deduplicates duplicate entries while preserving server-declared ordering.
   * Handles missing `Allow` headers gracefully with neutral observations without assuming failure or an empty capability set.
3. **CORS Headers Extraction**:
   * Extracts advertised CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Allow-Credentials`, `Access-Control-Max-Age`, `Access-Control-Expose-Headers`).
   * Normalizes CORS methods to uppercase, trims allowed headers, and parses boolean credentials and integer max-age.
   * Handles non-CORS OPTIONS requests cleanly (`cors: null` with neutral observation).
4. **Strict Architectural Separation**:
   * Resource-level allowed methods (`Allow`) and preflight CORS methods (`Access-Control-Allow-Methods`) are captured in dedicated fields and never conflated.
5. **Neutral Observations**:
   * Emits factual observations explaining what the server advertises, without speculative browser simulation or blocking decisions.

---

## CORS Analyzer Engine (`app.services.cors_analyzer`)

The CORS Analyzer evaluates cross-origin resource sharing configurations across request and response exchanges:
1. **Scope & Principles**:
   * Analyzes the HTTP exchange neutrally. It does NOT assert that the backend client itself is blocked, recognizing that CORS enforcement is primarily a browser responsibility.
   * Keeps resource-level `Allow` headers completely separated from CORS-level `Access-Control-Allow-Methods`.
2. **Origin Analysis**:
   * Performs exact normalized matching between the requested `Origin` and `Access-Control-Allow-Origin`.
   * Handles wildcard origins (`*`) without treating them as errors.
   * Highlights restricted browser combinations when `Access-Control-Allow-Origin: *` is combined with `Access-Control-Allow-Credentials: true`.
3. **Method & Header Validation**:
   * Evaluates requested methods (`Access-Control-Request-Method` or request method) against `Access-Control-Allow-Methods` case-insensitively and whitespace-tolerantly.
   * Evaluates requested headers (`Access-Control-Request-Headers`) against `Access-Control-Allow-Headers` case-insensitively, explicitly identifying unlisted headers.
4. **Credentials & Preflight Caching**:
   * Safely parses `Access-Control-Allow-Credentials` into boolean states.
   * Parses non-negative integer seconds from `Access-Control-Max-Age` without failing on malformed values.
   * Normalizes script-exposed headers from `Access-Control-Expose-Headers`.
5. **Technical Observations**:
   * Emits factual, non-speculative explanations of the configuration without exaggerated vulnerability warnings.

---

## DNS Inspector Engine (`app.services.dns_inspector`)

The DNS Inspector provides dedicated programmatic DNS resolution and record inspection for target hostnames using `dnspython`:
1. **Asynchronous Resolution**:
   * Resolves IPv4 (`A`) and IPv6 (`AAAA`) records asynchronously using `dns.asyncresolver.Resolver`.
   * Fast-paths IP address literals (IPv4 and IPv6) to skip redundant network lookups.
   * Deduplicates resolved addresses while preserving deterministic order.
2. **Hostname Extraction**:
   * Extracts clean hostnames directly from requested target URLs, cleanly stripping schemes, ports, query parameters, and path segments.
3. **DNS Lookup Timing**:
   * Measures the isolated wall-clock duration of the DNS resolution in milliseconds (`resolution_time_ms`).
   * Distinct from total request duration, TCP connection time, or TLS handshake latency (deferred to Request Journey).
4. **Safe Failure Handling**:
   * Gracefully captures `NXDOMAIN`, `NoAnswer`, query timeouts, and DNS exceptions into structured diagnostic errors and neutral observations without throwing unhandled exceptions or causing HTTP 500 errors.
5. **SSRF Guardrails Intact**:
   * Works alongside `app.core.security` SSRF protections without bypassing private, loopback, link-local, carrier-grade NAT, or cloud metadata IP blocking.

---

## Request Journey Engine (`app.services.request_journey`)

The Request Journey synthesizes the logical lifecycle of an HTTP request across 5 sequential phases, adhering strictly to **technical honesty**:
1. **Phased Lifecycle Structure**:
   * `dns`: Populated truthfully from DNS Inspector (`status: completed` or `failed`, `duration_ms` from DNS lookup).
   * `connection`: TCP connection timing is not independently measured by the HTTP transport, so it is marked `status: unavailable` and `duration_ms: null`.
   * `tls`: For HTTPS requests, marked `status: unavailable` and `duration_ms: null`. For plain HTTP requests, marked `status: not_applicable`.
   * `http`: Sourced from HTTP execution engine (`status: completed` or `failed`, `duration_ms` equal to measured request duration).
   * `response`: Sourced from Response Inspector with HTTP status code details (`status: completed`, `duration_ms: null`).
2. **Zero Fabricated Timings**:
   * Timings are never estimated, faked, or derived by arbitrary subtraction.
   * DNS duration is **never** added into the HTTP `total_duration_ms`.
3. **Graceful Failure Halting**:
   * When DNS fails, downstream connection, TLS, and HTTP phases are halted with neutral diagnostics explaining the resolution failure.

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

### Browser Development

The Vite frontend communicates with the local FastAPI backend through explicit localhost CORS configuration.
FastAPI's `CORSMiddleware` is configured to allow `http://localhost:5173` and `http://127.0.0.1:5173` with standard preflight support, keeping browser-to-backend communication distinct from outbound target-API CORS analysis.

### Running Tests

```bash
uv run pytest
```
