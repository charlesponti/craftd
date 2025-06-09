import { centsToDollars, formatCurrency } from '~/lib/utils'
import type { ApplicationWithCompany } from '~/types/applications'

interface ApplicationTableProps {
  applications: ApplicationWithCompany[]
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

export function ApplicationTable({
  applications,
  emptyTitle = 'No applications found',
  emptyDescription = 'Start tracking your job applications to see them here',
  className = '',
}: ApplicationTableProps) {
  if (!applications || applications.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <div className="text-4xl mb-4">📝</div>
        <p className="font-medium">{emptyTitle}</p>
        <p className="text-sm mt-1">{emptyDescription}</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors = {
      APPLIED: 'bg-blue-100 text-blue-800',
      PHONE_SCREEN: 'bg-yellow-100 text-yellow-800',
      INTERVIEW: 'bg-purple-100 text-purple-800',
      FINAL_INTERVIEW: 'bg-indigo-100 text-indigo-800',
      OFFER: 'bg-green-100 text-green-800',
      ACCEPTED: 'bg-emerald-100 text-emerald-800',
      REJECTED: 'bg-red-100 text-red-800',
      WITHDRAWN: 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '—'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatSalary = (salary: number | string | null | undefined) => {
    if (!salary) return '—'

    // If it's already a formatted string, return it
    if (typeof salary === 'string') return salary

    // If it's a number, assume it's in cents and convert
    return formatCurrency(centsToDollars(salary))
  }

  const getCompanyName = (company: string | { name: string } | null | undefined) => {
    if (!company) return 'Unknown Company'
    if (typeof company === 'string') return company
    return company.name || 'Unknown Company'
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Position & Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Applied
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Response
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Salary
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {applications.map((app) => (
            <tr key={app.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{app.position}</div>
                  <div className="text-sm text-gray-500">{getCompanyName(app.company)}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}
                >
                  {app.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(app.applicationDate || app.startDate || null)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(app.responseDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatSalary(app.salaryOffered || app.salaryQuoted)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-500 capitalize">{app.source || '—'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
