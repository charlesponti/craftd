import type React from 'react'
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Code,
  Database,
  Upload,
  Navigation,
  Shield,
} from 'lucide-react'

interface FeatureStatus {
  name: string
  description: string
  status: 'completed' | 'in-progress' | 'planned'
  icon: React.ReactNode
}

export default function MigrationStatus() {
  const features: FeatureStatus[] = [
    {
      name: 'Authentication System',
      description: 'Supabase auth integration with React Router v7',
      status: 'completed',
      icon: <Shield className="w-5 h-5" />,
    },
    {
      name: 'Navigation Component',
      description: 'Responsive navigation with auth state management',
      status: 'completed',
      icon: <Navigation className="w-5 h-5" />,
    },
    {
      name: 'Core Routes Migration',
      description: 'All major routes migrated from Svelte to React',
      status: 'completed',
      icon: <Code className="w-5 h-5" />,
    },
    {
      name: 'Portfolio Queries',
      description: 'Database query functions for portfolio data',
      status: 'completed',
      icon: <Database className="w-5 h-5" />,
    },
    {
      name: 'Server Actions - Account',
      description: 'Portfolio deletion and management actions',
      status: 'completed',
      icon: <ArrowRight className="w-5 h-5" />,
    },
    {
      name: 'Server Actions - Editor',
      description: 'Portfolio save and update functionality',
      status: 'completed',
      icon: <ArrowRight className="w-5 h-5" />,
    },
    {
      name: 'Resume Upload',
      description: 'PDF upload with mock parsing functionality',
      status: 'completed',
      icon: <Upload className="w-5 h-5" />,
    },
    {
      name: 'Editor Forms',
      description: 'Work experience, skills, and projects editors',
      status: 'in-progress',
      icon: <Code className="w-5 h-5" />,
    },
    {
      name: 'Real Resume Parsing',
      description: 'Integration with actual PDF parsing service',
      status: 'planned',
      icon: <Upload className="w-5 h-5" />,
    },
    {
      name: 'Error Boundaries',
      description: 'Comprehensive error handling throughout the app',
      status: 'planned',
      icon: <Shield className="w-5 h-5" />,
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'in-progress':
        return <Circle className="w-5 h-5 text-yellow-600 fill-current" />
      case 'planned':
        return <Circle className="w-5 h-5 text-gray-400" />
      default:
        return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'planned':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const completedCount = features.filter((f) => f.status === 'completed').length
  const totalCount = features.length
  const progressPercentage = (completedCount / totalCount) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Svelte to React Router v7 Migration
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Progress on migrating the Craftd portfolio platform
          </p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Migration Progress</span>
              <span className="text-sm text-gray-500">
                {completedCount} of {totalCount} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-lg font-semibold text-green-600 mt-2">
              {Math.round(progressPercentage)}% Complete
            </p>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Migration Features</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {features.map((feature) => (
              <div key={feature.name} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">{getStatusIcon(feature.status)}</div>
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-500">{feature.icon}</div>
                      <div>
                        <h3 className="text-base font-medium text-gray-900">{feature.name}</h3>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}
                    >
                      {feature.status.charAt(0).toUpperCase() +
                        feature.status.slice(1).replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Core Complete</h3>
            <p className="text-sm text-gray-600">
              Authentication, navigation, and core routes are fully migrated and functional.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Server Actions</h3>
            <p className="text-sm text-gray-600">
              Portfolio management and editor save functionality implemented with React Router v7
              actions.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Modern Stack</h3>
            <p className="text-sm text-gray-600">
              Built with React Router v7, Supabase, TanStack Query, and Tailwind CSS.
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Next Steps</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Complete remaining editor form server actions</li>
            <li>• Implement real PDF parsing service integration</li>
            <li>• Add comprehensive error boundaries</li>
            <li>• Optimize database queries and caching</li>
            <li>• Add comprehensive testing</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export function meta() {
  return [
    { title: 'Migration Status | Craftd' },
    { name: 'description', content: 'Svelte to React Router v7 migration progress' },
  ]
}
