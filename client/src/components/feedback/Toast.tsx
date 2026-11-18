import React from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore, type ToastType } from '../../store/toastStore'

const toastStyles: Record<
  ToastType,
  {
    icon: React.ReactNode
    borderClass: string
    badgeClass: string
    bgClass: string
  }
> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    borderClass: 'border-emerald-600/30',
    badgeClass: 'text-emerald-500',
    bgClass: 'bg-emerald-950/20',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    borderClass: 'border-rose-600/30',
    badgeClass: 'text-rose-500',
    bgClass: 'bg-rose-950/20',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    borderClass: 'border-amber-600/30',
    badgeClass: 'text-amber-500',
    bgClass: 'bg-amber-950/20',
  },
  info: {
    icon: <Info className="w-4 h-4 text-sky-500 shrink-0" />,
    borderClass: 'border-sky-600/30',
    badgeClass: 'text-sky-500',
    bgClass: 'bg-sky-950/20',
  },
}

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const style = toastStyles[t.type]
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex items-start gap-3 p-3 border shadow-lg backdrop-blur-md transition-all duration-200 animate-slide-in-left ${style.borderClass} ${style.bgClass} bg-[#111111]/95 text-[#E8E8E8]`}
          >
            <div className="mt-0.5">{style.icon}</div>
            <div className="flex-1 min-w-0">
              {t.title && (
                <div className="text-xs font-mono font-semibold tracking-wide text-[#FFFFFF] mb-0.5">
                  {t.title}
                </div>
              )}
              <div className="text-xs font-mono text-[#CCCCCC] leading-snug break-words">
                {t.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 text-[#666666] hover:text-[#FFFFFF] transition-colors -mr-1 -mt-1"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
