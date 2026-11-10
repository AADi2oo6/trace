import React, { useState, useEffect, useCallback } from 'react'
import { Activity, X, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import type { MonitorMethod, MonitorCreatePayload } from '../../types/api'

interface CreateMonitorModalProps {
  isOpen: boolean
  isLoading: boolean
  error: string | null
  onClose: () => void
  onSubmit: (payload: MonitorCreatePayload) => void
}

const INTERVAL_OPTIONS = [
  { label: '1 minute (60s)', value: 60 },
  { label: '5 minutes (300s)', value: 300 },
  { label: '15 minutes (900s)', value: 900 },
  { label: '30 minutes (1800s)', value: 1800 },
  { label: '1 hour (3600s)', value: 3600 },
]

export const CreateMonitorModal: React.FC<CreateMonitorModalProps> = ({
  isOpen,
  isLoading,
  error,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState<MonitorMethod>('GET')
  const [intervalSeconds, setIntervalSeconds] = useState(300)
  const [timeoutSeconds, setTimeoutSeconds] = useState(10)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    setName('')
    setUrl('')
    setMethod('GET')
    setIntervalSeconds(300)
    setTimeoutSeconds(10)
    setValidationError(null)
    onClose()
  }, [onClose])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, handleClose])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const trimmedName = name.trim()
    const trimmedUrl = url.trim()

    if (!trimmedName) {
      setValidationError('Monitor name is required.')
      return
    }

    if (!trimmedUrl) {
      setValidationError('Target URL is required.')
      return
    }

    try {
      const parsed = new URL(trimmedUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setValidationError('Target URL must start with http:// or https://')
        return
      }
    } catch {
      setValidationError('Target URL is not a valid URL.')
      return
    }

    onSubmit({
      name: trimmedName,
      url: trimmedUrl,
      method,
      interval_seconds: intervalSeconds,
      timeout_seconds: timeoutSeconds,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-monitor-title"
    >
      <div className="w-full max-w-lg border border-[#222222] bg-[#0E0E0E] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E1E1E] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 border border-[#FF6A0033] bg-[#FF6A0010]">
              <Activity className="w-4 h-4 text-[#FF6A00]" />
            </div>
            <h2 id="create-monitor-title" className="text-sm font-semibold tracking-wide text-[#E8E8E8]">
              Register New Monitor
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="text-[#6B6B6B] hover:text-[#E8E8E8] transition-colors p-1"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Validation or API error display */}
          {(validationError || error) && (
            <div className="p-3 border border-[#EF444430] bg-[#EF44440a] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
              <div className="text-xs text-[#EF4444] font-mono leading-relaxed">
                {validationError || error}
              </div>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-1.5">
            <label htmlFor="monitor-name" className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] block">
              Monitor Name <span className="text-[#FF6A00]">*</span>
            </label>
            <input
              id="monitor-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production Public API"
              className="w-full bg-[#121212] border border-[#222222] px-3 py-2 text-xs font-mono text-[#E8E8E8] placeholder-[#555555] focus:outline-none focus:border-[#FF6A00] transition-colors"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* URL & Method Row */}
          <div className="space-y-1.5">
            <label htmlFor="monitor-url" className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] block">
              Target URL <span className="text-[#FF6A00]">*</span>
            </label>
            <div className="flex">
              {/* Method select */}
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as MonitorMethod)}
                className="bg-[#181818] border border-r-0 border-[#222222] px-2.5 py-2 text-xs font-mono font-bold text-[#FF6A00] outline-none cursor-pointer"
                disabled={isLoading}
                aria-label="HTTP Method"
              >
                <option value="GET" className="bg-[#111111] text-[#E8E8E8]">GET</option>
                <option value="HEAD" className="bg-[#111111] text-[#E8E8E8]">HEAD</option>
              </select>
              {/* URL input */}
              <input
                id="monitor-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/v1/health"
                className="flex-1 bg-[#121212] border border-[#222222] px-3 py-2 text-xs font-mono text-[#E8E8E8] placeholder-[#555555] focus:outline-none focus:border-[#FF6A00] transition-colors"
                disabled={isLoading}
              />
            </div>
            <p className="text-[10px] text-[#555555] font-mono">
              Recurring checks are restricted to safe idempotent methods (GET, HEAD) with strict SSRF protection.
            </p>
          </div>

          {/* Interval & Timeout Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Interval */}
            <div className="space-y-1.5">
              <label htmlFor="monitor-interval" className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] block">
                Interval
              </label>
              <select
                id="monitor-interval"
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                className="w-full bg-[#121212] border border-[#222222] px-3 py-2 text-xs font-mono text-[#E8E8E8] outline-none cursor-pointer"
                disabled={isLoading}
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#111111] text-[#E8E8E8]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Timeout */}
            <div className="space-y-1.5">
              <label htmlFor="monitor-timeout" className="text-xs font-mono uppercase tracking-wider text-[#A0A0A0] block">
                Timeout (seconds)
              </label>
              <input
                id="monitor-timeout"
                type="number"
                min={1}
                max={30}
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                className="w-full bg-[#121212] border border-[#222222] px-3 py-2 text-xs font-mono text-[#E8E8E8] outline-none focus:border-[#FF6A00] transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E1E1E]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isLoading}
            >
              Create Monitor
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
