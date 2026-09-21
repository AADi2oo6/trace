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
          'group relative flex items-center gap-3 px-3 py-2 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6A00]',
          isActive
            ? 'bg-[#FF6A0010] text-[#FFFFFF] border-l-2 border-[#FF6A00] pl-[10px]'
            : 'text-[#6B6B6B] border-l-2 border-transparent hover:text-[#E8E8E8] hover:bg-[#161616]',
        ]
          .filter(Boolean)
          .join(' ')
      }
    >
      {({ isActive }) => (
        <>
          {/* Icon */}
          <span
            className={[
              'w-4 h-4 shrink-0 transition-colors duration-150',
              isActive ? 'text-[#FF6A00]' : 'text-[#3A3A3A] group-hover:text-[#6B6B6B]',
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
                  'text-xs font-mono tracking-wider leading-none',
                  isActive ? 'text-[#FFFFFF]' : 'text-[#B0B0B0] group-hover:text-[#E8E8E8]',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {label}
              </span>
              {description && (
                <span className="text-[10px] text-[#3A3A3A] group-hover:text-[#555555] leading-tight mt-0.5 truncate transition-colors duration-150">
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
