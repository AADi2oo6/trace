# TRACE — API Testing and Network Analysis Tool
## Final MVP Build Specification for Antigravity AI Coding Agent

### 1. Mission

Build the first working MVP of **TRACE — API Testing and Network Analysis Tool**.

TRACE is **not a Postman clone**.

The API tester is the entry point, but the main differentiator is that TRACE makes the networking behind an API request visible and understandable.

The core experience is:

**Build Request → Analyze → Send → Inspect → Trace the Request Journey → Understand the Result**

The MVP must be a real working full-stack application, not a visual mockup.

---

# 2. Technology Stack — LOCKED

Do not replace these technologies without explicit approval.

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand for local/global UI state where needed
- TanStack Query for server state and request lifecycle
- Recharts for the monitoring chart
- Lucide React for icons
- React Flow may be used only where it materially improves network visualization

Use current stable package versions compatible with the project environment.

Tailwind's current Vite integration uses the dedicated Vite plugin; use the current official integration rather than copying an outdated Tailwind v3 configuration.

## Backend

- Python
- FastAPI
- Uvicorn
- `httpx`
- `dnspython`
- SQLAlchemy
- SQLite for MVP
- Pydantic / FastAPI request models
- pytest
- httpx test client / FastAPI testing utilities

## Python environment and package management

Use **uv** exclusively for Python project/dependency management.

The backend must contain:

```text
pyproject.toml
uv.lock
.python-version
```

Do NOT create a traditional `requirements.txt` as the primary dependency definition.

Use commands such as:

```bash
uv init
uv add fastapi uvicorn httpx dnspython sqlalchemy aiosqlite
uv add --dev pytest
uv sync
uv run ...
```

`uv` manages the project environment, dependency declarations and lockfile through `pyproject.toml` and `uv.lock`. Both should be committed to Git.

## Database

Use:

**SQLite + SQLAlchemy**

Reason:

- zero external database setup for MVP
- easy local development
- enough for request history and monitoring
- can be migrated to PostgreSQL later

Do not introduce PostgreSQL/Docker infrastructure during the MVP unless specifically requested.

## Realtime

Do **not** introduce WebSockets for the initial MVP.

Use normal HTTP requests and frontend state updates.

WebSockets are a later enhancement.

---

# 3. Visual Design Direction — LOCKED

This is a major requirement.

TRACE must look like a **serious developer/networking tool**, not a generic student dashboard.

## Color system

Primary palette:

```text
Black       #000000
Near Black  #0A0A0A
White       #FFFFFF
Off White   #F5F5F5
Orange      #FF6A00
Dark Orange #D94F00
Gray        #6B6B6B
Light Gray  #E8E8E8
```

Orange is the accent color.

Use orange for:

- primary actions
- active tabs
- request method accents where useful
- progress indicators
- network-flow highlights
- selected states
- important metrics
- small decorative patterns

Do not turn the whole interface orange.

## Shape language

IMPORTANT:

**NO excessive rounded UI.**

Avoid:

```text
rounded-xl
rounded-2xl
pill-shaped buttons
floating bubbly cards
large-radius dashboards
```

Prefer:

```text
sharp rectangular panels
square buttons
subtle 2px–6px corner radius at most
thin borders
grid-based layouts
hard separators
monospace technical typography
```

The design should feel closer to:

```text
Developer Tool
+
Network Console
+
Technical Dashboard
```

than:

```text
SaaS startup landing page
```

## Typography

Use a clean sans-serif for normal UI and a monospace font for:

- URLs
- HTTP methods
- headers
- IP addresses
- ports
- timing data
- JSON
- protocol details

Suggested hierarchy:

```text
TRACE                      large/strong
API endpoint               medium/monospace
Protocol labels             compact uppercase
Metrics                     strong numeric
Technical data              monospace
```

## Layout philosophy

Use strong horizontal and vertical divisions.

Example:

