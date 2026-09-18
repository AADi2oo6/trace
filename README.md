# TRACE

**API Testing and Network Analysis Tool**

TRACE is a developer tool designed to make the networking behind an HTTP API request visible, structured, and understandable.

While conventional API clients focus almost exclusively on the raw exchange of request payloads and response bodies, TRACE exposes the broader network lifecycle that surrounds each request: HTTP behavior, headers, OPTIONS inspection, CORS constraints, DNS resolution, timing phases, and the end-to-end request journey.

---

## Overview

Modern web applications depend heavily on APIs, yet developers frequently treat the underlying network mechanics as an opaque black box. When an API call fails or behaves unexpectedly, standard tools often report only an error code or an incomplete browser error (such as a generic `CORS error`), leaving developers to guess at the underlying cause.

TRACE serves two complementary purposes:

1. **A Practical API Testing Tool** — A streamlined workspace to construct, configure, and execute standard HTTP requests across common HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`) with support for query parameters, headers, and request bodies.
2. **A Network Learning and Analysis Engine** — An educational diagnostic tool that dissects HTTP interactions into observable stages, categorizing headers, breaking down latency phases, explaining CORS restrictions, inspecting DNS records, and tracing the path of a request from client to server.

> **Important**: TRACE is built to expose application-level and transport-level network behavior. It is not a packet-level sniffer or a replacement for Wireshark.

---

## Aim of the Project

The primary aim of TRACE is to bridge theoretical Computer Networking principles with real-world software engineering practices. Specifically, the project aims to:

* **Demystify API Execution**: Transform invisible network processes into tangible, visual data.
* **Elevate Developer Diagnostics**: Provide actionable insights into HTTP headers, CORS configurations, preflight checks, and DNS lookups.
* **Promote Network Literacy**: Connect core academic concepts (DNS resolution, TCP handshakes, TLS negotiation, HTTP semantics, CORS policies) to active API debugging.
* **Deliver a High-Performance Console**: Offer a focused, technical workspace devoid of SaaS bloat, excessive UI padding, or unnecessary abstraction.
* **Establish a Scalable Foundation**: Maintain clean separation between frontend presentation, backend execution, database persistence, and network analysis pipelines.

---

## Problem Statement

Conventional API testing tools encourage a simplified mental model:

```text
Request ───────────────► Response
```

In reality, an HTTP request traverses a multi-stage network journey before any application code executes:

```text
Client
  │
  ▼
DNS Resolution (A / AAAA / CNAME)
  │
  ▼
Connection Handshake (TCP / TLS)
  │
  ▼
HTTP Request Serialization & Headers
  │
  ▼
Server Processing & Middleware
  │
  ▼
HTTP Response Serialization & Headers
  │
  ▼
Client Response Parsing & Security Policy Validation
```

When issues arise—such as slow DNS lookup, missing CORS headers during browser preflight, aggressive caching, or improper content negotiation—conventional tools offer little explanation. Developers are forced to switch between disparate terminal commands (`curl`, `dig`, `traceroute`) and web searches to interpret obscure status flags.

TRACE makes these intermediate networking stages directly observable within a unified interface.

---

## What Makes TRACE Different

> **TRACE doesn't only show whether an API request worked; it aims to show what happened around that request.**

Key differentiators include:

* **Header Analysis**: Automatically categorizes request and response headers (Security, CORS, Caching, Content, Authentication) with contextual explanations and security masking for sensitive values.
* **OPTIONS & Preflight Inspection**: Analyzes advertised HTTP methods, allowed origins, and preflight requirements without requiring manual command-line probes.
* **CORS Analysis**: Explicitly evaluates server-side CORS headers against cross-origin browser rules, providing clear explanations of potential cross-origin restrictions.
* **DNS Resolution Details**: Queries and displays host IP addresses, record types, and lookup timing directly alongside the request.
* **Request Journey Visualization**: Maps out the chronological stages of the network interaction from client initiation to server response.
* **Timing Decomposition**: Breaks down total round-trip duration into distinct phases where measurable (DNS, connection, transfer).

---

## Core Features

| Feature | Description | Status |
| :--- | :--- | :--- |
| **API Tester** | Build and execute HTTP requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, etc.) | Planned |
| **Response Inspector** | Inspect response status codes, headers, body, content types, and payload sizes | Planned |
| **Header Analyzer** | Categorize and explain headers with masking for credentials | Planned |
| **OPTIONS Inspector** | Inspect server capabilities, allowed methods, and preflight rules | Planned |
| **CORS Analyzer** | Diagnose CORS headers and explain browser access policies | Planned |
| **DNS Inspector** | Resolve hostnames and display DNS records and lookup times | Planned |
| **Request Journey** | Visual representation of client-to-server network stages | Planned |
| **Request History** | Local persistent history of executed requests for replay | Planned |
| **Basic Monitoring** | Automated periodic endpoint health checks and response time tracking | Planned |
| **Demo API** | Controlled local API endpoints for demonstrating edge cases and errors | Planned |

---

## How TRACE Works

The intended conceptual data flow between TRACE components is structured as follows:

```text
                    TRACE UI
                      │
                      ▼
              Request Builder
                      │
                      ▼ (Internal HTTP)
                FastAPI Backend
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
        HTTP         DNS       Analysis
       Request      Lookup      Modules
      (httpx)    (dnspython) (CORS/Headers)
          │           │           │
          └───────────┼───────────┘
                      ▼
              Structured Result
                      │
                      ▼ (JSON Response)
                TRACE Frontend
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
    Response       Analysis       Journey
    Inspector      Panels         View
