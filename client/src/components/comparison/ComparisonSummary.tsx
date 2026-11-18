import React from 'react'
import type { ComparisonSummaryStats } from '../../types/api'
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  FileText,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react'

interface ComparisonSummaryProps {
  stats: ComparisonSummaryStats
  leftLabel?: string
  rightLabel?: string
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({
  stats,
  leftLabel = 'Baseline',
  rightLabel = 'Candidate',
}) => {
  return (
    <div className="space-y-4">
      {/* 4 Core Metric Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Status Code */}
        <div className="p-4 border border-slate-200 dark:border-[#222736] bg-white dark:bg-[#161922] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="uppercase tracking-wider">Status Code</span>
            {stats.statusMatch ? (
              <span className="flex items-center gap-1 text-emerald-500 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Match
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-500 font-semibold text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" /> Differs
              </span>
            )}
          </div>
          <div className="flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">{leftLabel}</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                {stats.leftStatus ?? '—'}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">{rightLabel}</span>
              <span
                className={`text-base font-bold ${
                  stats.statusMatch
                    ? 'text-slate-800 dark:text-slate-100'
                    : 'text-rose-500 dark:text-rose-400'
                }`}
              >
                {stats.rightStatus ?? '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Response Time / Latency */}
        <div className="p-4 border border-slate-200 dark:border-[#222736] bg-white dark:bg-[#161922] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Latency
            </span>
            {stats.durationDiffMs !== null && (
              <span
                className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                  stats.durationDiffMs < 0
                    ? 'text-emerald-500'
                    : stats.durationDiffMs > 0
                    ? 'text-amber-500'
                    : 'text-slate-500'
                }`}
              >
                {stats.durationDiffMs < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : stats.durationDiffMs > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                {stats.durationDiffMs > 0 ? `+${stats.durationDiffMs.toFixed(1)}ms` : `${stats.durationDiffMs.toFixed(1)}ms`}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">{leftLabel}</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                {stats.leftDurationMs !== null ? `${stats.leftDurationMs.toFixed(0)} ms` : '—'}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">{rightLabel}</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                {stats.rightDurationMs !== null ? `${stats.rightDurationMs.toFixed(0)} ms` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Payload Size */}
        <div className="p-4 border border-slate-200 dark:border-[#222736] bg-white dark:bg-[#161922] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="uppercase tracking-wider flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5" /> Size
            </span>
            {stats.sizeDiffBytes !== null && (
              <span className="text-[11px] font-mono text-slate-500">
                {stats.sizeDiffBytes > 0 ? `+${formatBytes(stats.sizeDiffBytes)}` : formatBytes(stats.sizeDiffBytes)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">{leftLabel}</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                {formatBytes(stats.leftSizeBytes)}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">{rightLabel}</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                {formatBytes(stats.rightSizeBytes)}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Content Type */}
        <div className="p-4 border border-slate-200 dark:border-[#222736] bg-white dark:bg-[#161922] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Content-Type
            </span>
            {stats.contentTypeMatch ? (
              <span className="text-emerald-500 text-[11px] font-semibold">Match</span>
            ) : (
              <span className="text-amber-500 text-[11px] font-semibold">Different</span>
            )}
          </div>
          <div className="flex items-center justify-between font-mono">
            <div className="truncate max-w-[45%]">
              <span className="text-[10px] text-slate-400 block">{leftLabel}</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block" title={stats.leftContentType || 'None'}>
                {stats.leftContentType ? stats.leftContentType.split(';')[0] : 'None'}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="text-right truncate max-w-[45%]">
              <span className="text-[10px] text-slate-400 block">{rightLabel}</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block" title={stats.rightContentType || 'None'}>
                {stats.rightContentType ? stats.rightContentType.split(';')[0] : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delta Counts Summary Bar */}
      <div className="p-3 bg-slate-50 dark:bg-[#12141D] border border-slate-200 dark:border-[#222736] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">Headers:</span>
          <span className="text-emerald-500 font-semibold">+{stats.headersAdded} added</span>
          <span className="text-rose-500 font-semibold">-{stats.headersRemoved} removed</span>
          <span className="text-amber-500 font-semibold">~{stats.headersModified} modified</span>
          <span className="text-slate-400">{stats.headersIdentical} identical</span>
        </div>

        {(stats.jsonKeysAdded > 0 || stats.jsonKeysRemoved > 0 || stats.jsonKeysModified > 0) && (
          <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-[#222736] pt-2 sm:pt-0 sm:pl-4">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">JSON Properties:</span>
            <span className="text-emerald-500 font-semibold">+{stats.jsonKeysAdded} added</span>
            <span className="text-rose-500 font-semibold">-{stats.jsonKeysRemoved} removed</span>
            <span className="text-amber-500 font-semibold">~{stats.jsonKeysModified} modified</span>
          </div>
        )}
      </div>
    </div>
  )
}