```text
┌─────────────────────────────────────────────────────────────┐
│ TRACE                                      SYSTEM ● ONLINE  │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│ WORKSPACE     │ API REQUEST                                 │
│               │                                             │
│ Request       │ GET  https://example.com/api/users         │
│ History       │                                             │
│ Monitor       │ [ SEND ]                                    │
│               ├─────────────────────────────────────────────┤
│               │ REQUEST JOURNEY                             │
│               │                                             │
│               │ CLIENT ─ DNS ─ TCP ─ TLS ─ HTTP ─ SERVER   │
│               ├─────────────────────────────────────────────┤
│               │ RESPONSE                                    │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

The application should look good when projected during a faculty demonstration.

---

# 4. MVP Scope

Only build the following.

## MUST HAVE

### A. API Tester

Support:

```text
GET
POST
PUT
PATCH
DELETE
HEAD
OPTIONS
```

Features:

- URL input
- method selector
- query parameters
- headers
- request body
- JSON body
- text body
- Bearer token helper
- Basic authentication helper
- API-key-as-header helper
- Send request
- clear/reset request
- response viewer

---

### B. Response Inspector

Show:

- status code
- status text where available
- response headers
- response body
- content type
- response size
- total duration

Provide:

```text
Body
Headers
Timing
CORS
```

tabs.

JSON responses should be pretty-printed.

Plain text should remain readable.

HTML should be shown as text, NOT executed.

---

### C. Header Analyzer

Analyze both request and response headers.

Categorize common headers:

```text
General
Content
Caching
CORS
Authentication
Security
Other
```

Example:

```text
CACHE-CONTROL
────────────────────────────
Category:
Caching

Value:
max-age=3600

Meaning:
Controls how a response may be cached.
```

Implement this with a maintainable static metadata dictionary.

Unknown headers must still be shown.

Sensitive values must be masked.

At minimum mask:

```text
Authorization
Cookie
Set-Cookie
Proxy-Authorization
```

Example:

```text
Authorization: Bearer ********1234
```

Never store or render the full token in history.

---

# 5. OPTIONS Inspection

OPTIONS must be both:

1. a normal API method in the request builder
2. an inspection feature

## Endpoint Inspector

User enters:

```text
https://example.com/api/users
```

and clicks:

```text
INSPECT
```

TRACE performs an OPTIONS request.

Parse:

```text
Allow
Access-Control-Allow-Origin
Access-Control-Allow-Methods
Access-Control-Allow-Headers
Access-Control-Allow-Credentials
```

Show:

```text
ADVERTISED METHODS

GET       ✓
POST      ✓
PUT       ✓
PATCH     ?
DELETE    ?
OPTIONS   ✓
```

Important:

Do NOT say:

> "This API supports only GET and POST."

Instead say:

> "Methods advertised by OPTIONS response."

If no useful `Allow` header exists:

```text
No method list was advertised by the server.
```

Never infer unsupported methods from missing data.

---

# 6. CORS Analyzer

This is one of TRACE's signature features.

## Input

The analyzer receives:

```text
method
request headers
content type
origin
```

## Classification

Return:

```text
Simple Request
```

or

```text
Non-Simple Request
```

and explain WHY.

The classification logic should be isolated in a pure function.

At minimum:

### Simple-method set

```text
GET
HEAD
POST
```

### Non-simple examples

- PUT
- PATCH
- DELETE
- custom request headers
- JSON content type
- other non-safelisted request conditions

For a request like:

```http
POST /users
Content-Type: application/json
X-Trace-ID: demo-123
```

the analyzer should report:

```text
NON-SIMPLE REQUEST

Reasons:

✓ Content-Type: application/json
  requires preflight handling

✓ X-Trace-ID
  is not a CORS-safelisted request header

Browser-style preflight may be required.
```

## Visual preflight diagram

For non-simple requests:

```text
BROWSER                         SERVER

   │                               │
   │────── OPTIONS ───────────────>│
   │                               │
   │<──── CORS PERMISSION ─────────│
   │                               │
   │────── ACTUAL REQUEST ────────>│
   │                               │
   │<──────── RESPONSE ────────────│
```

Animate this in the UI.

Do not claim that the backend's own HTTP request is subject to browser CORS enforcement.

The CORS analyzer explains/browser-models CORS behaviour; it is not pretending to reproduce the browser security sandbox.

---

# 7. DNS Inspector

The backend must perform hostname resolution.

Input:

```text
example.com
```

Return:

```text
Hostname:
example.com

IPv4:
93.xxx.xxx.xxx

IPv6:
xxxx:xxxx:....

