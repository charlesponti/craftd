import { and, eq } from 'drizzle-orm'
import { useState } from 'react'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { Link, useActionData, useFetcher, useLoaderData, useParams } from 'react-router'
import {
  ApplicationFilesTab,
  ApplicationNotesTab,
  ApplicationOverviewTab,
  ApplicationTimelineTab,
} from '~/components/career'
import { ResumeCustomizer } from '~/components/ResumeCustomizer'
import { Button } from '~/components/ui/button'
import { db } from '~/lib/db'
import type {
  ApplicationWithRelations,
  InterviewEntry,
  JobApplicationUpdate,
} from '~/lib/db/schema'
import { applicationNotes, companies, jobApplications } from '~/lib/db/schema'
import {
  createErrorResponse,
  createSuccessResponse,
  withAuthAction,
  withAuthLoader,
} from '~/lib/route-utils'

export async function loader(args: LoaderFunctionArgs) {
  return withAuthLoader(args, async ({ user }) => {
    const { id } = args.params

    if (!id) {
      return createErrorResponse('Application ID is required')
    }

    try {
      // Fetch application with company details
      const applicationData = await db
        .select({
          // Application fields
          id: jobApplications.id,
          userId: jobApplications.userId,
          position: jobApplications.position,
          status: jobApplications.status,
          startDate: jobApplications.startDate,
          endDate: jobApplications.endDate,
          location: jobApplications.location,
          jobPosting: jobApplications.jobPosting,
          salaryQuoted: jobApplications.salaryQuoted,
          salaryAccepted: jobApplications.salaryAccepted,
          coverLetter: jobApplications.coverLetter,
          resume: jobApplications.resume,
          phoneScreen: jobApplications.phoneScreen,
          reference: jobApplications.reference,
          interviewDates: jobApplications.interviewDates,
          companyNotes: jobApplications.companyNotes,
          negotiationNotes: jobApplications.negotiationNotes,
          stages: jobApplications.stages,
          createdAt: jobApplications.createdAt,
          updatedAt: jobApplications.updatedAt,
          // Company fields
          company: {
            id: companies.id,
            name: companies.name,
            website: companies.website,
            industry: companies.industry,
            size: companies.size,
            location: companies.location,
            description: companies.description,
          },
        })
        .from(jobApplications)
        .leftJoin(companies, eq(jobApplications.companyId, companies.id))
        .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, user.id)))
        .limit(1)

      if (!applicationData.length) {
        return createErrorResponse('Application not found')
      }

      // Fetch notes
      const notes = await db
        .select()
        .from(applicationNotes)
        .where(eq(applicationNotes.applicationId, id))
        .orderBy(applicationNotes.createdAt)

      return createSuccessResponse({
        application: applicationData[0],
        notes,
        files: [], // TODO: Implement files when file upload is ready
      })
    } catch (error) {
      console.error('Error fetching application details:', error)
      return createErrorResponse('Failed to fetch application details')
    }
  })
}

