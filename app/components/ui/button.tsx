import { clsx } from 'clsx'
import { forwardRef } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'destructive'
    | 'success'
    | 'warning'
    | 'error'
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl' | 'icon'
}

// Utility function to generate button classes - can be used by both Button and Link components
export function getButtonClasses({
  variant = 'default',
  size = 'default',
  className,
}: {
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
}) {
  return clsx(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
      'bg-gray-900 text-white hover:bg-gray-800': variant === 'default',
      'bg-blue-600 text-white hover:bg-blue-700 shadow-sm': variant === 'primary',
      'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200': variant === 'secondary',
      'border border-gray-300 bg-white hover:bg-gray-50': variant === 'outline',
      'hover:bg-gray-100': variant === 'ghost',
      'bg-red-600 text-white hover:bg-red-700': variant === 'destructive' || variant === 'error',
      'bg-green-600 text-white hover:bg-green-700': variant === 'success',
      'bg-yellow-500 text-white hover:bg-yellow-600': variant === 'warning',
    },
    {
      'h-8 px-2 py-1 text-xs': size === 'xs',
      'h-9 rounded-md px-3': size === 'sm',
      'h-10 px-4 py-2': size === 'default',
      'h-11 rounded-md px-8': size === 'lg',
      'h-12 px-10 py-3 text-base': size === 'xl',
      'h-10 w-10': size === 'icon',
    },
    className
  )
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button className={getButtonClasses({ variant, size, className })} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button }