Resolution time:
14 ms
```

Use:

```python
dns.resolver
```

or equivalent `dnspython` functionality.

Measure resolution time with a monotonic high-resolution timer.

Error cases:

```text
DNS_NOT_FOUND
DNS_TIMEOUT
DNS_ERROR
```

The UI must identify DNS failure separately from HTTP failure.

Important technical wording:

> DNS timing represents the backend server's DNS resolution, not the user's browser's DNS resolution.

---

# 8. Request Journey

This is the primary visual feature of TRACE.

After clicking SEND, show:

```text
CLIENT
   ↓
DNS
   ↓
CONNECT
   ↓
TLS
   ↓
HTTP
   ↓
SERVER
   ↓
RESPONSE
```

Each stage has states:

```text
WAITING
ACTIVE
SUCCESS
ERROR
NOT_MEASURED
```

Example:

```text
CLIENT       ✓
DNS          ✓  12 ms
CONNECT      ~  illustrative
TLS          ~  illustrative
HTTP         ✓  200
RESPONSE     ✓  84 ms
```

## VERY IMPORTANT

Never fabricate TCP or TLS timing.

If the MVP cannot reliably measure the exact stage:

```text
Illustrative
```

or

```text
Not measured
```

must be shown.

Do not display invented values such as:

```text
TCP = 21ms
TLS = 32ms
```

unless actually measured.

This distinction is essential to the project's credibility.

---

# 9. Request Timing

Show at minimum:

```text
Total
```

Example:

```text
TOTAL RESPONSE TIME
84 ms
```

When reliable stage timing is available:

```text
DNS       12 ms
HTTP      72 ms
TOTAL     84 ms
```

For stages unavailable to the HTTP client, explicitly mark them as illustrative.

The visualization may still teach:

```text
DNS → TCP → TLS → HTTP
```

but must distinguish protocol visualization from measured telemetry.

---

# 10. Request History

Every executed request must be saved.

History list:

```text
GET     https://api.github.com
200     241ms

POST    http://localhost:4000/created
201     18ms

GET     http://localhost:4000/error
500     11ms
```

Store:

- method
- URL
- headers (masked)
- request body where safe
- status
- response headers
- response preview
- response size
- duration
- DNS data
- CORS classification
- OPTIONS data
- timestamp
- error type if failed

Clicking a history entry should repopulate the request builder.

---

# 11. Basic Monitoring

Monitoring is part of MVP but has LOWEST implementation priority.

Do not start this before the core request-analysis path works.

User can add:

```text
Name
URL
Interval
```

Example:

```text
Demo API
http://localhost:4000/ok
30 seconds
```

Backend periodically performs a safe check.

Store:

```text
timestamp
success
status code
duration
error type
```

Frontend displays:

```text
STATUS       ONLINE ●

Current:
200

Latency:
18 ms
```

and one simple Recharts line chart:

```text
Latency
│
│       ╭───╮
│  ╭────╯   ╰────╮
│──╯              ╰──
└───────────────────── Time
```

Maximum MVP complexity:

- basic target CRUD
- one chart
- latest status
- latency history

No WebSockets.

No complex alerting.

No distributed monitoring.

No multi-server agent.

---

# 12. Controlled Demo API

Create a separate small FastAPI application at:

```text
/demo-api
```

This exists specifically to make the TRACE demo deterministic.

Required routes:

```text
GET  /ok
POST /created
GET  /error
GET  /delay?ms=1000

GET  /cors/simple
POST /cors/non-simple

OPTIONS /options

