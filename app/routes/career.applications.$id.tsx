import { Briefcase, Calendar, ChevronLeft, MessageSquare, Paperclip, UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { Link, useActionData, useFetcher, useLoaderData, useParams } from 'react-router'
import {
  ApplicationFilesTab,
  ApplicationNotesTab,
  ApplicationOverviewTab,
  ApplicationTimelineTab,
  QuickActionsDropdown,
} from '~/components/career'
import type {
  ApplicationWithRelations,
  InterviewEntry,
  JobApplicationUpdate,
} from '~/lib/db/schema'
import {
  createErrorResponse,
  createSuccessResponse,
  withAuthAction,
  withAuthLoader,
} from '~/lib/route-utils'
import { JobApplicationsService } from '~/lib/services/job-applications.service'
import { formatStatusText, getStatusColor } from '~/lib/utils/applicationUtils'

export async function loader(args: LoaderFunctionArgs) {
  return withAuthLoader(args, async ({ user }) => {
    const { id } = args.params

    if (!id) {
      return createErrorResponse('Application ID is required')
    }

    try {
      const data = await JobApplicationsService.getApplicationDetail(id, user.id)
      return createSuccessResponse(data)
    } catch (error) {
      console.error('Error fetching application details:', error)
      if (error instanceof Error && error.message === 'Application not found') {
        return createErrorResponse('Application not found')
      }
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
      const hasOwnership = await JobApplicationsService.verifyOwnership(id, user.id)
      if (!hasOwnership) {
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
          'recruiterName',
          'recruiterEmail',
          'recruiterLinkedin',
        ] as const

        for (const field of fields) {
          const value = formData.get(field)
          if (value !== null) {
            updates[field] = value as string | undefined
          }
        }

        await JobApplicationsService.updateApplication(id, updates)
        return createSuccessResponse(null, 'Application updated successfully')
      }

      if (operation === 'add_note') {
        const type = formData.get('noteType') as string
        const title = formData.get('noteTitle') as string
        const content = formData.get('noteContent') as string

        if (!content) {
          return createErrorResponse('Note content is required')
        }

        await JobApplicationsService.addNote(id, type, title, content)
        return createSuccessResponse(null, 'Note added successfully')
      }

      if (operation === 'delete_note') {
        const noteId = formData.get('noteId') as string
        await JobApplicationsService.deleteNote(noteId)
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

        const newInterview: InterviewEntry = {
          type: interviewType,
          date: interviewDate,
          interviewer: interviewer || undefined,
          notes: notes || undefined,
        }

        await JobApplicationsService.addInterview(id, newInterview)
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
  type TabId = 'overview' | 'timeline' | 'notes' | 'files'
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)
  const [showAddInterview, setShowAddInterview] = useState(false)

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
  const { company } = application

  const tabItems = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'notes', label: 'Notes', icon: MessageSquare },
    { id: 'files', label: 'Files', icon: Paperclip },
  ]

  const quickActions = [
    {
      id: 'update-status',
      label: 'Update Status',
      icon: () => <span className="w-2 h-2 bg-blue-500 rounded-full" />,
      onClick: () => setShowStatusUpdate(true),
    },
    {
      id: 'add-note',
      label: 'Add Note',
      icon: MessageSquare,
      onClick: () => setShowAddNote(true),
    },
    {
      id: 'add-interview',
      label: 'Add Interview',
      icon: UserPlus,
      onClick: () => setShowAddInterview(true),
    },
    {
      id: 'view-timeline',
      label: 'View Timeline',
      icon: Calendar,
      onClick: () => setActiveTab('timeline'),
    },
  ]

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <Link
          to="/career/applications"
          className="flex items-center text-sm text-gray-500 hover:text-gray-900"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Applications
        </Link>
      </header>

      {/* Application Header */}
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">{application.position}</h1>
          <p className="text-sm md:text-base text-gray-600">{company?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(application.status)}`}
          >
            {formatStatusText(application.status)}
          </span>
          <QuickActionsDropdown actions={quickActions} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="inline-block h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-6">
        {activeTab === 'overview' && (
          <ApplicationOverviewTab application={application} company={company} />
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
      </div>
    </div>
  )
}