```

*Note: This diagram depicts the target architecture. Modules are being developed incrementally according to the build plan.*

---

## Project Architecture

TRACE is organized as a decoupled, multi-tier system:

* **Client (`client/`)**: A single-page application built with React, TypeScript, Vite, and Tailwind CSS. State management is divided between Zustand (local UI state) and TanStack Query (server state and asynchronous request lifecycles). Navigation is managed via React Router.
* **Server (`server/`)**: A FastAPI backend application running under Uvicorn, managed through `uv`. The backend acts as a controlled execution proxy, orchestrating outbound HTTP requests via `httpx`, DNS lookups via `dnspython`, and structured analysis before returning unified diagnostic payloads to the client.
* **Database (Planned for MVP)**: Local SQLite database accessed through SQLAlchemy for persisting request history and monitoring metrics without external service dependencies.
* **Demo API (Planned)**: An isolated local service providing endpoints specifically designed to simulate various network scenarios (CORS mismatches, slow responses, varying headers, error codes).

---

## Tech Stack

The technology stack is locked to ensure stability, consistency, and clean separation of concerns:

### Frontend
* **Framework**: React 19
* **Language**: TypeScript (strict mode enabled)
* **Build Tool**: Vite
* **Styling**: Tailwind CSS v4 (using `@tailwindcss/vite`)
* **Routing**: React Router (`react-router-dom` v7)
* **Client State**: Zustand
* **Server State & Querying**: TanStack React Query v5
* **Visualizations & Charts**: Recharts
* **Iconography**: Lucide React

### Backend
* **Language**: Python 3.13
* **API Framework**: FastAPI
* **ASGI Server**: Uvicorn
* **HTTP Client**: `httpx`
* **DNS Resolution**: `dnspython`
* **ORM**: SQLAlchemy
* **Package & Environment Manager**: `uv`

### Database (MVP)
* **Engine**: SQLite
* **Access Layer**: SQLAlchemy
* *(PostgreSQL may be evaluated in future post-MVP stages, but SQLite remains the dedicated MVP engine).*

### Development & Testing
* **Package Management**: `npm` (frontend) / `uv` (backend)
* **Testing**: `pytest` (backend)
* **Linter**: `oxlint` (frontend)
* **Version Control**: Git

---

## Repository Structure

```text
trace/
│
├── README.md                      # Root project overview and documentation
├── TRACE_MVP_Build_Plan.md        # Comprehensive phased build specification
├── .gitignore                     # Repository-level ignore rules
│
├── client/                        # Frontend application (React + Vite + Tailwind)
│   ├── README.md                  # Frontend-specific documentation
│   ├── package.json               # Frontend dependencies and build scripts
│   ├── vite.config.ts             # Vite build configuration
│   ├── tsconfig.json              # TypeScript root configuration
│   ├── tsconfig.app.json          # TypeScript application configuration
│   ├── index.html                 # Single-page application entry HTML
│   └── src/
│       ├── main.tsx               # Application bootstrap
│       ├── App.tsx                # Shell, router, and query provider
│       ├── pages/                 # Route views (Workspace, Monitor)
│       ├── components/            # Reusable and feature component folders
│       ├── store/                 # Zustand store definitions
│       ├── styles/                # Global Tailwind CSS and design tokens
│       ├── hooks/                 # Custom React hooks
│       ├── services/              # API and client network services
│       ├── types/                 # Shared TypeScript interfaces
│       └── lib/                   # Utility libraries and helpers
│
└── server/                        # Backend application (FastAPI + uv)
    ├── README.md                  # Backend-specific documentation
    ├── pyproject.toml             # Python package configuration and dependencies
    ├── uv.lock                    # Locked dependency resolution
    ├── .python-version            # Python version pin (3.13)
    ├── app/
    │   ├── __init__.py
    │   ├── main.py                # FastAPI application initialization & routes
    │   ├── core/                  # Configuration and application settings
    │   ├── api/                   # API endpoint routers
    │   ├── models/                # SQLAlchemy database models
    │   ├── schemas/               # Pydantic validation schemas
    │   ├── services/              # HTTP execution and external integration
    │   ├── analyzers/             # Header, CORS, OPTIONS, and DNS analyzers
    │   └── utils/                 # General backend utilities
    └── tests/
        ├── __init__.py
        └── test_health.py         # Initial API health verification test
