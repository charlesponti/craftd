import { and, eq } from 'drizzle-orm'
import { CalendarIcon, DollarSignIcon, MapPinIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { Link, useActionData, useFetcher, useLoaderData } from 'react-router'
import { Button, getButtonClasses } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/Card'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { useToast } from '~/hooks/useToast'
import { db } from '~/lib/db'
import { companies, jobApplications } from '~/lib/db/schema'
import {
  createErrorResponse,
  createSuccessResponse,
  withAuthAction,
  withAuthLoader,
} from '~/lib/route-utils'
import type { JobApplication } from '~/types/career'
import { JobApplicationStage, JobApplicationStatus } from '~/types/career'

interface LoaderData {
  applications: JobApplication[]
  companies: Array<{ id: string; name: string }>
}

export async function loader(args: LoaderFunctionArgs) {
  return withAuthLoader(args, async ({ user }) => {
    try {
      // Fetch user's job applications with company names
      const applications = await db
        .select({
          id: jobApplications.id,
          userId: jobApplications.userId,
          position: jobApplications.position,
          companyId: jobApplications.companyId,
          company: companies.name,
          status: jobApplications.status,
          startDate: jobApplications.startDate,
          endDate: jobApplications.endDate,
          location: jobApplications.location,
          jobPosting: jobApplications.jobPosting,
          salaryQuoted: jobApplications.salaryQuoted,
          salaryAccepted: jobApplications.salaryAccepted,
          coverLetter: jobApplications.coverLetter,
          resume: jobApplications.resume,
          jobId: jobApplications.jobId,
          link: jobApplications.link,
          phoneScreen: jobApplications.phoneScreen,
          reference: jobApplications.reference,
          stages: jobApplications.stages,
          createdAt: jobApplications.createdAt,
          updatedAt: jobApplications.updatedAt,
        })
        .from(jobApplications)
        .leftJoin(companies, eq(jobApplications.companyId, companies.id))
        .where(eq(jobApplications.userId, user.id))
        .orderBy(jobApplications.startDate)

      // Fetch all companies for the dropdown
      const allCompanies = await db
        .select({
          id: companies.id,
          name: companies.name,
        })
        .from(companies)
        .orderBy(companies.name)

      return createSuccessResponse({ applications, companies: allCompanies })
    } catch (error) {
      console.error('Error fetching job applications:', error)
      return createErrorResponse('Failed to fetch job applications')
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

function ApplicationCard({ application }: { application: JobApplication & { company?: string } }) {
  const fetcher = useFetcher()
  const { addToast } = useToast()

  const handleStatusChange = (newStatus: string) => {
    const formData = new FormData()
    formData.append('operation', 'update')
    formData.append('applicationId', application.id)
    formData.append('status', newStatus)

    fetcher.submit(formData, { method: 'POST' })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this application?')) {
      const formData = new FormData()
      formData.append('operation', 'delete')
      formData.append('applicationId', application.id)

      fetcher.submit(formData, { method: 'POST' })
    }
  }

  // Handle fetcher responses
  if (fetcher.state === 'idle' && fetcher.data) {
    const result = fetcher.data as { success: boolean; error?: string; message?: string }
    if (result.success) {
      addToast(result.message || 'Application updated successfully!', 'success')
    } else {
      addToast(`Error: ${result.error}`, 'error')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case JobApplicationStatus.APPLIED:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case JobApplicationStatus.PHONE_SCREEN:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case JobApplicationStatus.INTERVIEW:
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case JobApplicationStatus.OFFER:
        return 'bg-green-100 text-green-800 border-green-200'
      case JobApplicationStatus.ACCEPTED:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case JobApplicationStatus.REJECTED:
        return 'bg-red-100 text-red-800 border-red-200'
      case JobApplicationStatus.WITHDRAWN:
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card className="hover:shadow-xl transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm group hover:scale-[1.02]">
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {application.position}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {application.company?.charAt(0)?.toUpperCase() || 'C'}
                </span>
              </div>
              <span className="text-gray-700 font-medium">
                {application.company || 'Unknown Company'}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}
            >
              {application.status.replace(/_/g, ' ')}
            </span>
            <Select
              value={application.status}
              onValueChange={handleStatusChange}
              size="sm"
              className="w-24 h-8 text-xs"
            >
              {Object.values(JobApplicationStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>

          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-2">
                <CalendarIcon className="size-4" />
                Applied
              </span>
              <span className="text-gray-900 font-medium">
                {new Date(application.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {application.location && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <MapPinIcon className="size-4" />
                  Location
                </span>
                <span className="text-gray-900 font-medium text-right max-w-32 truncate">
                  {application.location}
                </span>
              </div>
            )}

            {application.salaryQuoted && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <DollarSignIcon className="size-4" />
                  Salary
                </span>
                <span className="text-gray-900 font-medium text-right max-w-32 truncate">
                  {application.salaryQuoted}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Link
              to={`/job-applications/${application.id}`}
              className={getButtonClasses({
                variant: 'outline',
                size: 'sm',
                className: 'flex-1 h-8 text-xs',
              })}
            >
              View Details
            </Link>
            {application.jobPosting && (
              <a
                href={application.jobPosting}
                target="_blank"
                rel="noopener noreferrer"
                className={getButtonClasses({
                  variant: 'outline',
                  size: 'sm',
                  className: 'h-8 text-xs px-3',
                })}
              >
                Job Post
              </a>
            )}
            <Button variant="destructive" size="sm" onClick={handleDelete} className="h-8 text-xs">
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ApplicationsPage() {
  const loaderData = useLoaderData() as { success: boolean; data: LoaderData }
  const actionData = useActionData()
  const [search, setSearch] = useState('')

  if (!loaderData.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
        <div className="container mx-auto py-20">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-2xl">!</span>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600">Failed to load job applications</p>
          </div>
        </div>
      </div>
    )
  }

  const { applications } = loaderData.data

  const filteredApplications = applications.filter(
    (app) =>
      app.position.toLowerCase().includes(search.toLowerCase()) ||
      app.company?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Applications</h1>
            <p className="text-gray-600">
              {filteredApplications.length} application
              {filteredApplications.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
            </p>
          </div>
          <CreateApplicationForm />
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Input
              placeholder="Search by position or company..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="h-11 pl-10 bg-white/80 backdrop-blur-sm border-gray-200"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon className="size-4 text-gray-400" />
            </div>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <SearchIcon className="size-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {search ? 'No applications found' : 'No applications yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {search
                ? `Try adjusting your search for "${search}"`
                : 'Start tracking your job applications and never lose track of opportunities.'}
            </p>
            {!search && <CreateApplicationForm />}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredApplications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