GET  /large
```

Expected behaviour:

### `/ok`

```http
200 OK
```

JSON response.

### `/created`

```http
201 Created
```

Accept JSON body.

### `/error`

```http
500 Internal Server Error
```

### `/delay?ms=1000`

Delay response by requested bounded amount, then return 200.

Cap delay to a safe maximum.

### `/options`

Return:

```http
Allow: GET, POST, OPTIONS
```

### `/cors/simple`

Controlled CORS response.

### `/cors/non-simple`

Controlled endpoint useful for CORS/preflight demonstrations.

### `/large`

Return a large deterministic JSON response for response-size testing.

The demo API must never be treated as a security-testing target.

---

# 13. Backend Architecture

Use a clean FastAPI architecture.

Recommended:

```text
server/
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── requests.py
│   │   │   ├── dns.py
│   │   │   ├── cors.py
│   │   │   ├── options.py
│   │   │   ├── history.py
│   │   │   ├── monitoring.py
│   │   │   └── health.py
│   │   │
│   │   └── dependencies.py
│   │
│   ├── schemas/
│   │   ├── request.py
│   │   ├── response.py
│   │   ├── dns.py
│   │   ├── cors.py
│   │   └── monitoring.py
│   │
│   ├── services/
│   │   ├── request_executor.py
│   │   ├── dns_service.py
│   │   ├── cors_service.py
│   │   ├── options_service.py
│   │   ├── header_analyzer.py
│   │   └── monitoring_service.py
│   │
│   ├── models/
│   │   ├── request_run.py
│   │   └── monitor.py
│   │
│   ├── db/
│   │   ├── database.py
│   │   └── init_db.py
│   │
│   └── core/
│       ├── config.py
│       ├── security.py
│       └── errors.py
│
├── tests/
├── pyproject.toml
├── uv.lock
└── .python-version
```

Routes must remain thin.

Business logic belongs in services.

Pure analysis functions should remain isolated and testable.

---

# 14. Frontend Architecture

Use:

```text
client/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── api-tester/
│   │   ├── response-inspector/
│   │   ├── header-analyzer/
│   │   ├── cors-analyzer/
│   │   ├── request-journey/
│   │   ├── history/
│   │   └── monitor/
│   │
│   ├── pages/
│   │   ├── Workspace.tsx
│   │   └── Monitor.tsx
│   │
│   ├── services/
│   │   └── api.ts
│   │
│   ├── store/
│   │   └── requestStore.ts
│   │
│   ├── hooks/
│   ├── types/
│   └── styles/
│
└── ...
```

Use reusable technical components.

Do not create one giant `App.tsx`.

---

# 15. Backend API Contract

Implement:

```text
POST /api/requests/execute
```

Input:

```json
{
  "method": "GET",
  "url": "https://example.com",
  "params": [],
  "headers": {},
  "body": null,
  "auth": null
}
```

Return normalized result:

```json
{
  "requestId": "uuid",
  "method": "GET",
  "url": "https://example.com",
  "status": 200,
  "headers": {},
  "bodyPreview": {},
  "responseSize": 1240,
  "durationMs": 84,
  "dns": {
    "durationMs": 12,
    "ipv4": [],
    "ipv6": []
  },
  "cors": null,
  "options": null,
  "error": null
}
```

Additional endpoints:

```text
POST /api/dns/resolve

POST /api/cors/analyze

POST /api/options/check

GET  /api/history

GET  /api/monitoring/targets

POST /api/monitoring/targets

DELETE /api/monitoring/targets/{id}

GET /api/monitoring/targets/{id}/points

GET /api/health
```

FastAPI should expose its normal development documentation through its OpenAPI/Swagger endpoint. Keep this available for development and testing.

---

# 16. Request Execution Requirements

Use `httpx.AsyncClient`.

Default:

```text
timeout = 10 seconds
```

Follow at most:

```text
5 redirects
```

Response body limit:

```text approximately 2 MB
```

If exceeded:

```text truncated = true
```

Do not execute arbitrary dangerous destinations.

For MVP, use a simple outbound-target protection strategy:

- block localhost/private IP targets by default
- allow the bundled demo API
- make the exception explicit in development configuration

This is required because a server-side request proxy can otherwise become an SSRF problem.

---

# 17. Error Model

Never dump raw Python exceptions directly to the user.

Normalize errors into categories:

```text
INVALID_URL
DNS_ERROR
DNS_NOT_FOUND
TIMEOUT
CONNECTION_ERROR
TLS_ERROR
REDIRECT_ERROR
RESPONSE_TOO_LARGE
HTTP_ERROR
UNKNOWN_ERROR
```

Example UI:

```text
REQUEST FAILED

Stage:
DNS

Type:
DNS_NOT_FOUND

Target:
unknown.example

