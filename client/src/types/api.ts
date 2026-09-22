/**
 * TRACE Frontend — API Type Definitions
 * Mirrors the backend Pydantic schemas exactly.
 * Source of truth: server/app/schemas/request.py + server/app/core/errors.py
 */

// ── Enums ──────────────────────────────────────────────────────────────────

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export const HTTP_METHODS: HTTPMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]

export type StatusCategory =
  | 'informational'
  | 'success'
  | 'redirection'
  | 'client_error'
  | 'server_error'

export type BodyType = 'json' | 'text' | 'html' | 'empty' | 'binary'

export type HeaderCategory =
  | 'General'
  | 'Content'
  | 'Caching'
  | 'Security'
  | 'Authentication'
  | 'CORS'
  | 'Cookies'
  | 'Connection'
  | 'Redirection'
  | 'Server'
  | 'Other'

export type HeaderSource = 'request' | 'response'

export type JourneyPhaseStatus = 'completed' | 'unavailable' | 'failed' | 'not_applicable'

export type JourneyPhaseSource =
  | 'dns_inspector'
  | 'http_execution'
  | 'response_inspector'
  | 'derived'

export type ErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_URL'
  | 'REQUEST_TIMEOUT'
  | 'DNS_ERROR'
  | 'CONNECTION_ERROR'
  | 'RESPONSE_TOO_LARGE'
  | 'SSRF_BLOCKED'
  | 'REDIRECT_ERROR'
  | 'NOT_IMPLEMENTED'

// ── Models ─────────────────────────────────────────────────────────────────

export interface HeaderAnalysisItem {
  name: string
  value: string
  category: HeaderCategory
  description: string
  source: HeaderSource
  observations: string[] | null
}

export interface OptionsCorsInfo {
  allow_origin: string | null
  allow_methods: string[] | null
  allow_headers: string[] | null
  allow_credentials: boolean | null
  max_age: number | null
  expose_headers: string[] | null
}

export interface OptionsAnalysis {
  is_options_request: boolean
  has_allow_header: boolean
  allowed_methods: string[]
  cors: OptionsCorsInfo | null
  observations: string[]
}

export interface CorsAnalysis {
  is_cors_request: boolean
  request_origin: string | null
  allowed_origin: string | null
  origin_allowed: boolean | null
  wildcard_origin: boolean
  requested_method: string | null
  allowed_methods: string[] | null
  method_allowed: boolean | null
  requested_headers: string[] | null
  allowed_headers: string[] | null
  headers_allowed: boolean | null
  allow_credentials: boolean | null
  max_age: number | null
  expose_headers: string[] | null
  observations: string[]
}

export interface DnsAnalysis {
  hostname: string
  resolved: boolean
  ipv4_addresses: string[]
  ipv6_addresses: string[]
  resolution_time_ms: number | null
  error: string | null
  observations: string[]
}

export interface JourneyPhase {
  name: string
  status: JourneyPhaseStatus
  duration_ms: number | null
  source: JourneyPhaseSource | null
  observations: string[]
}

export interface RequestJourney {
  total_duration_ms: number | null
  completed: boolean
  phases: JourneyPhase[]
  observations: string[]
}

export interface ErrorDetail {
  code: ErrorCode
  message: string
  details: Record<string, unknown> | null
}

// ── Request / Response contracts ───────────────────────────────────────────

export interface RequestCreate {
  method: HTTPMethod
  url: string
  /** Sent as "params" — backend alias maps to query_params */
  params: Record<string, string>
  headers: Record<string, string>
  body?: string | Record<string, unknown> | unknown[] | null
}

export interface RequestResponse {
  success: boolean
  status_code: number | null
  status_text: string | null
  status_category: StatusCategory | null
  message: string | null
  request_id: string | null
  method: string | null
  url: string | null
  headers: Record<string, string> | null
  content_type: string | null
  body: string | null
  body_type: BodyType | null
  body_size: number | null
  duration_ms: number | null
  header_analysis: HeaderAnalysisItem[] | null
  options_analysis: OptionsAnalysis | null
  cors_analysis: CorsAnalysis | null
  dns_analysis: DnsAnalysis | null
  request_journey: RequestJourney | null
  error: ErrorDetail | null
}
