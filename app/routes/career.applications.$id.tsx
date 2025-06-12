import { and, eq } from 'drizzle-orm'
import { useState } from 'react'
import { Form, Link, useActionData, useFetcher, useLoaderData, useParams } from 'react-router'
import { ResumeCustomizer } from '~/components/ResumeCustomizer'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { db } from '~/lib/db'
import type {
  ApplicationNote,
  ApplicationWithCompany,
  ApplicationWithRelations,
  Company,
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
import { JobApplicationStatus } from '~/types/career'
import type { Route } from './+types/job-applications.$id'

// Component prop types
interface OverviewTabProps {
  application: ApplicationWithCompany
  company: Company | null
  isEditing: boolean
}

interface TimelineTabProps {
  application: ApplicationWithCompany
  applicationId: string
}

interface NotesTabProps {
  notes: ApplicationNote[]
  applicationId: string
}

interface FilesTabProps {
  application: ApplicationWithCompany
  applicationId: string
}

export async function loader(args: Route.LoaderArgs) {
  return withAuthLoader(args, async ({ user }) => {
    const { id } = args.params

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

export async function action(args: Route.ActionArgs) {
  return withAuthAction(args, async ({ user, request }) => {
    const { id } = args.params
    const formData = await request.formData()
    const operation = formData.get('operation') as string

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
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
            <OverviewTab application={application} company={company} isEditing={isEditing} />
          )}
          {activeTab === 'timeline' && (
            <TimelineTab application={application} applicationId={params.id || ''} />
          )}
          {activeTab === 'notes' && <NotesTab notes={notes} applicationId={params.id || ''} />}
          {activeTab === 'files' && (
            <FilesTab application={application} applicationId={params.id || ''} />
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

// Tab Components
function OverviewTab({ application, company, isEditing }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <Form method="post" className="space-y-4">
              <input type="hidden" name="operation" value="update_application" />

              <div>
                <label htmlFor="position" className="text-sm font-medium text-gray-700">
                  Position
                </label>
                <Input name="position" defaultValue={application.position} />
              </div>

              <div>
                <label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <Select name="status" defaultValue={application.status}>
                  {Object.values(JobApplicationStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label htmlFor="location" className="text-sm font-medium text-gray-700">
                  Location
                </label>
                <Input name="location" defaultValue={application.location || ''} />
              </div>

              <div>
                <label htmlFor="jobPosting" className="text-sm font-medium text-gray-700">
                  Job Posting URL
                </label>
                <Input name="jobPosting" type="url" defaultValue={application.jobPosting || ''} />
              </div>

              <div>
                <label htmlFor="salaryQuoted" className="text-sm font-medium text-gray-700">
                  Salary Quoted
                </label>
                <Input name="salaryQuoted" defaultValue={application.salaryQuoted || ''} />
              </div>

              <Button type="submit">Update Application</Button>
            </Form>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="position" className="text-sm font-medium text-gray-700">
                  Position
                </label>
                <p className="text-gray-900">{application.position}</p>
              </div>

              <div>
                <label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    application.status
                  )}`}
                >
                  {application.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <label htmlFor="appliedDate" className="text-sm font-medium text-gray-700">
                  Applied Date
                </label>
                <p className="text-gray-900">
                  {new Date(application.startDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {application.location && (
                <div>
                  <label htmlFor="location" className="text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <p className="text-gray-900">{application.location}</p>
                </div>
              )}

              {application.salaryQuoted && (
                <div>
                  <label htmlFor="salaryQuoted" className="text-sm font-medium text-gray-700">
                    Salary Quoted
                  </label>
                  <p className="text-gray-900">{application.salaryQuoted}</p>
                </div>
              )}

              {application.jobPosting && (
                <div className="pt-4">
                  <a
                    href={application.jobPosting}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 bg-white border border-gray-300 hover:bg-gray-50 h-9 px-4 py-2"
                  >
                    View Job Posting
                  </a>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <Form method="post" className="space-y-4">
              <input type="hidden" name="operation" value="update_application" />

              <div>
                <label htmlFor="companyNotes" className="text-sm font-medium text-gray-700">
                  Company Research
                </label>
                <textarea
                  name="companyNotes"
                  rows={4}
                  defaultValue={application.companyNotes || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notes about the company, culture, values, etc."
                />
              </div>

              <Button type="submit">Update Notes</Button>
            </Form>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <p className="text-gray-900">{company?.name || 'Unknown Company'}</p>
              </div>

              {company?.website && (
                <div>
                  <label htmlFor="website" className="text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {company.website}
                  </a>
                </div>
              )}

              {company?.industry && (
                <div>
                  <label htmlFor="industry" className="text-sm font-medium text-gray-700">
                    Industry
                  </label>
                  <p className="text-gray-900">{company.industry}</p>
                </div>
              )}

              {company?.size && (
                <div>
                  <label htmlFor="size" className="text-sm font-medium text-gray-700">
                    Company Size
                  </label>
                  <p className="text-gray-900">{company.size}</p>
                </div>
              )}

              {company?.location && (
                <div>
                  <label htmlFor="location" className="text-sm font-medium text-gray-700">
                    Company Location
                  </label>
                  <p className="text-gray-900">{company.location}</p>
                </div>
              )}

              {application.companyNotes && (
                <div>
                  <label htmlFor="companyNotes" className="text-sm font-medium text-gray-700">
                    Research Notes
                  </label>
                  <p className="text-gray-700 whitespace-pre-wrap">{application.companyNotes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TimelineTab({ application, applicationId }: TimelineTabProps) {
  const [showAddInterview, setShowAddInterview] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Application Timeline</h3>
        <Button onClick={() => setShowAddInterview(true)}>Add Interview</Button>
      </div>

      {/* Add Interview Form */}
      {showAddInterview && (
        <Card>
          <CardHeader>
            <CardTitle>Add Interview</CardTitle>
          </CardHeader>
          <CardContent>
            <Form method="post" onSubmit={() => setShowAddInterview(false)} className="space-y-4">
              <input type="hidden" name="operation" value="add_interview" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="interviewType" className="text-sm font-medium text-gray-700">
                    Interview Type
                  </label>
                  <Select name="interviewType" defaultValue="phone">
                    <option value="phone">Phone Screen</option>
                    <option value="video">Video Interview</option>
                    <option value="onsite">Onsite Interview</option>
                    <option value="technical">Technical Interview</option>
                    <option value="final">Final Interview</option>
                  </Select>
                </div>

                <div>
                  <label htmlFor="interviewDate" className="text-sm font-medium text-gray-700">
                    Date & Time
                  </label>
                  <Input name="interviewDate" type="datetime-local" required />
                </div>
              </div>

              <div>
                <label htmlFor="interviewer" className="text-sm font-medium text-gray-700">
                  Interviewer
                </label>
                <Input name="interviewer" placeholder="Name or role of interviewer" />
              </div>

              <div>
                <label htmlFor="interviewNotes" className="text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="interviewNotes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional notes about the interview"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Add Interview</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddInterview(false)}>
                  Cancel
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Timeline Display */}
      <div className="space-y-4">
        {/* Application Date */}
        <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border">
          <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Application Submitted</h4>
              <span className="text-sm text-gray-500">
                {new Date(application.startDate).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-600">Initial application submitted</p>
          </div>
        </div>

        {/* Interviews */}
        {application.interviewDates?.map((interview, index) => (
          <div
            key={interview.date}
            className="flex items-start space-x-4 p-4 bg-white rounded-lg border"
          >
            <div className="w-3 h-3 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">
                  {interview.type.replace(/(\b\w)/g, (l) => l.toUpperCase())} Interview
                </h4>
                <span className="text-sm text-gray-500">
                  {new Date(interview.date).toLocaleDateString()}
                </span>
              </div>
              {interview.interviewer && (
                <p className="text-sm text-gray-600">with {interview.interviewer}</p>
              )}
              {interview.notes && <p className="text-sm text-gray-700 mt-1">{interview.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotesTab({ notes, applicationId }: NotesTabProps) {
  const [showAddNote, setShowAddNote] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notes & Feedback</h3>
        <Button onClick={() => setShowAddNote(true)}>Add Note</Button>
      </div>

      {/* Add Note Form */}
      {showAddNote && (
        <Card>
          <CardHeader>
            <CardTitle>Add Note</CardTitle>
          </CardHeader>
          <CardContent>
            <Form method="post" onSubmit={() => setShowAddNote(false)} className="space-y-4">
              <input type="hidden" name="operation" value="add_note" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="noteType" className="text-sm font-medium text-gray-700">
                    Note Type
                  </label>
                  <Select name="noteType" defaultValue="general">
                    <option value="general">General</option>
                    <option value="interview">Interview</option>
                    <option value="feedback">Feedback</option>
                    <option value="research">Research</option>
                    <option value="follow_up">Follow Up</option>
                  </Select>
                </div>

                <div>
                  <label htmlFor="noteTitle" className="text-sm font-medium text-gray-700">
                    Title (Optional)
                  </label>
                  <Input name="noteTitle" placeholder="Note title" />
                </div>
              </div>

              <div>
                <label htmlFor="noteContent" className="text-sm font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  name="noteContent"
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Write your note here..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Add Note</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddNote(false)}>
                  Cancel
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notes yet. Add your first note above.
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    {note.title && <h4 className="font-medium">{note.title}</h4>}
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        note.type === 'interview'
                          ? 'bg-purple-100 text-purple-800'
                          : note.type === 'research'
                            ? 'bg-blue-100 text-blue-800'
                            : note.type === 'follow_up'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {note.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <Form method="post" className="inline">
                      <input type="hidden" name="operation" value="delete_note" />
                      <input type="hidden" name="noteId" value={note.id} />
                      <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          if (!confirm('Delete this note?')) e.preventDefault()
                        }}
                      >
                        Delete
                      </Button>
                    </Form>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

function FilesTab({ application, applicationId }: FilesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Files & Documents</h3>
        <Button disabled>Upload File (Coming Soon)</Button>
      </div>

      {/* Existing text content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {application.resume && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                {application.resume}
              </div>
            </CardContent>
          </Card>
        )}

        {application.coverLetter && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cover Letter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                {application.coverLetter}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {!application.resume && !application.coverLetter && (
        <div className="text-center py-8 text-gray-500">
          No files uploaded yet. File upload functionality coming soon.
        </div>
      )}
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'APPLIED':
      return 'bg-blue-100 text-blue-800'
    case 'PHONE_SCREEN':
      return 'bg-yellow-100 text-yellow-800'
    case 'INTERVIEW':
      return 'bg-purple-100 text-purple-800'
    case 'OFFER':
      return 'bg-green-100 text-green-800'
    case 'ACCEPTED':
      return 'bg-emerald-100 text-emerald-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-800'
    case 'WITHDRAWN':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