```

### Documentation Scope
* **`README.md` (this file)**: High-level overview, architecture, current status, setup instructions, and development workflow.
* **`client/README.md`**: Detailed instructions on frontend structure, Oxlint configuration, and React development.
* **`server/README.md`**: Detailed instructions on backend modules, environment management, and Python development.
* **`TRACE_MVP_Build_Plan.md`**: Master blueprint detailing requirements, security constraints, and phased deliverables.

---

## Development Progress

### Environment Setup
- [x] Project planning and MVP scope defined
- [x] Frontend environment setup
- [x] React + TypeScript + Vite configured
- [x] Frontend dependencies installed
- [x] Frontend routing foundation created
- [x] Frontend build verified
- [x] Backend environment setup
- [x] uv environment configured
- [x] FastAPI application created
- [x] Uvicorn startup verified
- [x] Backend health endpoint verified
- [x] pytest foundation created

### Core Backend
- [ ] Backend API architecture and contracts
- [ ] HTTP request execution
- [ ] Response normalization
- [ ] Request validation and limits
- [ ] Error handling

### Network Analysis
- [ ] Header Analyzer
- [ ] OPTIONS Inspector
- [ ] CORS Analyzer
- [ ] DNS Inspector
- [ ] Request Timing
- [ ] Request Journey

### Frontend
- [ ] API Tester workspace
- [ ] Response Inspector UI
- [ ] Header Analyzer UI
- [ ] OPTIONS UI
- [ ] CORS Analyzer UI
- [ ] DNS Inspector UI
- [ ] Request Journey UI
- [ ] Request History UI
- [ ] Monitoring UI

### Persistence
- [ ] SQLite database integration
- [ ] SQLAlchemy models
- [ ] Request history persistence

### Testing & Security
- [ ] Backend unit tests
- [ ] Frontend integration
- [ ] SSRF protection
- [ ] Request timeout limits
- [ ] Response size limits
- [ ] Redirect limits
- [ ] Sensitive header masking
- [ ] End-to-end testing

### Finalization
- [ ] Controlled Demo API
- [ ] Full frontend/backend integration
- [ ] UI polish
- [ ] Documentation completion
- [ ] Deployment preparation

---

## Current Status

> **Current Phase: Environment Setup Complete**
>
> Both the frontend (`client/`) and backend (`server/`) development environments are fully configured, container-free, verified, and operational. All required dependencies are installed, builds are passing without warnings, and foundational testing confirms system health. The project is ready to begin implementing the core backend API foundation.

---

## Getting Started

### Prerequisites

Ensure the following tools are installed on your workstation:

* **Node.js**: Version 20+ (Verified on v24.x)
* **npm**: Version 10+ (Verified on v11.x)
* **Python**: Version 3.13+
* **uv**: Fast Python package manager (v0.9+)
* **Git**: Version control

---

## Running the Frontend

Navigate to the `client/` directory and install dependencies:

```bash
cd client
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend application will become available at:
```text
http://localhost:5173/
```

To run a production TypeScript check and build:

```bash
npm run build
```

---

## Running the Backend

Navigate to the `server/` directory and synchronize virtual environment dependencies:

```bash
cd server
uv sync
```

