import { and, eq } from 'drizzle-orm'
import { useState } from 'react'
import {
  Link,
  useActionData,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router'

import { ApplicationProgressChart } from '~/components/career/ApplicationProgressChart'
import { ApplicationTable } from '~/components/career/ApplicationTable'
import { JobApplicationsMetricsCards } from '~/components/career/JobApplicationsMetricsCards'

import { useToast } from '~/hooks/useToast'
import { db } from '~/lib/db'
import {
  getAverageApplicationCycleTime,
  getJobApplicationFunnel,
  getJobApplicationMetrics,
} from '~/lib/db/queries'
import type { JobApplicationFunnel } from '~/lib/db/queries/job-applications'
import { getAllApplicationsWithCompany } from '~/lib/db/queries/job-applications'
import type { JobApplicationMetrics } from '~/lib/db/schema'
import { companies, jobApplications } from '~/lib/db/schema'
import {
  createErrorResponse,
  createSuccessResponse,
  withAuthAction,
  withAuthLoader,
} from '~/lib/route-utils'
import { centsToDollars, formatPercentage } from '~/lib/utils'
import type { ApplicationWithCompany } from '~/types/applications'
import { JobApplicationStage, type JobApplicationStatus } from '~/types/career'

interface LoaderData {
  user: { id: string; email?: string | null; firstName?: string | null; name?: string | null }
  metrics: JobApplicationMetrics
  funnel: JobApplicationFunnel[]
  averageCycleTime: number
  allApplications: ApplicationWithCompany[]
  error?: string
}

export async function loader(args: LoaderFunctionArgs) {
  return withAuthLoader(args, async ({ user }) => {
    try {
      const [metrics, funnel, averageCycleTime, allApplications] = await Promise.all([
        getJobApplicationMetrics(user.id),
        getJobApplicationFunnel(user.id),
        getAverageApplicationCycleTime(user.id),
        getAllApplicationsWithCompany(user.id),
      ])

      return createSuccessResponse({
        user,
        metrics,
        funnel,
        averageCycleTime,
        allApplications,
      })
    } catch (error) {
      console.error('Error loading job applications data:', error)
      return createSuccessResponse({
        user,
        metrics: {
          totalApplications: 0,
          responseRate: 0,
          interviewRate: 0,
          offerRate: 0,
          acceptanceRate: 0,
          averageTimeToResponse: 0,
          averageTimeToOffer: 0,
          averageTimeToDecision: 0,
          salaryMetrics: {
            averageOffered: 0,
            averageAccepted: 0,
            negotiationSuccessRate: 0,
            averageNegotiationIncrease: 0,
          },
          sourceMetrics: [],
          statusBreakdown: [],
        },
        funnel: [],
        averageCycleTime: 0,
        allApplications: [],
        error: 'Failed to load job applications data',
      })
    }
  })
}

export async function action(args: ActionFunctionArgs) {
  return withAuthAction(args, async ({ user, request }) => {
    try {
      const formData = await request.formData()
      const operation = formData.get('operation') as string

      if (operation === 'create') {
        const position = formData.get('position') as string
        const companyName = formData.get('company') as string
        const status = formData.get('status') as string
        const startDate = formData.get('startDate') as string
        const location = formData.get('location') as string
        const jobPosting = formData.get('jobPosting') as string
        const salaryQuoted = formData.get('salaryQuoted') as string

        if (!position || !companyName) {
          return createErrorResponse('Position and company are required')
        }

        // Create or find company
        let company = await db
          .select()
          .from(companies)
          .where(eq(companies.name, companyName))
          .limit(1)

        if (company.length === 0) {
          const [newCompany] = await db.insert(companies).values({ name: companyName }).returning()
          company = [newCompany]
        }

        // Create job application
        const [newApplication] = await db
          .insert(jobApplications)
          .values({
            userId: user.id,
            position,
            companyId: company[0].id,
            status: status as JobApplicationStatus,
            startDate: new Date(startDate),
            location: location || null,
            jobPosting: jobPosting || null,
            salaryQuoted: salaryQuoted || null,
            reference: false,
            stages: [
              {
                stage: JobApplicationStage.APPLICATION,
                date: new Date().toISOString(),
              },
            ],
          })
          .returning()

        return createSuccessResponse(newApplication, 'Job application created successfully')
      }

      if (operation === 'update') {
        const applicationId = formData.get('applicationId') as string
        const status = formData.get('status') as string

        const [updatedApplication] = await db
          .update(jobApplications)
          .set({
            status: status as JobApplicationStatus,
            updatedAt: new Date(),
          })
          .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.userId, user.id)))
          .returning()

        if (!updatedApplication) {
          return createErrorResponse('Job application not found or access denied')
        }

        return createSuccessResponse(updatedApplication, 'Job application updated successfully')
      }

      if (operation === 'delete') {
        const applicationId = formData.get('applicationId') as string

        const [deletedApplication] = await db
          .delete(jobApplications)
          .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.userId, user.id)))
          .returning()

        if (!deletedApplication) {
          return createErrorResponse('Job application not found or access denied')
        }

        return createSuccessResponse({ success: true }, 'Job application deleted successfully')
      }

      return createErrorResponse('Invalid operation')
    } catch (error) {
      console.error('Error in job applications action:', error)
      return createErrorResponse('Failed to process job application request')
    }
  })
}

