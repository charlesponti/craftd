import { eq } from 'drizzle-orm'
import { Form, Link, redirect, useActionData } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/Card'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { db } from '~/lib/db'
import { companies, jobApplications } from '~/lib/db/schema'
import {
  createErrorResponse,
  createSuccessResponse,
  withAuthAction,
  withAuthLoader,
} from '~/lib/route-utils'
import { JobApplicationStage, JobApplicationStatus } from '~/types/career'
import type { Route } from './+types/job-applications.create'

export async function loader(args: Route.LoaderArgs) {
  return withAuthLoader(args, async ({ user }) => {
    return createSuccessResponse({ user })
  })
}

export async function action(args: Route.ActionArgs) {
  return withAuthAction(args, async ({ user, request }) => {
    const formData = await request.formData()
    const position = formData.get('position') as string
    const companyName = formData.get('company') as string
    const startDate = formData.get('startDate') as string
    const status = formData.get('status') as JobApplicationStatus
    const location = formData.get('location') as string
    const jobPosting = formData.get('jobPosting') as string
    const salaryQuoted = formData.get('salaryQuoted') as string

    try {
      if (!position || !companyName) {
        return createErrorResponse('Position and company are required')
      }

      // Find or create company
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
          status,
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

      return redirect('/job-applications')
    } catch (error) {
      console.error('Error creating job application:', error)
      return createErrorResponse('Failed to create job application. Please try again.')
    }
  })
}

export default function CreateJobApplication() {
  const actionData = useActionData<{ success: boolean; error?: string }>()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Application</h1>
            <p className="text-gray-600">Track your job application journey</p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              {actionData && !actionData.success && (
                <div className="mb-6 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-sm">!</span>
                  </div>
                  {actionData.error}
                </div>
              )}

              <Form method="post" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="position" className="text-sm font-medium text-gray-700">
                      Job Title *
                    </label>
                    <Input
                      id="position"
                      name="position"
                      placeholder="e.g. Senior Software Engineer"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium text-gray-700">
                      Company *
                    </label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="e.g. Google, Microsoft"
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                      Application Date *
                    </label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <Select name="status" defaultValue={JobApplicationStatus.APPLIED}>
                      <option value="" disabled>
                        Select Status
                      </option>
                      {Object.values(JobApplicationStatus).map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g. San Francisco, CA or Remote"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="jobPosting" className="text-sm font-medium text-gray-700">
                    Job Posting URL
                  </label>
                  <Input
                    id="jobPosting"
                    name="jobPosting"
                    type="url"
                    placeholder="https://..."
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="salaryQuoted" className="text-sm font-medium text-gray-700">
                    Salary Range
                  </label>
                  <Input
                    id="salaryQuoted"
                    name="salaryQuoted"
                    placeholder="e.g. $120k - $150k or $80/hour"
                    className="h-11"
                  />
                </div>

                <div className="flex gap-3 pt-6">
                  <Button
                    type="submit"
                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Create Application
                  </Button>
                  <Link
                    to="/job-applications"
                    className="flex-1 h-11 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                  >
                    Cancel
                  </Link>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
