import { Link } from 'react-router'
import type { WorkExperienceWithFinancials } from '~/lib/db/schema'
import { formatCurrency, formatPercentage } from '~/lib/utils'

interface CareerHistoryProps {
  workExperiences: WorkExperienceWithFinancials[]
  careerTimeline: Array<{
    date: string
    type: string
    title: string
    description: string
    company?: string
    role?: string
    salary?: number
    salaryChange?: number
    percentage?: string
  }>
}

export function CareerHistory({ workExperiences }: CareerHistoryProps) {
  // Sort work experiences by start date (most recent first)
  const sortedExperiences = workExperiences
    .filter((exp) => exp.startDate) // Only include experiences with start dates
    .sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
      return dateB - dateA // Descending order (most recent first)
    })

  const formatDuration = (startDate: string | Date, endDate?: string | Date | null) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    if (years < 1) {
      const months = Math.round(years * 12)
      return `${months} month${months !== 1 ? 's' : ''}`
    }

    const wholeYears = Math.floor(years)
    const remainingMonths = Math.round((years - wholeYears) * 12)

    if (remainingMonths === 0) {
      return `${wholeYears} year${wholeYears !== 1 ? 's' : ''}`
    }

    return `${wholeYears}y ${remainingMonths}m`
  }

  const formatDateRange = (startDate: string | Date, endDate?: string | Date | null) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : null

    const startFormatted = start.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })

    const endFormatted = end
      ? end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Present'

    return `${startFormatted} - ${endFormatted}`
  }

  return (
    <div data-testid="career-history">
      <div className="flex items-center justify-between mb-8">
        <h2
          className="text-2xl font-light text-slate-900 font-serif"
          data-testid="work-experience-title"
        >
          Work Experience
        </h2>
        <span className="text-sm text-slate-500 font-sans" data-testid="position-count">
          {sortedExperiences.length} position{sortedExperiences.length !== 1 ? 's' : ''}
        </span>
      </div>

      {sortedExperiences.length > 0 ? (
        <div className="space-y-2" data-testid="work-experience-list">
          {sortedExperiences.map((exp) => (
            <div
              key={exp.id}
              className="border border-slate-200 rounded-sm p-6 hover:border-slate-300 transition-colors"
              data-testid={`work-experience-${exp.id}`}
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3
                      className="text-base font-medium text-slate-900 font-serif mb-1"
                      data-testid="job-title"
                    >
                      {exp.role}
                    </h3>
                    <Link
                      to={`/career/experience/${exp.id}`}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                  <p className="text-sm text-slate-700 font-sans mb-2" data-testid="company-name">
                    {exp.company}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1 text-sm text-slate-500 font-sans"
                  data-testid="employment-dates"
                >
                  {exp.startDate && (
                    <>
                      <span data-testid="date-range">
                        {formatDateRange(exp.startDate, exp.endDate)}
                      </span>
                      <span>•</span>
                      <span data-testid="duration">
                        {formatDuration(exp.startDate, exp.endDate)}
                      </span>
                    </>
                  )}
                  {!exp.endDate && (
                    <span
                      className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-sans"
                      data-testid="current-badge"
                    >
                      Current
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics */}
              {exp.metrics && (
                <p className="text-sm text-slate-600 font-sans italic" data-testid="job-metrics">
                  {exp.metrics}
                </p>
              )}

              {/* Key Stats */}
              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4"
                data-testid="key-stats"
              >
                {exp.currentAnnualizedSalary ? (
                  <KeyStat
                    data-testid="salary-stat"
                    label="Salary"
                    value={formatCurrency(exp.currentAnnualizedSalary / 100)}
                  />
                ) : null}

                {exp.promotionCount !== undefined && exp.promotionCount > 0 ? (
                  <KeyStat
                    data-testid="promotion-stat"
                    label="Promotions"
                    value={exp.promotionCount.toString()}
                  />
                ) : null}

                {exp.averageAnnualRaise && exp.averageAnnualRaise > 0 ? (
                  <KeyStat
                    data-testid="raise-stat"
                    label="Avg. Raise"
                    value={formatPercentage(exp.averageAnnualRaise)}
                  />
                ) : null}

                {exp.totalCompensationReceived && exp.totalCompensationReceived > 0 ? (
                  <KeyStat
                    data-testid="total-comp-stat"
                    label="Total Comp"
                    value={formatCurrency(exp.totalCompensationReceived / 100)}
                  />
                ) : null}
              </div>

              {/* Skills/Tags */}
              {exp.skillsAcquired && exp.skillsAcquired.length > 0 ? (
                <div data-testid="skills-section" className="mt-3">
                  <span className="text-xs text-slate-500 font-sans block mb-2">
                    Skills & Technologies
                  </span>
                  <div className="flex flex-wrap gap-1 md:gap-2" data-testid="skills-list">
                    {exp.skillsAcquired.slice(0, 8).map((skill) => (
                      <span
                        key={skill}
                        className="px-1.5 md:px-2 py-0.5 md:py-1 text-xs bg-slate-100 text-slate-700 rounded font-sans truncate max-w-[120px]"
                        data-testid="skill-tag"
                        title={skill}
                      >
                        {skill}
                      </span>
                    ))}
                    {exp.skillsAcquired.length > 8 && (
                      <span
                        className="px-1.5 md:px-2 py-0.5 md:py-1 text-xs bg-slate-100 text-slate-500 rounded font-sans"
                        data-testid="more-skills-tag"
                      >
                        +{exp.skillsAcquired.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12" data-testid="empty-state">
          <div className="text-slate-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="Empty work experience illustration"
              role="img"
              data-testid="empty-illustration"
            >
              <title>No work experience</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
              />
            </svg>
          </div>
          <p className="text-slate-500 font-sans" data-testid="empty-message">
            No work experience yet
          </p>
          <p className="text-sm text-slate-400 mt-1 font-sans" data-testid="empty-description">
            Add your work experiences to see your career journey
          </p>
        </div>
      )}
    </div>
  )
}

const KeyStat = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="bg-slate-50/50 rounded-lg p-2 md:p-3 min-w-0">
      <span className="text-xs md:text-xs text-slate-500 font-sans block mb-1 truncate">
        {label}
      </span>
      <span
        className="text-xs md:text-sm font-medium text-slate-900 font-serif block truncate"
        title={value}
      >
        {value}
      </span>
    </div>
  )
}