export async function action(args: ActionFunctionArgs) {
  return withAuthAction(args, async ({ user, request }) => {
    const { id } = args.params
    const formData = await request.formData()
    const operation = formData.get('operation') as string

    if (!id) {
      return createErrorResponse('Application ID is required')
    }

    try {
      // Verify ownership
      const application = await db
        .select()
        .from(jobApplications)
        .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, user.id)))
        .limit(1)

      if (!application.length) {
        return createErrorResponse('Application not found or access denied')
      }

      if (operation === 'update_application') {
        const updates: JobApplicationUpdate = {}

        // Get all possible fields from form
        const fields = [
          'position',
          'status',
          'location',
          'jobPosting',
          'salaryQuoted',
          'salaryAccepted',
          'companyNotes',
          'negotiationNotes',
        ] as const

        for (const field of fields) {
          const value = formData.get(field)
          if (value !== null) {
            updates[field] = value as string | undefined
          }
        }

        if (Object.keys(updates).length > 0) {
          updates.updatedAt = new Date()

          await db.update(jobApplications).set(updates).where(eq(jobApplications.id, id))
        }

        return createSuccessResponse(null, 'Application updated successfully')
      }

      if (operation === 'add_note') {
        const type = formData.get('noteType') as string
        const title = formData.get('noteTitle') as string
        const content = formData.get('noteContent') as string

        if (!content) {
          return createErrorResponse('Note content is required')
        }

        await db.insert(applicationNotes).values({
          applicationId: id,
          type: type || 'general',
          title: title || null,
          content,
        })

        return createSuccessResponse(null, 'Note added successfully')
      }

      if (operation === 'delete_note') {
        const noteId = formData.get('noteId') as string

        await db.delete(applicationNotes).where(eq(applicationNotes.id, noteId))

        return createSuccessResponse(null, 'Note deleted successfully')
      }

      if (operation === 'add_interview') {
        const interviewType = formData.get('interviewType') as InterviewEntry['type']
        const interviewDate = formData.get('interviewDate') as string
        const interviewer = formData.get('interviewer') as string
        const notes = formData.get('interviewNotes') as string

        if (!interviewDate) {
          return createErrorResponse('Interview date is required')
        }

        const currentInterviews = application[0].interviewDates || []
        const newInterview: InterviewEntry = {
          type: interviewType,
          date: interviewDate,
          interviewer: interviewer || undefined,
          notes: notes || undefined,
        }

        await db
          .update(jobApplications)
          .set({
            interviewDates: [...currentInterviews, newInterview],
            updatedAt: new Date(),
          })
          .where(eq(jobApplications.id, id))

        return createSuccessResponse(null, 'Interview added successfully')
      }

      return createErrorResponse('Invalid operation')
    } catch (error) {
      console.error('Error in application detail action:', error)
      return createErrorResponse('Failed to process request')
    }
  })
}

export default function ApplicationDetail() {
  const loaderData = useLoaderData() as { success: boolean; data?: ApplicationWithRelations }
  const actionData = useActionData()
  const params = useParams()
  const fetcher = useFetcher()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'timeline' | 'notes' | 'files' | 'resume'
  >('overview')

  if (!loaderData.success || !loaderData.data) {
    return (
      <div className="bg-gradient-to-br from-red-50 via-white to-pink-50">
        <div className="container mx-auto py-20">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-2xl">!</span>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Application not found</h1>
            <p className="text-gray-600">The requested job application could not be found.</p>
            <Link
              to="/career/applications"
              className="mt-6 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
            >
              Back to Applications
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { application, notes, files } = loaderData.data
  const company = application.company

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/career/applications"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 bg-white border border-gray-300 hover:bg-gray-50 h-9 px-4 py-2"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{application.position}</h1>
            <p className="text-lg text-gray-600">{company?.name || 'Unknown Company'}</p>
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className={isEditing ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {isEditing ? 'Save Changes' : 'Edit Application'}
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-8 border-b border-gray-200 mb-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'notes', label: 'Notes' },
            { id: 'files', label: 'Files' },
            { id: 'resume', label: 'AI Resume' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(tab.id as 'overview' | 'timeline' | 'notes' | 'files' | 'resume')
              }
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <ApplicationOverviewTab
              application={application}
              company={company}
              isEditing={isEditing}
            />
          )}
          {activeTab === 'timeline' && (
            <ApplicationTimelineTab application={application} applicationId={params.id || ''} />
          )}
          {activeTab === 'notes' && (
            <ApplicationNotesTab notes={notes} applicationId={params.id || ''} />
          )}
          {activeTab === 'files' && (
            <ApplicationFilesTab application={application} applicationId={params.id || ''} />
          )}
          {activeTab === 'resume' && (
            <ResumeCustomizer
              applicationId={params.id || ''}
              initialJobPosting={application.jobPosting || ''}
            />
          )}
        </div>
      </div>
    </div>
  )
}
