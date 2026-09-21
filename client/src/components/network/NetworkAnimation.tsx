import React, { useEffect, useRef } from 'react'

interface NetworkAnimationProps {
  className?: string
}

/*
 * Renders the TRACE network visualization:
 *   REQUEST ──●──●──●── RESPONSE
 *              DNS HTTP
 *
 * An orange circle travels along the horizontal path on loop.
 * Pure SVG + CSS — no animation library required.
 */
export const NetworkAnimation: React.FC<NetworkAnimationProps> = ({ className = '' }) => {
  const dotRef = useRef<SVGCircleElement>(null)

  // Drive the offset animation in JS for compatibility with strict Tailwind v4
  useEffect(() => {
    const dot = dotRef.current
    if (!dot) return

    let start: number | null = null
    const duration = 2400 // ms per trip

    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const elapsed = (timestamp - start) % duration
      const progress = elapsed / duration // 0 → 1

      // Ease-in-out cubic
      const eased =
        progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2

      // Path goes from x=10 to x=390 (total width 380)
      const x = 10 + eased * 380

      // Fade in first 8%, full opacity 8-92%, fade out last 8%
      let opacity = 1
      if (progress < 0.08) opacity = progress / 0.08
      else if (progress > 0.92) opacity = (1 - progress) / 0.08

      dot.setAttribute('cx', String(x))
      dot.setAttribute('opacity', String(opacity))

      requestAnimationFrame(animate)
    }

    const rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div
      className={['select-none', className].filter(Boolean).join(' ')}
      aria-label="Request journey visualization"
      role="img"
    >
      <svg
        viewBox="0 0 400 80"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        style={{ maxWidth: 560 }}
        aria-hidden="true"
      >
        {/* Main horizontal track line */}
        <line
          x1="10"
          y1="36"
          x2="390"
          y2="36"
          stroke="#222222"
          strokeWidth="1"
        />

        {/* ── Nodes ────────────────────────── */}
        {/* REQUEST node */}
        <circle cx="10" cy="36" r="4" fill="#333333" />
        <circle cx="10" cy="36" r="2" fill="#555555" />

        {/* DNS node */}
        <circle cx="155" cy="36" r="5" fill="#1E1E1E" stroke="#333333" strokeWidth="1" />
        <circle cx="155" cy="36" r="2" fill="#FF6A00" opacity="0.6" />

        {/* HTTP node */}
        <circle cx="245" cy="36" r="5" fill="#1E1E1E" stroke="#333333" strokeWidth="1" />
        <circle cx="245" cy="36" r="2" fill="#FF6A00" opacity="0.6" />

        {/* RESPONSE node */}
        <circle cx="390" cy="36" r="4" fill="#333333" />
        <circle cx="390" cy="36" r="2" fill="#555555" />

        {/* ── Traveling dot ─────────────────── */}
        <circle
          ref={dotRef}
          cx="10"
          cy="36"
          r="3"
          fill="#FF6A00"
          opacity="0"
        />

        {/* ── Labels ────────────────────────── */}
        {/* REQUEST */}
        <text
          x="10"
          y="60"
          textAnchor="middle"
          fontSize="7"
          fill="#3A3A3A"
          fontFamily="JetBrains Mono, Fira Code, ui-monospace, monospace"
          letterSpacing="0.08em"
        >
          REQUEST
        </text>

        {/* DNS */}
        <text
          x="155"
          y="60"
          textAnchor="middle"
          fontSize="7"
          fill="#555555"
          fontFamily="JetBrains Mono, Fira Code, ui-monospace, monospace"
          letterSpacing="0.08em"
        >
          DNS
        </text>

        {/* HTTP */}
        <text
          x="245"
          y="60"
          textAnchor="middle"
          fontSize="7"
          fill="#555555"
          fontFamily="JetBrains Mono, Fira Code, ui-monospace, monospace"
          letterSpacing="0.08em"
        >
          HTTP
        </text>

        {/* RESPONSE */}
        <text
          x="390"
          y="60"
          textAnchor="middle"
          fontSize="7"
          fill="#3A3A3A"
          fontFamily="JetBrains Mono, Fira Code, ui-monospace, monospace"
          letterSpacing="0.08em"
        >
          RESPONSE
        </text>

        {/* ── Connector ticks above nodes ───── */}
        <line x1="155" y1="30" x2="155" y2="33" stroke="#333333" strokeWidth="1" />
        <line x1="245" y1="30" x2="245" y2="33" stroke="#333333" strokeWidth="1" />
      </svg>
    </div>
  )
}