The hostname could not be resolved.
```

Differentiate:

```text
Network failure
```

from:

```text
HTTP 404
```

The latter is a successful network exchange that returned an application-level HTTP error.

---

# 18. Database — MVP

Use SQLAlchemy with SQLite.

Core tables:

## request_runs

```text
id
method
url
request_headers
request_body
status
response_headers
response_body_preview
response_size
duration_ms
dns_ms
dns_addresses
cors_classification
cors_reason
options_allow
error_type
created_at
```

## monitor_targets

```text
id
name
url
interval_seconds
enabled
created_at
```

## monitor_points

```text
id
target_id
checked_at
success
status_code
duration_ms
error_type
```

Keep the database simple.

Do not introduce unnecessary normalization during MVP.

---

# 19. Security Requirements

These are mandatory from the beginning.

## Secrets

Mask:

```text
Authorization
Cookie
Set-Cookie
Proxy-Authorization
```

in:

- UI
- history
- logs
- API responses where appropriate

## Network safety

Every outbound request must have:

```text
timeout
redirect limit
response size limit
```

## SSRF protection

Do not freely expose a public server that can make arbitrary requests to internal/private addresses.

Use development allowlisting for the demo environment.

## Input validation

Validate:

- HTTP method
- URL
- query parameters
- headers
- body structure where applicable
- monitor interval

Return HTTP 400 with field-level validation errors.

---

# 20. Testing Strategy

Write real tests.

## Unit tests

At minimum:

### CORS classification

Test:

```text
GET → simple

HEAD → simple

POST + text/plain → simple

POST + application/json → non-simple

GET + custom header → non-simple

DELETE → non-simple
```

### Header analyzer

Test:

```text
Content-Type → Content
Cache-Control → Caching
Authorization → Authentication + sensitive
Unknown → Other
```

### Error normalization

Test known network exceptions.

## Integration test

At minimum:

```text
POST /api/requests/execute
```

against the local demo API.

Test:

```text
GET /ok → 200
POST /created → 201
GET /error → 500
GET /delay → delayed 200
```

---

# 21. Build Phases

The agent MUST work in this order.

Do not skip phases.

## PHASE 0 — Repository and Scaffold

Create:

```text
trace/
├── client/
├── server/
├── demo-api/
├── docs/
├── tests/
└── README.md
```

Initialize:

### Frontend

React + TypeScript + Vite + Tailwind.

### Backend

FastAPI + uv.

### Demo API

FastAPI.

### Database

SQLite + SQLAlchemy.

Create:

```text
pyproject.toml
uv.lock
.python-version
```

Create `.gitignore`.

The `.venv` directory must never be committed.

### Done when

All three services run:

```text
Frontend
Backend
Demo API
```

and frontend displays:

```text
TRACE
SYSTEM ONLINE ●
```

Backend:

```text
GET /api/health
```

returns:

```json
{"status":"ok"}
```

---

# PHASE 1 — API Tester Core

Build:

- request builder
- method selector
- URL input
- params
- headers
- body
- auth helpers
- send button
- response viewer

Implement:

```text
POST /api/requests/execute
```

Store every execution.

### Done when

These work:

```text
GET /ok
POST /created
GET /error
GET /delay?ms=1500
```

and results appear correctly.

---

# PHASE 2 — Header Analyzer

Build:

- request headers tab
- response headers tab
- categories
- explanations
- masking

### Done when

A request containing:

```text
Authorization: Bearer xyz123
Content-Type: application/json
Cache-Control: no-cache
```

displays correct categories and masks the Authorization value.

---

# PHASE 3 — OPTIONS + CORS

Implement:

```text
/api/options/check
/api/cors/analyze
```

Build:

- OPTIONS inspection
- Allow parser
- CORS header inspection
- simple/non-simple classifier
- preflight visualizer

### Done when

This produces:

```text
GET
→ SIMPLE
```

and:

```text
POST
Content-Type: application/json
X-Trace-ID: demo
→ NON-SIMPLE
```

Also:

```text
OPTIONS /options
```

shows:

```text
GET
POST
OPTIONS
```

as server-advertised methods.

---

# PHASE 4 — DNS + Request Journey

Implement:

```text
/api/dns/resolve
```

and connect DNS data to the request flow.

Build the visual journey:

```text
CLIENT
 ↓
DNS
 ↓
CONNECT
 ↓
TLS
 ↓
HTTP
 ↓
RESPONSE
```

Measured values must be real.

Unmeasured values must say:

```text
ILLUSTRATIVE
```

### Done when

A real external HTTPS request shows:

```text
DNS
measured

CONNECT
illustrative

TLS
illustrative

HTTP
measured/result

