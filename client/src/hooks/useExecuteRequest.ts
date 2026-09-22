/**
 * TRACE — useExecuteRequest hook
 * TanStack Query mutation wrapping the API client's executeRequest().
 */

import { useMutation } from '@tanstack/react-query'
import { executeRequest, ApiNetworkError, ApiResponseError } from '../lib/api'
import type { RequestCreate, RequestResponse } from '../types/api'

export interface ExecuteRequestError {
  /** User-facing title */
  title: string
  /** Detailed message */
  message: string
  /** Whether this was a network-level failure vs a backend-level error */
  kind: 'network' | 'backend' | 'unknown'
}

function toExecuteError(err: unknown): ExecuteRequestError {
  if (err instanceof ApiNetworkError) {
    return {
      title: 'Cannot reach backend',
      message: err.message,
      kind: 'network',
    }
  }
  if (err instanceof ApiResponseError) {
    // 422 Unprocessable — FastAPI validation error
    if (err.status === 422) {
      const body = err.body as { detail?: unknown }
      return {
        title: 'Invalid request',
        message:
          typeof body?.detail === 'string'
            ? body.detail
            : 'The request payload was rejected by the backend. Check your input.',
        kind: 'backend',
      }
    }
    return {
      title: `Backend error (HTTP ${err.status})`,
      message: 'The TRACE server returned an unexpected error.',
      kind: 'backend',
    }
  }
  if (err instanceof Error) {
    return {
      title: 'Unexpected error',
      message: err.message,
      kind: 'unknown',
    }
  }
  return {
    title: 'Unexpected error',
    message: 'An unknown error occurred.',
    kind: 'unknown',
  }
}

/**
 * TanStack Query mutates with unknown error type (JS throw is untyped).
 * We use Error as the TError generic and transform in the hook return value.
 */
export function useExecuteRequest() {
  const mutation = useMutation<RequestResponse, Error, RequestCreate>({
    mutationFn: executeRequest,
    throwOnError: false,
  })

  const send = (payload: RequestCreate) => {
    mutation.mutate(payload)
  }

  const structuredError: ExecuteRequestError | null = mutation.error
    ? toExecuteError(mutation.error)
    : null

  return {
    send,
    isPending: mutation.isPending,
    data: mutation.data ?? null,
    error: structuredError,
    reset: mutation.reset,
    status: mutation.status,
  }
}
