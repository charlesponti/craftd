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
    <Link
      to="/job-applications/create"
      className="inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 h-10 px-6 py-2"
    >
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
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-700">Failed to load job applications data</p>
        </div>
      </div>
    )
  }

  if (loaderData?.error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-700">{loaderData.error}</p>
          <p className="text-sm text-red-600 mt-2">
            Make sure you have job application data in your database.
          </p>
        </div>
      </div>
    )
  }

  if (!loaderData.data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-700">Failed to load job applications data</p>
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
      <div className="p-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">No Data Available</h2>
          <p className="text-blue-700">
            Start tracking your job applications to see analytics here.
          </p>
          <div className="mt-4 flex gap-3">
            <CreateApplicationForm />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Applications Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track your application success and optimize your job search strategy
          </p>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {user.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Average Cycle Time</p>
            <p className="text-2xl font-bold text-gray-900">{averageCycleTime} days</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex justify-between items-center">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by position or company..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <svg
              className="w-4 h-4 text-gray-400"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <JobApplicationsMetricsCards metrics={metrics} />

        {/* Application Progress */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Progress</h2>
          <ApplicationProgressChart funnelData={funnel} statusData={metrics.statusBreakdown} />
        </div>
      </div>

      {/* All Applications */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">All Applications</h2>
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
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Salary Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Average Offered</p>
              <p className="text-2xl font-bold text-gray-900">
                ${centsToDollars(metrics.salaryMetrics.averageOffered).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Accepted</p>
              <p className="text-2xl font-bold text-gray-900">
                ${centsToDollars(metrics.salaryMetrics.averageAccepted).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Negotiation Success</p>
              <p className="text-2xl font-bold text-green-600">
                {formatPercentage(metrics.salaryMetrics.negotiationSuccessRate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Negotiation Increase</p>
              <p className="text-2xl font-bold text-green-600">
                {formatPercentage(metrics.salaryMetrics.averageNegotiationIncrease)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
