interface FunnelStage {
  stage: string
  count: number
  percentage: number
}

interface StatusBreakdown {
  status: string
  count: number
  percentage: number
}

interface ApplicationProgressChartProps {
  funnelData: FunnelStage[]
  statusData: StatusBreakdown[]
}

export function ApplicationProgressChart({
  funnelData,
  statusData,
}: ApplicationProgressChartProps) {
  if ((!funnelData || funnelData.length === 0) && (!statusData || statusData.length === 0)) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">📊</div>
        <p>No application data available</p>
      </div>
    )
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      // Funnel stages
      Applied: { color: 'bg-blue-500', icon: '📝' },
      Response: { color: 'bg-yellow-500', icon: '📞' },
      'Phone Screen': { color: 'bg-orange-500', icon: '📞' },
      Interview: { color: 'bg-purple-500', icon: '🎯' },
      'Final Round': { color: 'bg-indigo-500', icon: '🏆' },
      Offer: { color: 'bg-green-500', icon: '🎉' },
      Accepted: { color: 'bg-emerald-500', icon: '✅' },

      // Status breakdown
      APPLIED: { color: 'bg-blue-500', icon: '📝' },
      PHONE_SCREEN: { color: 'bg-yellow-500', icon: '📞' },
      INTERVIEW: { color: 'bg-purple-500', icon: '🎯' },
      FINAL_INTERVIEW: { color: 'bg-indigo-500', icon: '🏆' },
      OFFER: { color: 'bg-green-500', icon: '🎉' },
      ACCEPTED: { color: 'bg-emerald-500', icon: '✅' },
      REJECTED: { color: 'bg-red-500', icon: '❌' },
      WITHDRAWN: { color: 'bg-gray-500', icon: '🚫' },
    }
    return (
      configs[status as keyof typeof configs] || {
        color: 'bg-gray-400',
        icon: '📄',
      }
    )
  }

  // Combine and deduplicate data
  const combinedData: Array<{
    name: string
    count: number
    percentage: number
    type: 'funnel' | 'status'
  }> = []

  // Add funnel data
  if (funnelData) {
    for (const stage of funnelData) {
      combinedData.push({
        name: stage.stage,
        count: stage.count,
        percentage: stage.percentage,
        type: 'funnel',
      })
    }
  }

  // Add status data that doesn't duplicate funnel stages
  if (statusData) {
    for (const status of statusData) {
      const statusName = status.status.replace('_', ' ').toLowerCase()
      const stageName = status.status

      // Only add if not already covered by funnel (avoid duplication)
      if (
        !funnelData?.some(
          (stage) =>
            stage.stage.toLowerCase().includes(statusName) ||
            statusName.includes(stage.stage.toLowerCase())
        )
      ) {
        combinedData.push({
          name: stageName,
          count: status.count,
          percentage: status.percentage,
          type: 'status',
        })
      }
    }
  }

  // Sort by count descending
  const sortedData = combinedData.sort((a, b) => b.count - a.count)
  const maxCount = Math.max(...combinedData.map((item) => item.count))

  return (
    <div className="space-y-4">
      {/* Compact Progress Rows */}
      <div className="space-y-2">
        {sortedData.slice(0, 8).map((item) => {
          const config = getStatusConfig(item.name)
          const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0

          return (
            <div key={item.name} className="flex items-center gap-3 py-1">
              {/* Icon and Label */}
              <div className="flex items-center min-w-[120px]">
                <span className="text-sm mr-2">{config.icon}</span>
                <span className="text-sm font-medium text-gray-700 truncate">
                  {item.name.replace('_', ' ')}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-1.5 mr-3">
                  <div
                    className={`h-1.5 rounded-full ${config.color} transition-all duration-300`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="text-right min-w-[50px] text-xs">
                  <div className="font-bold text-gray-900">{item.count}</div>
                  <div className="text-gray-500">{item.percentage.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
