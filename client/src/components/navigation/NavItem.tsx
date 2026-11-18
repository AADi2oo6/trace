import React from 'react'
import { NavLink } from 'react-router-dom'

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
  description?: string
  collapsed?: boolean
  end?: boolean
}

export const NavItem: React.FC<NavItemProps> = ({
  to,
  icon,
  label,
  description,
  collapsed = false,
  end = false,
}) => {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          'group relative flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 select-none text-xs font-mono',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500',
          isActive
            ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-hover)]',
        ]
          .filter(Boolean)
          .join(' ')
      }
    >
      {({ isActive }) => (
        <>
          {/* Active Accent Bar */}
          {isActive && (
            <span
              className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 dark:bg-blue-500 rounded-r"
              aria-hidden="true"
            />
          )}

          {/* Icon */}
          <span
            className={[
              'w-4 h-4 shrink-0 transition-colors duration-150',
              isActive ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-dim)] group-hover:text-[var(--text-secondary)]',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden="true"
          >
            {icon}
          </span>

          {/* Text content */}
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span
                className={[
                  'text-xs tracking-wider leading-none truncate',
                  isActive ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {label}
              </span>
              {description && (
                <span className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] leading-tight mt-0.5 truncate transition-colors duration-150 font-normal">
                  {description}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </NavLink>
  )
}
