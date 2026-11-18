import type {
  ComparisonSummaryStats,
  DiffType,
  HeaderDiffItem,
  JsonDiffItem,
} from '../types/api'

// Mask sensitive headers in comparison
const SENSITIVE_HEADER_PATTERNS = [
  'authorization',
  'cookie',
  'set-cookie',
  'api-key',
  'x-api-key',
  'proxy-authorization',
  'token',
]

export function isHeaderSensitive(headerName: string): boolean {
  const lower = headerName.toLowerCase()
  return SENSITIVE_HEADER_PATTERNS.some((pattern) => lower.includes(pattern))
}

export function maskHeaderValue(value: string): string {
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 3)}••••••••${value.slice(-3)}`
}

/**
 * Compare two sets of HTTP headers case-insensitively.
 */
export function diffHeaders(
  leftHeaders: Record<string, string> = {},
  rightHeaders: Record<string, string> = {}
): HeaderDiffItem[] {
  const result: HeaderDiffItem[] = []

  // Normalized map: lowerName -> { origName, value }
  const leftMap = new Map<string, { name: string; val: string }>()
  for (const [k, v] of Object.entries(leftHeaders)) {
    leftMap.set(k.toLowerCase(), { name: k, val: v })
  }

  const rightMap = new Map<string, { name: string; val: string }>()
  for (const [k, v] of Object.entries(rightHeaders)) {
    rightMap.set(k.toLowerCase(), { name: k, val: v })
  }

  const allKeys = new Set([...leftMap.keys(), ...rightMap.keys()])
  const sortedKeys = Array.from(allKeys).sort()

  for (const key of sortedKeys) {
    const left = leftMap.get(key)
    const right = rightMap.get(key)
    const displayName = left ? left.name : right ? right.name : key
    const sensitive = isHeaderSensitive(displayName)

    const rawLeftVal = left ? left.val : null
    const rawRightVal = right ? right.val : null

    const leftVal = sensitive && rawLeftVal ? maskHeaderValue(rawLeftVal) : rawLeftVal
    const rightVal = sensitive && rawRightVal ? maskHeaderValue(rawRightVal) : rawRightVal

    let status: DiffType = 'identical'
    if (left && !right) {
      status = 'removed'
    } else if (!left && right) {
      status = 'added'
    } else if (left && right && left.val !== right.val) {
      status = 'modified'
    }

    result.push({
      name: displayName,
      status,
      leftValue: leftVal,
      rightValue: rightVal,
      isMasked: sensitive,
    })
  }

  return result
}

/**
 * Deep recursive JSON difference calculator.
 */
export function diffJson(
  left: unknown,
  right: unknown,
  path = '$'
): JsonDiffItem[] {
  const diffs: JsonDiffItem[] = []

  // Left exists, right does not
  if (left !== undefined && right === undefined) {
    diffs.push({ path, status: 'removed', leftValue: left, rightValue: undefined })
    return diffs
  }

  // Right exists, left does not
  if (left === undefined && right !== undefined) {
    diffs.push({ path, status: 'added', leftValue: undefined, rightValue: right })
    return diffs
  }

  // Identical primitives or same reference
  if (left === right) {
    diffs.push({ path, status: 'identical', leftValue: left, rightValue: right })
    return diffs
  }

  // Different types
  if (
    left === null ||
    right === null ||
    typeof left !== typeof right ||
    Array.isArray(left) !== Array.isArray(right)
  ) {
    diffs.push({ path, status: 'modified', leftValue: left, rightValue: right })
    return diffs
  }

  // Both are Arrays
  if (Array.isArray(left) && Array.isArray(right)) {
    const maxLen = Math.max(left.length, right.length)
    for (let i = 0; i < maxLen; i++) {
      const itemPath = `${path}[${i}]`
      if (i >= left.length) {
        diffs.push({ path: itemPath, status: 'added', leftValue: undefined, rightValue: right[i] })
      } else if (i >= right.length) {
        diffs.push({ path: itemPath, status: 'removed', leftValue: left[i], rightValue: undefined })
      } else {
        diffs.push(...diffJson(left[i], right[i], itemPath))
      }
    }
    return diffs
  }

  // Both are Objects
  if (typeof left === 'object' && typeof right === 'object') {
    const leftObj = left as Record<string, unknown>
    const rightObj = right as Record<string, unknown>
    const keys = Array.from(new Set([...Object.keys(leftObj), ...Object.keys(rightObj)])).sort()

    for (const k of keys) {
      const propPath = `${path}.${k}`
      if (!(k in rightObj)) {
        diffs.push({ path: propPath, status: 'removed', leftValue: leftObj[k], rightValue: undefined })
      } else if (!(k in leftObj)) {
        diffs.push({ path: propPath, status: 'added', leftValue: undefined, rightValue: rightObj[k] })
      } else {
        diffs.push(...diffJson(leftObj[k], rightObj[k], propPath))
      }
    }
    return diffs
  }

  // Primitives that differ
  diffs.push({ path, status: 'modified', leftValue: left, rightValue: right })
  return diffs
}

/**
 * Generate a comprehensive summary comparison between two responses.
 */
export function compareResponses(
  left: {
    status_code?: number | null
    duration_ms?: number | null
    body_size?: number | null
    content_type?: string | null
    headers?: Record<string, string>
    body?: string | null
  },
  right: {
    status_code?: number | null
    duration_ms?: number | null
    body_size?: number | null
    content_type?: string | null
    headers?: Record<string, string>
    body?: string | null
  }
): {
  stats: ComparisonSummaryStats
  headerDiffs: HeaderDiffItem[]
  jsonDiffs: JsonDiffItem[] | null
  isJson: boolean
} {
  const headerDiffs = diffHeaders(left.headers || {}, right.headers || {})

  let jsonDiffs: JsonDiffItem[] | null = null
  let isJson = false

  try {
    if (left.body && right.body) {
      const leftParsed = JSON.parse(left.body)
      const rightParsed = JSON.parse(right.body)
      jsonDiffs = diffJson(leftParsed, rightParsed)
      isJson = true
    }
  } catch {
    isJson = false
  }

  const headersAdded = headerDiffs.filter((h) => h.status === 'added').length
  const headersRemoved = headerDiffs.filter((h) => h.status === 'removed').length
  const headersModified = headerDiffs.filter((h) => h.status === 'modified').length
  const headersIdentical = headerDiffs.filter((h) => h.status === 'identical').length

  const jsonKeysAdded = jsonDiffs ? jsonDiffs.filter((j) => j.status === 'added').length : 0
  const jsonKeysRemoved = jsonDiffs ? jsonDiffs.filter((j) => j.status === 'removed').length : 0
  const jsonKeysModified = jsonDiffs ? jsonDiffs.filter((j) => j.status === 'modified').length : 0
  const jsonKeysIdentical = jsonDiffs ? jsonDiffs.filter((j) => j.status === 'identical').length : 0

  const durationDiff =
    left.duration_ms !== null &&
    left.duration_ms !== undefined &&
    right.duration_ms !== null &&
    right.duration_ms !== undefined
      ? right.duration_ms - left.duration_ms
      : null

  const sizeDiff =
    left.body_size !== null &&
    left.body_size !== undefined &&
    right.body_size !== null &&
    right.body_size !== undefined
      ? right.body_size - left.body_size
      : null

  const stats: ComparisonSummaryStats = {
    statusMatch: left.status_code === right.status_code,
    leftStatus: left.status_code ?? null,
    rightStatus: right.status_code ?? null,
    durationDiffMs: durationDiff,
    leftDurationMs: left.duration_ms ?? null,
    rightDurationMs: right.duration_ms ?? null,
    sizeDiffBytes: sizeDiff,
    leftSizeBytes: left.body_size ?? null,
    rightSizeBytes: right.body_size ?? null,
    contentTypeMatch: (left.content_type || '').toLowerCase() === (right.content_type || '').toLowerCase(),
    leftContentType: left.content_type ?? null,
    rightContentType: right.content_type ?? null,
    headersAdded,
    headersRemoved,
    headersModified,
    headersIdentical,
    jsonKeysAdded,
    jsonKeysRemoved,
    jsonKeysModified,
    jsonKeysIdentical,
  }

  return {
    stats,
    headerDiffs,
    jsonDiffs,
    isJson,
  }
}
