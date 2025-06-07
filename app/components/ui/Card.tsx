/**
 * Reusable Card component to reduce UI duplication
 */

import type React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
}

export function Card({ children, className = '', title, description }: CardProps) {
  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {(title || description) && (
        <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
          {title && <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">{title}</h3>}
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">{children}</div>
    </div>
  )
}

interface CardHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}

export function CardContent({
  children,
  className = '',
}: { children: React.ReactNode; className?: string }) {
  return <div className={`px-4 py-5 sm:p-6 ${className}`}>{children}</div>
}
