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
      color: 'text-emerald-600',
    },
  ]

  return (
    <div>
      <h2 className="text-2xl font-light text-slate-900 mb-6 font-serif">Performance Metrics</h2>

      <div className="space-y-6">
        {metricsData.map((metric) => (
          <div key={metric.title} className="flex items-center gap-4">
            {/* Icon */}
            <span className="text-xl">{metric.icon}</span>

            {/* Label and Value */}
            <div className="flex-1">
              <div className="text-sm text-slate-500 font-sans">{metric.title}</div>
              <div className={`text-2xl font-light font-serif ${metric.color}`}>{metric.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
