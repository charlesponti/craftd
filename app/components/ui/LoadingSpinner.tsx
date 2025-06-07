interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export function LoadingSpinner({ size = 'md', message, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div
          className={`${sizeClasses[size]} border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto`}
        />
        {message && <p className="text-gray-600 mt-2 text-sm">{message}</p>}
      </div>
    </div>
  )
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner size="lg" message={message} />
    </div>
  )
}

export function InlineLoader({ message }: { message?: string }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 text-center">
      <LoadingSpinner size="md" message={message} />
    </div>
  )
}