function CreateApplicationForm() {
  return (
    <Link to="/career/applications/create" className="btn-primary-gradient">
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add Application
    </Link>
  )
}

export default function JobApplicationsDashboard() {
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useActionData()
  const [search, setSearch] = useState('')
  const { addToast } = useToast()

  // Handle action responses
  if (actionData) {
    const result = actionData as { success: boolean; error?: string; message?: string }
    if (result.success) {
      addToast(result.message || 'Operation completed successfully!', 'success')
    } else {
      addToast(`Error: ${result.error}`, 'error')
    }
  }

  if (!loaderData.success) {
    return (
      <div className="page-background">
        <div className="container-app">
          <div className="card-error">
            <h2 className="text-lg font-semibold text-red-800 mb-2 font-serif">
              Error Loading Data
            </h2>
            <p className="text-red-700 font-sans">Failed to load job applications data</p>
          </div>
        </div>
      </div>
    )
  }

  if (loaderData?.error) {
    return (
      <div className="page-background">
        <div className="container-app">
          <div className="card-error">
            <h2 className="text-lg font-semibold text-red-800 mb-2 font-serif">
              Error Loading Data
            </h2>
            <p className="text-red-700 font-sans">{loaderData.error}</p>
            <p className="text-sm text-red-600 mt-2 font-sans">
              Make sure you have job application data in your database.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!loaderData.data) {
    return (
      <div className="page-background">
        <div className="container-app">
          <div className="card-error">
            <h2 className="text-lg font-semibold text-red-800 mb-2 font-serif">
              Error Loading Data
            </h2>
            <p className="text-red-700 font-sans">Failed to load job applications data</p>
          </div>
        </div>
      </div>
    )
  }

  const { user, metrics, funnel, averageCycleTime, allApplications } = loaderData.data

  const filteredApplications = allApplications.filter(
    (app) =>
      app.position.toLowerCase().includes(search.toLowerCase()) ||
      app.company?.toLowerCase().includes(search.toLowerCase())
  )

  if (!metrics) {
    return (
      <div className="page-background">
        <div className="container-app">
          <div className="card-info">
            <h2 className="text-lg font-semibold text-blue-800 mb-2 font-serif">
              No Data Available
            </h2>
            <p className="text-blue-700 font-sans">
              Start tracking your job applications to see analytics here.
            </p>
            <div className="mt-4 flex gap-3">
              <CreateApplicationForm />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-background">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="flex-between">
            <div>
              <h1 className="page-title">Job Applications</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container-app space-section">
        {/* Search Bar */}
        <div className="flex-between">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search by position or company..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="search-input"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <CreateApplicationForm />
        </div>

        {/* Key Metrics Cards */}
        <div className="grid-responsive-2">
          <div className="card-elevated">
            <JobApplicationsMetricsCards metrics={metrics} />
          </div>

          {/* Application Progress */}
          <div className="card-elevated">
            <h2 className="section-title">Application Progress</h2>
            <ApplicationProgressChart funnelData={funnel} statusData={metrics.statusBreakdown} />
          </div>
        </div>

        {/* All Applications */}
        <div className="card-elevated">
          <div className="flex-between mb-6">
            <h2 className="section-title mb-0">All Applications</h2>
            <div className="flex gap-3">
              <CreateApplicationForm />
            </div>
          </div>
          <ApplicationTable
            applications={filteredApplications}
            emptyTitle="No applications found"
            emptyDescription="Start tracking your job applications to see them here"
          />
        </div>

        {/* Salary Insights */}
        {metrics.salaryMetrics.averageOffered > 0 && (
          <div className="card-elevated">
            <h2 className="section-title">Salary Insights</h2>
            <div className="grid-responsive-4">
              <div>
                <p className="metric-label">Average Offered</p>
                <p className="metric-value-large text-slate-900">
                  ${centsToDollars(metrics.salaryMetrics.averageOffered).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="metric-label">Average Accepted</p>
                <p className="metric-value-large text-slate-900">
                  ${centsToDollars(metrics.salaryMetrics.averageAccepted).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="metric-label">Negotiation Success</p>
                <p className="metric-value-large text-success">
                  {formatPercentage(metrics.salaryMetrics.negotiationSuccessRate)}
                </p>
              </div>
              <div>
                <p className="metric-label">Avg. Negotiation Increase</p>
                <p className="metric-value-large text-success">
                  {formatPercentage(metrics.salaryMetrics.averageNegotiationIncrease)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
