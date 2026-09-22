/**
 * TRACE — Request Editor Store
 * Zustand slice for the API Tester request editor state.
 * Kept separate from the app-level store (store/index.ts).
 */

import { create } from 'zustand'
import type { HTTPMethod, RequestCreate, RequestResponse } from '../types/api'

// ── Key-value row (params / headers) ───────────────────────────────────────

export interface KVRow {
  id: string
  key: string
  value: string
  enabled: boolean
}

function newRow(): KVRow {
  return {
    id: crypto.randomUUID(),
    key: '',
    value: '',
    enabled: true,
  }
}

export type BodyContentType = 'json' | 'text' | 'none'

// ── Store shape ─────────────────────────────────────────────────────────────

interface RequestEditorState {
  // Request fields
  method: HTTPMethod
  url: string
  params: KVRow[]
  requestHeaders: KVRow[]
  bodyContentType: BodyContentType
  bodyText: string

  // Actions — method & url
  setMethod: (method: HTTPMethod) => void
  setUrl: (url: string) => void

  // Actions — params
  addParam: () => void
  updateParam: (id: string, field: 'key' | 'value', value: string) => void
  toggleParam: (id: string) => void
  removeParam: (id: string) => void

  // Actions — headers
  addHeader: () => void
  updateHeader: (id: string, field: 'key' | 'value', value: string) => void
  toggleHeader: (id: string) => void
  removeHeader: (id: string) => void

  // Actions — body
  setBodyContentType: (type: BodyContentType) => void
  setBodyText: (text: string) => void

  // Reset
  resetEditor: () => void

  // Last executed request result (shared with Network Analysis page)
  lastResponse: RequestResponse | null
  lastRequestPayload: RequestCreate | null
  lastNetworkError: { title: string; message: string; kind: 'network' | 'backend' | 'unknown' } | null
  setLastResponse: (res: RequestResponse | null) => void
  setLastRequestPayload: (payload: RequestCreate | null) => void
  setLastNetworkError: (err: { title: string; message: string; kind: 'network' | 'backend' | 'unknown' } | null) => void

  // Computed: build the payload for POST /api/requests
  buildPayload: () => RequestCreate
}

// ── Initial state ───────────────────────────────────────────────────────────

const initialState = {
  method: 'GET' as HTTPMethod,
  url: '',
  params: [] as KVRow[],
  requestHeaders: [] as KVRow[],
  bodyContentType: 'none' as BodyContentType,
  bodyText: '',
  lastResponse: null as RequestResponse | null,
  lastRequestPayload: null as RequestCreate | null,
  lastNetworkError: null as { title: string; message: string; kind: 'network' | 'backend' | 'unknown' } | null,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function kvRowsToRecord(rows: KVRow[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const row of rows) {
    if (row.enabled && row.key.trim()) {
      result[row.key.trim()] = row.value
    }
  }
  return result
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useRequestStore = create<RequestEditorState>((set, get) => ({
  ...initialState,

  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),

  // Params
  addParam: () =>
    set((s) => ({ params: [...s.params, newRow()] })),
  updateParam: (id, field, value) =>
    set((s) => ({
      params: s.params.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    })),
  toggleParam: (id) =>
    set((s) => ({
      params: s.params.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    })),
  removeParam: (id) =>
    set((s) => ({ params: s.params.filter((r) => r.id !== id) })),

  // Headers
  addHeader: () =>
    set((s) => ({ requestHeaders: [...s.requestHeaders, newRow()] })),
  updateHeader: (id, field, value) =>
    set((s) => ({
      requestHeaders: s.requestHeaders.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      ),
    })),
  toggleHeader: (id) =>
    set((s) => ({
      requestHeaders: s.requestHeaders.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r,
      ),
    })),
  removeHeader: (id) =>
    set((s) => ({ requestHeaders: s.requestHeaders.filter((r) => r.id !== id) })),

  // Body
  setBodyContentType: (type) => set({ bodyContentType: type }),
  setBodyText: (text) => set({ bodyText: text }),

  // Reset
  resetEditor: () => set(initialState),

  // Last executed request result
  setLastResponse: (lastResponse) => set({ lastResponse }),
  setLastRequestPayload: (lastRequestPayload) => set({ lastRequestPayload }),
  setLastNetworkError: (lastNetworkError) => set({ lastNetworkError }),

  // Build payload
  buildPayload: (): RequestCreate => {
    const { method, url, params, requestHeaders, bodyContentType, bodyText } = get()

    const headersRecord = kvRowsToRecord(requestHeaders)

    // If JSON body type, try to parse; otherwise send as string
    let body: RequestCreate['body'] = null
    if (bodyContentType !== 'none' && bodyText.trim()) {
      if (bodyContentType === 'json') {
        // Add Content-Type if not set
        if (!headersRecord['Content-Type'] && !headersRecord['content-type']) {
          headersRecord['Content-Type'] = 'application/json'
        }
        try {
          body = JSON.parse(bodyText) as Record<string, unknown>
        } catch {
          // Validation should catch this before buildPayload() is called
          body = bodyText
        }
      } else {
        body = bodyText
      }
    }

    return {
      method,
      url: url.trim(),
      params: kvRowsToRecord(params),
      headers: headersRecord,
      body,
    }
  },
}))
