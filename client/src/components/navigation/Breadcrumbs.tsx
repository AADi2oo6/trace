import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

// Route label map for automatic breadcrumb generation
const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/tester': 'API Tester',
  '/history': 'History',
  '/monitor': 'Monitor',
  '/docs': 'Documentation',
  '/settings': 'Settings',
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const location = useLocation()

  const resolvedItems: BreadcrumbItem[] = items ?? (() => {
    const label = routeLabels[location.pathname] ?? location.pathname
    return [{ label }]
  })()

  return (
    <nav
      aria-label="Breadcrumb"
      className={['flex items-center', className].filter(Boolean).join(' ')}
    >
      <ol className="flex items-center gap-1.5">
        {resolvedItems.map((item, index) => {
          const isLast = index === resolvedItems.length - 1
          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight
                  className="w-3 h-3 text-[#3A3A3A]"
                  aria-hidden="true"
                />
              )}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="text-xs font-mono text-[#6B6B6B] hover:text-[#E8E8E8] transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={[
                    'text-xs font-mono',
                    isLast ? 'text-[#E8E8E8]' : 'text-[#6B6B6B]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
