import { Form } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import type { ApplicationWithCompany, Company } from '~/lib/db/schema'
import { JobApplicationStatus } from '~/types/career'
import { getStatusColor } from './utils'

interface OverviewTabProps {
  application: ApplicationWithCompany
  company: Company | null
  isEditing: boolean
}

export function ApplicationOverviewTab({ application, company, isEditing }: OverviewTabProps) {
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
