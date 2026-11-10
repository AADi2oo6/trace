import React, { useState } from 'react'
import type { RequestJourney } from '../../types/api'
import { JourneyPhaseCard } from './JourneyPhaseCard'
import { ChevronsDown, ChevronsUp } from 'lucide-react'

interface JourneyTimelineProps {
  journey: RequestJourney
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ journey }) => {
  // Track expanded state of phases
  // By default, expand completed and failed phases, keep unavailable collapsed
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const phase of journey.phases) {
      initial[phase.name] = phase.status === 'completed' || phase.status === 'failed'
    }
    return initial
  })

  const togglePhase = (name: string) => {
    setExpandedKeys((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const expandAll = () => {
    const all: Record<string, boolean> = {}
    for (const phase of journey.phases) {
      all[phase.name] = true
    }
    setExpandedKeys(all)
  }

  const collapseAll = () => {
    const none: Record<string, boolean> = {}
    for (const phase of journey.phases) {
      none[phase.name] = false
    }
    setExpandedKeys(none)
  }

  const allExpanded = journey.phases.every((p) => expandedKeys[p.name])

  return (
    <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-5 sm:p-6 space-y-6">
      {/* Controls Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6A00]">
            Lifecycle Sequence
          </span>
          <span className="text-[10px] font-mono text-[#444444]">
            ({journey.phases.length} Ordered Stages)
          </span>
        </div>

        <button
          type="button"
          onClick={allExpanded ? collapseAll : expandAll}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#666666] hover:text-[#E8E8E8] transition-colors"
        >
          {allExpanded ? (
            <>
              <ChevronsUp className="w-3.5 h-3.5" />
              <span>Collapse All</span>
            </>
          ) : (
            <>
              <ChevronsDown className="w-3.5 h-3.5" />
              <span>Expand All</span>
            </>
          )}
        </button>
      </div>

      {/* Vertical Timeline Stages */}
      <div className="relative pt-2">
        {journey.phases.map((phase, idx) => (
          <JourneyPhaseCard
            key={phase.name}
            phase={phase}
            stepNumber={idx + 1}
            isExpanded={!!expandedKeys[phase.name]}
            onToggle={() => togglePhase(phase.name)}
            isLast={idx === journey.phases.length - 1}
            animDelayMs={idx * 60}
          />
        ))}
      </div>
    </div>
  )
}
