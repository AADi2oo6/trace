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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-history-title"
    >
      <div className="w-full max-w-md border border-[#222222] bg-[#0E0E0E] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E1E1E] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 border border-[#EF444433] bg-[#EF444410]">
              <Trash2 className="w-4 h-4 text-[#EF4444]" />
            </div>
            <h2 id="clear-history-title" className="text-sm font-semibold tracking-wide text-[#E8E8E8]">
              Clear Request History
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-[#6B6B6B] hover:text-[#E8E8E8] transition-colors p-1"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 border border-[#EF444425] bg-[#EF444408]">
            <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
            <div className="text-xs text-[#B0B0B0] leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">{totalCount}</span> {totalCount === 1 ? 'record' : 'records'} from your SQLite request history? This action is permanent and cannot be undone.
            </div>
          </div>
          <p className="text-xs text-[#6B6B6B]">
            All executed requests, response bodies, header analysis, DNS results, and journey timelines will be removed from local persistence.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#1E1E1E] bg-[#0A0A0A] px-5 py-3.5">
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
