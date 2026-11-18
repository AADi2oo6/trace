import React, { useEffect } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { Button } from '../ui/Button'

interface ClearHistoryModalProps {
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onConfirm: () => void
  totalCount: number
}

export const ClearHistoryModal: React.FC<ClearHistoryModalProps> = ({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
  totalCount,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-history-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-muted)] px-5 py-4 bg-[var(--bg-panel)]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-md border border-rose-500/30 bg-rose-500/10">
              <Trash2 className="w-4 h-4 text-rose-500" />
            </div>
            <h2 id="clear-history-title" className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">
              Clear Request History
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-sm"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-rose-500/25 bg-rose-500/10">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-[var(--text-primary)]">{totalCount}</span> {totalCount === 1 ? 'record' : 'records'} from your SQLite request history? This action is permanent and cannot be undone.
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            All executed requests, response bodies, header analysis, DNS results, and journey timelines will be removed from local persistence.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border-muted)] bg-[var(--bg-panel)] px-5 py-3.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            loading={isLoading}
          >
            Clear All History
          </Button>
        </div>
      </div>
    </div>
  )
}
