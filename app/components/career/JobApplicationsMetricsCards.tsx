import type { JobApplicationMetrics } from '~/lib/db/schema'
import { formatPercentage } from '~/lib/utils'

interface JobApplicationsMetricsCardsProps {
  metrics: JobApplicationMetrics
}

export function JobApplicationsMetricsCards({ metrics }: JobApplicationsMetricsCardsProps) {
  const metricsData = [
    {
      title: 'Avg. Time to Response',
      value: `${Math.round(metrics.averageTimeToResponse)} days`,
      icon: '⏱️',
      color: 'text-indigo-600',
    },
    {
      title: 'Avg. Time to Offer',
      value: `${Math.round(metrics.averageTimeToOffer)} days`,
      icon: '🕐',
      color: 'text-pink-600',
    },
    {
      title: 'Avg. Time to Decision',
      value: `${Math.round(metrics.averageTimeToDecision)} days`,
      icon: '⚡',
      color: 'text-orange-600',
    },
    {
      title: 'Response Rate',
      value: formatPercentage(metrics.responseRate),
      icon: '📧',
      color: 'text-green-600',
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>

      <div className="space-y-4">
        {metricsData.map((metric) => (
          <div key={metric.title} className="flex items-center gap-3">
            {/* Icon */}
            <span className="text-lg">{metric.icon}</span>

            {/* Label and Value */}
            <div className="flex-1">
              <div className="text-sm text-gray-600">{metric.title}</div>
              <div className={`text-xl font-bold ${metric.color}`}>{metric.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
