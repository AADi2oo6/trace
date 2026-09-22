/**
 * TRACE API Client
 * Single abstraction for communicating with the TRACE backend.
 * All fetch() calls to the backend must go through this module.
 */

import type { RequestCreate, RequestResponse } from '../types/api'

// ── Configuration ──────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:8000'
const API_ENDPOINT = `${BASE_URL}/api/requests`

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
    const res = await fetch(`${BASE_URL}/health`, {
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
      // No AbortSignal here — long requests may take up to backend timeout (10s)
    })
  } catch (err) {
    // Network-level failure: CORS on the fetch itself, server down, DNS, etc.
    const message =
      err instanceof Error ? err.message : 'Network request failed'
    throw new ApiNetworkError(
      `Cannot reach TRACE backend at ${BASE_URL}. Is the server running?\n${message}`,
    )
  }

  // Non-2xx status from the backend itself (422 validation, 500, etc.)
  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    throw new ApiResponseError(response.status, body)
  }

  // Parse the successful response
  const data: RequestResponse = await response.json() as RequestResponse
  return data
}