RESPONSE
measured
```

---

# PHASE 5 — History

Implement:

```text
GET /api/history
```

Build:

- history list
- status
- duration
- timestamp
- reopen action

### Done when

Refreshing the application still shows previous requests.

Selecting a request restores it into the request builder.

---

# PHASE 6 — Basic Monitoring

Only start this AFTER Phases 1–5 work.

Implement:

```text
MonitorTarget
MonitorPoint
```

Use bounded background scheduling.

Maximum MVP target count:

```text 10
```

Do not introduce WebSockets.

Frontend may poll.

Build:

- add monitor target
- current status
- current latency
- one latency chart
- history of checks

### Done when

Two demo targets can be monitored independently:

```text
/ok
/delay?ms=500
```

and their latency trends are visible.

---

# PHASE 7 — Final Polish

Only after all previous phases pass.

Fix:

- loading states
- empty states
- error states
- responsive layout
- visual consistency
- keyboard usability
- API error messages
- responsive projector layout
- README

Create:

```text
Architecture diagram
API documentation
Setup documentation
Known limitations
Demo instructions
```

---

# 22. MVP Navigation

Keep navigation simple.

Recommended:

```text
TRACE
│
├── Workspace
│    ├── Request Builder
│    ├── Request Journey
│    ├── Response
│    ├── Headers
│    └── CORS
│
├── History
│
└── Monitor
```

Do not create a dozen pages.

The Workspace is the heart of the application.

---

# 23. Workspace UX

The user should be able to perform the main demo without navigating away.

Preferred structure:

```text
┌──────────────────────────────────────────────────────────────┐
│ TRACE                                                       │
├──────────────────────────────────────────────────────────────┤
│ [GET ▼] https://api.example.com/users             [ SEND ]   │
├──────────────────────────────────────────────────────────────┤
│ Params | Headers | Body | Auth                               │
├───────────────────────────────┬──────────────────────────────┤
│ REQUEST                       │ REQUEST JOURNEY              │
│                               │                              │
│ headers/body/etc.             │ CLIENT                      │
│                               │   ↓                          │
│                               │ DNS      ✓ 12ms             │
│                               │   ↓                          │
│                               │ CONNECT  ~ illustrative     │
│                               │   ↓                          │
│                               │ TLS      ~ illustrative     │
│                               │   ↓                          │
│                               │ HTTP     ✓ 200              │
├───────────────────────────────┴──────────────────────────────┤
│ RESPONSE                                                     │
│                                                              │
│ 200 OK     84 ms     12.4 KB                                 │
│                                                              │
│ Body | Headers | Timing | CORS                               │
└──────────────────────────────────────────────────────────────┘
```

---

# 24. Visual Interaction for the Main Demo

The most important animation in the project is:

```text
SEND
 ↓
REQUEST CREATED
 ↓
DNS
 ↓
CONNECTION
 ↓
TLS
 ↓
HTTP
 ↓
SERVER RESPONSE
 ↓
ANALYSIS
```

Use orange as the moving/highlighted state.

Example:

```text
CLIENT ━━━▶ DNS ━━━▶ CONNECT ━━━▶ TLS ━━━▶ HTTP ━━━▶ SERVER
   ●          ●           ○           ○          ○
