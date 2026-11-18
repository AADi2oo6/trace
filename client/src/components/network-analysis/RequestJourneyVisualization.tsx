import React, { useState } from 'react'
import type { RequestJourney } from '../../types/api'
import { JourneyTimeline } from '../journey/JourneyTimeline'
import { RequestWaterfall } from './RequestWaterfall'
import { BarChart3, ListFilter } from 'lucide-react'

interface RequestJourneyVisualizationProps {
  journey: RequestJourney
  title?: string
  defaultView?: 'both' | 'waterfall' | 'timeline'
}

export const RequestJourneyVisualization: React.FC<RequestJourneyVisualizationProps> = ({
  journey,
  title = 'Request Journey & Network Lifecycle',
  defaultView = 'both',
}) => {
  const [viewMode, setViewMode] = useState<'both' | 'waterfall' | 'timeline'>(defaultView)

  return (
    <div className="space-y-6">
      {/* View Switcher Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#161922] p-4 border border-slate-200 dark:border-[#222736]">
        <div>
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            End-to-end telemetry breakdown across all execution phases
          </p>
        </div>

        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-[#10121A] border border-slate-200 dark:border-[#222736] rounded text-xs font-mono">
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`px-3 py-1 rounded transition-colors ${
              viewMode === 'both'
                ? 'bg-white dark:bg-[#1E2230] text-orange-500 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Combined
          </button>
          <button
            type="button"
            onClick={() => setViewMode('waterfall')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              viewMode === 'waterfall'
                ? 'bg-white dark:bg-[#1E2230] text-orange-500 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Waterfall
          </button>
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              viewMode === 'timeline'
                ? 'bg-white dark:bg-[#1E2230] text-orange-500 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Stages
          </button>
        </div>
      </div>

      {/* Waterfall Section */}
      {(viewMode === 'both' || viewMode === 'waterfall') && (
        <section aria-label="Request timing waterfall">
          <RequestWaterfall journey={journey} />
        </section>
      )}

      {/* Stage Timeline Section */}
      {(viewMode === 'both' || viewMode === 'timeline') && (
        <section aria-label="Request stage timeline">
          <JourneyTimeline journey={journey} />
        </section>
      )}
    </div>
  )
}
