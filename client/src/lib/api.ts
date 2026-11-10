/**
 * TRACE API Client
 * Single abstraction for communicating with the TRACE backend.
 * All fetch() calls to the backend must go through this module.
 */

import type {
  HistoryDeleteResponse,
  HistoryDetailResponse,
  HistoryListResponse,
  RequestCreate,
  RequestResponse,
  MonitorListResponse,
  MonitorDetailResponse,
  MonitorCreatePayload,
  MonitorUpdatePayload,
  MonitorResultItem,
  MonitorResultListResponse,
  MonitorAnalyticsResponse,
} from '../types/api'

// ── Configuration ──────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:8000'
const API_ENDPOINT = `${BASE_URL}/api/requests`
const HISTORY_ENDPOINT = `${BASE_URL}/api/history`
const MONITORS_ENDPOINT = `${BASE_URL}/api/monitors`

// ── Error types ────────────────────────────────────────────────────────────

export class ApiNetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiNetworkError'
  }
}

export class ApiResponseError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(`Server responded with HTTP ${status}`)
    this.name = 'ApiResponseError'
    this.status = status
    this.body = body
  }
}

// ── Health check ───────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Execute request ────────────────────────────────────────────────────────

export async function executeRequest(payload: RequestCreate): Promise<RequestResponse> {
  let response: Response

  try {
    response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(
      `Cannot reach TRACE backend at ${BASE_URL}. Is the server running?\n${message}`,
    )
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as RequestResponse
}

// ── History endpoints ──────────────────────────────────────────────────────

export async function fetchHistory(limit = 50, offset = 0): Promise<HistoryListResponse> {
  let response: Response
  try {
    response = await fetch(`${HISTORY_ENDPOINT}?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as HistoryListResponse
}

export async function fetchHistoryDetail(id: string): Promise<HistoryDetailResponse> {
  let response: Response
  try {
    response = await fetch(`${HISTORY_ENDPOINT}/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as HistoryDetailResponse
}

export async function deleteHistoryItem(id: string): Promise<HistoryDeleteResponse> {
  let response: Response
  try {
    response = await fetch(`${HISTORY_ENDPOINT}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as HistoryDeleteResponse
}

export async function clearAllHistory(): Promise<HistoryDeleteResponse> {
  let response: Response
  try {
    response = await fetch(HISTORY_ENDPOINT, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as HistoryDeleteResponse
}

// ── Monitor endpoints ──────────────────────────────────────────────────────

export async function fetchMonitors(): Promise<MonitorListResponse> {
  let response: Response
  try {
    response = await fetch(MONITORS_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as MonitorListResponse
}

export async function fetchMonitor(id: string): Promise<MonitorDetailResponse> {
  let response: Response
  try {
    response = await fetch(`${MONITORS_ENDPOINT}/${id}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as MonitorDetailResponse
}

export async function createMonitor(payload: MonitorCreatePayload): Promise<MonitorDetailResponse> {
  let response: Response
  try {
    response = await fetch(MONITORS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as MonitorDetailResponse
}

export async function updateMonitor(id: string, payload: MonitorUpdatePayload): Promise<MonitorDetailResponse> {
  let response: Response
  try {
    response = await fetch(`${MONITORS_ENDPOINT}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as MonitorDetailResponse
}

export async function deleteMonitor(id: string): Promise<{ success: boolean; message: string }> {
  let response: Response
  try {
    response = await fetch(`${MONITORS_ENDPOINT}/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as { success: boolean; message: string }
}

export async function pauseMonitor(id: string): Promise<MonitorDetailResponse> {
  let response: Response
  try {
    response = await fetch(`${MONITORS_ENDPOINT}/${id}/pause`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as MonitorDetailResponse
}

export async function resumeMonitor(id: string): Promise<MonitorDetailResponse> {
  let response: Response
  try {
    response = await fetch(`${MONITORS_ENDPOINT}/${id}/resume`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as MonitorDetailResponse
}

export async function runMonitorNow(id: string): Promise<MonitorResultItem> {
  let response: Response
  try {
    response = await fetch(`${MONITORS_ENDPOINT}/${id}/run`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as MonitorResultItem
}

export async function fetchMonitorResults(
  id: string,
  limit = 50,
  offset = 0,
): Promise<MonitorResultListResponse> {
  let response: Response
  try {
    response = await fetch(`${MONITORS_ENDPOINT}/${id}/results?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as MonitorResultListResponse
}

export async function fetchMonitorAnalytics(
  id: string,
  period = '24h',
): Promise<MonitorAnalyticsResponse> {
  let response: Response
  try {
    response = await fetch(`${MONITORS_ENDPOINT}/${id}/analytics?period=${period}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(`Cannot reach TRACE backend at ${BASE_URL}.\n${message}`)
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  return (await response.json()) as MonitorAnalyticsResponse
}