```

The animation should feel technical, not flashy.

Allow:

```text
Replay
Pause
```

only if simple to implement.

Do not spend significant time creating complex animation frameworks.

---

# 25. Important Technical Honesty

TRACE must distinguish three categories of information.

## MEASURED

Actually measured by the backend:

```text
DNS resolution time
Total request duration
Response size
HTTP status
Returned headers
```

## SERVER REPORTED

Returned by the target:

```text
Allow
Access-Control-Allow-Origin
Access-Control-Allow-Methods
Content-Type
Cache-Control
```

## ILLUSTRATIVE

Used for educational visualization:

```text
TCP handshake stage
TLS handshake stage
logical protocol sequence
browser CORS preflight animation
```

The UI should use labels such as:

```text
MEASURED
SERVER
ILLUSTRATIVE
```

Never mix them.

This is a core requirement of the project.

---

# 26. Explicitly OUT OF MVP

Do NOT implement these now:

```text
Authentication system
OAuth
Team accounts
Workspace sharing
Redis
Docker orchestration
PostgreSQL
WebSockets
Socket.IO
Raw packet capture
Wireshark replacement
TCP packet sniffer
UDP packet sniffer
HTTP/2 packet visualizer
HTTP/3/QUIC analyzer
Distributed monitoring agents
Complex alert system
AI features
LLM integration
AI-generated explanations
Advanced security scanning
Penetration testing
Collections/folders
Environment variable system
Import/export collections
Browser automation
```

They can be future scope.

---

# 27. Git and Version Management

Use clean commits.

Suggested sequence:

```text
chore: scaffold TRACE monorepo
feat: add FastAPI backend foundation
feat: add local demo API
feat: implement API request execution
feat: add response inspector
feat: add header analyzer
feat: add OPTIONS inspection
feat: add CORS analyzer
feat: add DNS inspector
feat: add request journey visualization
feat: add request history
feat: add basic monitoring
test: add core analysis tests
docs: add setup and architecture documentation
```

Never commit:

```text
.env
.env.*
.venv/
__pycache__/
node_modules/
*.db
secrets
API keys
tokens
```

Commit:

```text
uv.lock
```

because it makes Python dependency resolution reproducible.

---

# 28. README Requirements

The README must contain:

```text
TRACE
API Testing and Network Analysis Tool
```

Then:

### What is TRACE?

### Why TRACE exists

### Features

### Architecture

### Tech Stack

### Project Structure

### Local Setup

### Running Frontend

### Running Backend

### Running Demo API

### Example Request

### CORS demonstration

### OPTIONS demonstration

### Request Journey

### Testing

### Known Limitations

Especially include:

> TCP/TLS stage visualization in MVP may be illustrative when exact per-stage timing is unavailable.

This makes the project technically honest.

---

# 29. Acceptance Criteria

The MVP is complete only when:

### API

- GET works
- POST works
- PUT works
- PATCH works
- DELETE works
- HEAD works
- OPTIONS works

### Request configuration

- URL
- query parameters
- headers
- body
- authentication helpers

### Response

- status
- headers
- body
- size
- duration

### Analysis

- header categorization
- sensitive header masking
- OPTIONS inspection
- Allow parsing
- CORS classification
- CORS response-header inspection
- DNS resolution

### Visualization

- request journey
- DNS result
- measured/illustrative distinction
- response timing

### Persistence

- request history
- reopen request

### Monitoring

- add target
- periodic check
- latency chart
- latest health

### Quality

- tests pass
- failure states work
- no secrets committed
- no fabricated measurements
- project starts from documented instructions

---

# 30. Priority Rule for the Agent

When deciding between:

```text
new feature
```

and

```text
fixing core functionality
```

always choose:

**core functionality first.**

Priority order:

```text
1. Request execution
2. Response inspection
3. Header analysis
4. OPTIONS
5. CORS
6. DNS
7. Request Journey
8. History
9. Monitoring
10. Cosmetic polish
```

Do not reverse this order.

---

# 31. Final UX Goal

A faculty member should be able to walk up to TRACE and see:

```text
GET https://api.example.com/users
                  │
                  ▼
               SEND
                  │
                  ▼
         ┌─────────────────┐
         │ DNS             │
         │ 12 ms           │
         └────────┬────────┘
                  ▼
         ┌─────────────────┐
         │ TCP             │
         │ Illustrative    │
         └────────┬────────┘
                  ▼
         ┌─────────────────┐
         │ TLS             │
         │ Illustrative    │
         └────────┬────────┘
                  ▼
         ┌─────────────────┐
         │ HTTP            │
         │ 200 OK          │
         └────────┬────────┘
                  ▼
             RESPONSE

        200 OK | 84 ms
```

Then click:

```text
Headers
```

and inspect them.

Click:

```text
CORS
```

and see the preflight explanation.

Click:

```text
OPTIONS
```

and see advertised methods.

Click:

```text
History
```

and reopen the request.

That complete flow is the MVP.

---

# 32. Final Instruction to Antigravity

Do not attempt to build the entire TRACE vision at once.

Start with **Phase 0 only**.

After Phase 0:

1. Verify all three applications start.
2. Verify `/api/health`.
3. Verify frontend/backend connectivity.
4. Verify demo-api routes.
5. Verify SQLite initialization.
6. Run tests.
7. Stop and report the exact files created, commands used, and verification results.

Then proceed one phase at a time.

Never silently skip a phase.

Never fabricate network measurements.

Never introduce a new framework/dependency when the existing stack can solve the problem.

Keep the architecture understandable enough that a second-year/third-year computer engineering student can explain every major component during a viva.

**Primary objective: build a small, real, technically honest networking product before adding impressive but non-essential features.**