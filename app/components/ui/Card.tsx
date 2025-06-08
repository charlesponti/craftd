import type React from 'react'
import { cn } from '~/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn('bg-white shadow rounded-lg flex flex-col gap-4 px-4 py-5 sm:p-6', className)}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export function CardHeader({
  title,
  description,
  action,
  children,
}: CardHeaderProps & { children?: React.ReactNode }) {
  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          {title && <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          {children}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}

export function CardTitle({
  children,
  className = '',
}: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg leading-6 font-medium text-gray-900 ${className}`}>{children}</h3>
}

export function CardContent({
  children,
  className = '',
}: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
