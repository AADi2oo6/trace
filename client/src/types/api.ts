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

export type ContentCategory =
  | 'html'
  | 'json'
  | 'xml'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'text'
  | 'binary'
  | 'youtube'

export interface YouTubeMetadata {
  video_id: string
  embed_url: string
  thumbnail_url: string
  watch_url: string
  title: string | null
  author_name: string | null
}

export interface ContentMetadata {
  category: ContentCategory
  mime_type: string
  extension: string
  filename: string
  file_size: number
  is_binary: boolean
  is_preview_supported: boolean
  preview_limitation?: string | null
  encoding?: string | null
  artifact_id?: string | null
  youtube_metadata?: YouTubeMetadata | null
}

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
  start_offset_ms?: number | null
  end_offset_ms?: number | null
  source: JourneyPhaseSource | null
  observations: string[]
  details?: Record<string, unknown> | null
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
  content_metadata?: ContentMetadata | null
  artifact_id?: string | null
  error: ErrorDetail | null
}

// ── History contracts ───────────────────────────────────────────────────────

export interface HistoryListItem {
  id: string
  created_at: string
  method: HTTPMethod
  url: string
  status_code: number | null
  status_text: string | null
  status_category: StatusCategory | null
  duration_ms: number | null
  response_size: number | null
  content_type: string | null
  success: boolean
  error: ErrorDetail | null
}

export interface HistoryListResponse {
  items: HistoryListItem[]
  total: number
}

export interface HistoryDetailResponse {
  id: string
  created_at: string
  method: HTTPMethod
  url: string
  query_params: Record<string, string> | null
  request_headers: Record<string, string> | null
  request_body: string | null
  request_body_type: string | null
  success: boolean
  status_code: number | null
  status_text: string | null
  status_category: StatusCategory | null
  duration_ms: number | null
  content_type: string | null
  response_size: number | null
  response_body: string | null
  response_body_truncated: boolean
  response_headers: Record<string, string> | null
  dns_analysis: DnsAnalysis | null
  header_analysis: HeaderAnalysisItem[] | null
  cors_analysis: CorsAnalysis | null
  options_analysis: OptionsAnalysis | null
  request_journey: RequestJourney | null
  error: ErrorDetail | null
}

export interface HistoryDeleteResponse {
  success: boolean
  message: string
  deleted_count: number
}

// ── Monitoring contracts ───────────────────────────────────────────────────

export type MonitorStatus = 'UP' | 'DOWN' | 'PAUSED' | 'UNKNOWN'
export type MonitorMethod = 'GET' | 'HEAD'

export interface MonitorListItem {
  id: string
  name: string
  url: string
  method: string
  interval_seconds: number
  timeout_seconds: number
  enabled: boolean
  status: MonitorStatus
  last_checked_at: string | null
  next_run_at: string | null
  last_status_code: number | null
  last_duration_ms: number | null
  consecutive_failures: number
  created_at: string
}

export interface MonitorListResponse {
  items: MonitorListItem[]
  total: number
  total_up: number
  total_down: number
  total_paused: number
  avg_response_time_ms: number | null
}

export interface MonitorDetailResponse extends MonitorListItem {
  updated_at: string
}

export interface MonitorCreatePayload {
  name: string
  url: string
  method: MonitorMethod
  interval_seconds: number
  timeout_seconds?: number
}

export interface MonitorUpdatePayload {
  name?: string
  url?: string
  method?: MonitorMethod
  interval_seconds?: number
  timeout_seconds?: number
}

export interface MonitorResultItem {
  id: string
  monitor_id: string
  checked_at: string
  success: boolean
  status_code: number | null
  duration_ms: number | null
  response_size: number | null
  error_code: string | null
  error_message: string | null
}

export interface MonitorResultListResponse {
  items: MonitorResultItem[]
  total: number
}

export interface AnalyticsDataPoint {
  timestamp: string
  duration_ms: number | null
  status_code: number | null
  success: boolean
}

export interface MonitorAnalyticsResponse {
  period: string
  total_checks: number
  successful_checks: number
  failed_checks: number
  uptime_percentage: number | null
  average_duration_ms: number | null
  minimum_duration_ms: number | null
  maximum_duration_ms: number | null
  latest_status: MonitorStatus
  latest_check_at: string | null
  history_points: AnalyticsDataPoint[]
}

// ── Demo API Types (Step 18) ───────────────────────────────────────────────

export interface DemoQueryParamDef {
  name: string
  type: string
  required: boolean
  default: unknown
  description: string
  options?: string[] | null
}

export interface DemoEndpointCatalogueItem {
  id: string
  name: string
  category: string
  method: HTTPMethod
  path: string
  description: string
  expected_status: number
  query_params: DemoQueryParamDef[]
  headers: Record<string, string>
  body?: unknown
  sample_response?: unknown
  tags: string[]
}

export interface DemoCatalogueResponse {
  endpoints: DemoEndpointCatalogueItem[]
  categories: string[]
  total: number
}

// ── Comparison Types (Step 21) ─────────────────────────────────────────────

export type DiffType = 'identical' | 'added' | 'removed' | 'modified'

export interface HeaderDiffItem {
  name: string
  status: DiffType
  leftValue: string | null
  rightValue: string | null
  isMasked?: boolean
}

export interface JsonDiffItem {
  path: string
  status: DiffType
  leftValue: unknown
  rightValue: unknown
}

export interface ComparisonSummaryStats {
  statusMatch: boolean
  leftStatus: number | null
  rightStatus: number | null
  durationDiffMs: number | null
  leftDurationMs: number | null
  rightDurationMs: number | null
  sizeDiffBytes: number | null
  leftSizeBytes: number | null
  rightSizeBytes: number | null
  contentTypeMatch: boolean
  leftContentType: string | null
  rightContentType: string | null
  headersAdded: number
  headersRemoved: number
  headersModified: number
  headersIdentical: number
  jsonKeysAdded: number
  jsonKeysRemoved: number
  jsonKeysModified: number
  jsonKeysIdentical: number
}