Start the FastAPI application with Uvicorn:

```bash
uv run uvicorn app.main:app --reload
```

The backend service will become available at:
```text
http://127.0.0.1:8000/
```

### Verification Endpoints

* **Health Check**: `http://127.0.0.1:8000/health` (or `/api/health`)
* **Interactive API Documentation (Swagger UI)**: `http://127.0.0.1:8000/docs`
* **OpenAPI Specification**: `http://127.0.0.1:8000/openapi.json`

---

## Running Tests

Backend tests are managed using `pytest` executed inside the `uv` environment:

```bash
cd server
uv run pytest
```

*Note: Current tests verify backend bootstrap and health endpoint availability. The test suite will be expanded in tandem with feature implementation.*

---

## Development Workflow

To ensure stability, prevent regressions, and avoid scope creep, TRACE is built using an incremental, step-by-step workflow:

```text
Read project plan & current specification
                 │
                 ▼
     Implement one targeted step
                 │
                 ▼
       Execute automated tests
                 │
                 ▼
   Verify functionality & build integrity
                 │
                 ▼
       Update README progress
                 │
                 ▼
            Commit changes
                 │
                 ▼
       Proceed to next step
```

---

## Documentation

Documentation is maintained across multiple layers:

* **[Root README](README.md)**: Repository entrance point, architectural overview, tech stack, roadmap, and setup guide.
* **[Frontend README](client/README.md)**: Setup, compilation, and linting guidelines for the React client.
* **[Backend README](server/README.md)**: Python environment, packages, and architecture for the FastAPI server.
* **[TRACE MVP Build Plan](TRACE_MVP_Build_Plan.md)**: The authoritative project blueprint detailing design choices, constraints, security guidelines, and milestone deliverables.

---

## Security Considerations

Because TRACE will ultimately allow users to execute outbound HTTP requests from the backend, robust security safeguards are required to prevent misuse:

* **SSRF Protection (Planned)**: Outbound requests will validate target hostnames and block connections to internal/private IP ranges (such as `127.0.0.1`, `localhost`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, link-local, and cloud metadata endpoints).
* **Timeout Enforcement (Planned)**: Strict upper limits will be enforced on DNS lookups, TCP connection phases, and full response reading to prevent resource exhaustion.
* **Payload Size Caps (Planned)**: Maximum inbound and outbound payload sizes will be restricted to protect memory.
* **Redirect Limits (Planned)**: HTTP redirect chains will have strict maximum hop counts to prevent redirect loops.
* **Sensitive Header Masking (Planned)**: Security headers containing credentials (e.g., `Authorization`, `Cookie`, `Set-Cookie`, `Proxy-Authorization`) will be automatically masked in user interfaces.

*Note: These security features are mandatory design requirements to be implemented during core execution phases.*

---

## Current Limitations

TRACE is actively under development. At this current phase:

* Outbound API request execution is not yet implemented.
* Network analysis engines (Header, OPTIONS, CORS, DNS) are not yet functional.
* Timing measurement and request journey visualizations are not yet connected.
* SQLite persistence and request history tracking are not yet initialized.
* Monitoring routines are not yet active.
* UI views currently display verified environment placeholders.

---

## Future Scope

Following completion of the core MVP, the TRACE platform may be extended with:

* **Explain Mode**: Plain-language pedagogical explanations breaking down complex network errors for students.
* **Advanced Monitoring**: Scheduled multi-endpoint synthetic monitoring with alerting thresholds.
* **Request Collections**: Organization of request suites with variable substitution and environment profiles.
* **Deep Protocol Experiments**: Explorations of HTTP/2 and HTTP/3 multiplexing, TLS certificate chain inspection, and custom header benchmarking.

---

## Visual & Design Identity

TRACE adheres to a strict developer-tool design language:

* **Color Palette**: Technical dark theme based on Black (`#000000`), Near Black (`#0A0A0A`), Off-White (`#F5F5F5`), and Gray (`#6B6B6B`), with vivid Orange (`#FF6A00`) and Dark Orange (`#D94F00`) reserved for strategic emphasis and active states.
* **Geometry**: Sharp rectangular panels, 0–2px corner radius, thin 1px borders, and clear separators. Avoids bubbly, pill-shaped, or floating SaaS cards.
* **Typography**: Clean sans-serif for interface controls paired with monospace fonts for URLs, HTTP verbs, headers, status codes, IPs, and telemetry.
