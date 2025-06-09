import { ArrowLeftIcon, CheckIcon, PencilIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { useLoaderData, useNavigate } from 'react-router'
import type { WorkExperience } from '~/lib/db/schema'
import { createSuccessResponse, withAuthLoader } from '~/lib/route-utils'

interface LoaderData {
  workExperience: WorkExperience
}

export async function loader(args: LoaderFunctionArgs) {
  return withAuthLoader(args, async ({ user }) => {
    const { id } = args.params
    if (!id) {
      throw new Response('Work experience ID is required', { status: 400 })
    }

    try {
      const { getWorkExperienceById } = await import('~/lib/db/queries/base')
      const workExperience = await getWorkExperienceById(user.id, id)

      if (!workExperience) {
        throw new Response('Work experience not found', { status: 404 })
      }

      return createSuccessResponse({ workExperience })
    } catch (error) {
      console.error('Error loading work experience:', error)
      throw new Response('Error loading work experience', { status: 500 })
    }
  })
}

export async function action(args: ActionFunctionArgs) {
  return withAuthLoader(args, async ({ user, request }) => {
    const { id } = args.params
    if (!id) {
      throw new Response('Work experience ID is required', { status: 400 })
    }

    const formData = await request.formData()
    const field = formData.get('field') as string
    const value = formData.get('value') as string

    try {
      const { updateWorkExperience } = await import('~/lib/db/queries/base')

      // Convert the value to appropriate type based on field
      let processedValue: string | number | Date | null = value

      if (
        ['baseSalary', 'totalCompensation', 'equityValue', 'signingBonus', 'annualBonus'].includes(
          field
        )
      ) {
        processedValue = value ? Number.parseInt(value) * 100 : null // Convert to cents
      } else if (['teamSize', 'directReports'].includes(field)) {
        processedValue = value ? Number.parseInt(value) : null
      } else if (['startDate', 'endDate'].includes(field)) {
        processedValue = value ? new Date(value) : null
      } else if (
        [
          'tags',
          'bonusHistory',
          'benefits',
          'performanceRatings',
          'salaryAdjustments',
          'metadata',
        ].includes(field)
      ) {
        try {
          processedValue = value ? JSON.parse(value) : null
        } catch {
          processedValue = value
        }
      }

      await updateWorkExperience(user.id, id, { [field]: processedValue })

      return createSuccessResponse({ success: true })
    } catch (error) {
      console.error('Error updating work experience:', error)
      throw new Response('Error updating work experience', { status: 500 })
    }
  })
}

export default function WorkExperienceDetail() {
  const response = useLoaderData<{ success: boolean; data: LoaderData }>()
  const data = response?.data || {}
  const { workExperience } = data
  const navigate = useNavigate()

  if (!workExperience) {
    return <div>Work experience not found</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="border-b border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/career')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              data-testid="back-button"
            >
              <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-3xl font-light text-slate-900 font-serif">
                {workExperience.role}
              </h1>
              <p className="text-lg text-slate-600 font-sans">{workExperience.company}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Basic Information */}
          <Section title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableField
                label="Role/Position"
                value={workExperience.role}
                field="role"
                workExperienceId={workExperience.id}
              />
              <EditableField
                label="Company"
                value={workExperience.company}
                field="company"
                workExperienceId={workExperience.id}
              />
              <EditableField
                label="Start Date"
                value={workExperience.startDate?.toISOString().split('T')[0] || ''}
                field="startDate"
                type="date"
                workExperienceId={workExperience.id}
              />
              <EditableField
                label="End Date"
                value={workExperience.endDate?.toISOString().split('T')[0] || ''}
                field="endDate"
                type="date"
                workExperienceId={workExperience.id}
                placeholder="Leave blank if current"
              />
              <EditableField
                label="Employment Type"
                value={workExperience.employmentType}
                field="employmentType"
                type="select"
                options={[
                  'full-time',
                  'part-time',
                  'contract',
                  'freelance',
                  'internship',
                  'temporary',
                ]}
                workExperienceId={workExperience.id}
              />
              <EditableField
                label="Work Arrangement"
                value={workExperience.workArrangement}
                field="workArrangement"
                type="select"
                options={['office', 'remote', 'hybrid', 'travel']}
                workExperienceId={workExperience.id}
              />
            </div>
            <EditableField
              label="Description"
              value={workExperience.description}
              field="description"
              type="textarea"
              workExperienceId={workExperience.id}
              className="mt-6"
            />
          </Section>

          {/* Financial Information */}
          <Section title="Financial Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableField
                label="Base Salary"
                value={
                  workExperience.baseSalary ? (workExperience.baseSalary / 100).toString() : ''
                }
                field="baseSalary"
                type="number"
                workExperienceId={workExperience.id}
                prefix="$"
                placeholder="Annual salary"
              />
              <EditableField
                label="Total Compensation"
                value={
                  workExperience.totalCompensation
                    ? (workExperience.totalCompensation / 100).toString()
                    : ''
                }
                field="totalCompensation"
                type="number"
                workExperienceId={workExperience.id}
                prefix="$"
                placeholder="Including equity & bonuses"
              />
              <EditableField
                label="Signing Bonus"
                value={
                  workExperience.signingBonus ? (workExperience.signingBonus / 100).toString() : ''
                }
                field="signingBonus"
                type="number"
                workExperienceId={workExperience.id}
                prefix="$"
              />
              <EditableField
                label="Annual Bonus"
                value={
                  workExperience.annualBonus ? (workExperience.annualBonus / 100).toString() : ''
                }
                field="annualBonus"
                type="number"
                workExperienceId={workExperience.id}
                prefix="$"
              />
              <EditableField
                label="Equity Value"
                value={
                  workExperience.equityValue ? (workExperience.equityValue / 100).toString() : ''
                }
                field="equityValue"
                type="number"
                workExperienceId={workExperience.id}
                prefix="$"
                placeholder="Estimated value"
              />
              <EditableField
                label="Equity Percentage"
                value={workExperience.equityPercentage || ''}
                field="equityPercentage"
                workExperienceId={workExperience.id}
                placeholder="0.5%"
              />
            </div>
          </Section>

          {/* Role Details */}
          <Section title="Role Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableField
                label="Seniority Level"
                value={workExperience.seniorityLevel || ''}
                field="seniorityLevel"
                type="select"
                options={[
                  'intern',
                  'entry-level',
                  'mid-level',
                  'senior',
                  'lead',
                  'principal',
                  'staff',
                  'director',
                  'vp',
                  'c-level',
                ]}
                workExperienceId={workExperience.id}
              />
              <EditableField
                label="Department"
                value={workExperience.department || ''}
                field="department"
                workExperienceId={workExperience.id}
              />
              <EditableField
                label="Team Size"
                value={workExperience.teamSize?.toString() || ''}
                field="teamSize"
                type="number"
                workExperienceId={workExperience.id}
              />
              <EditableField
                label="Direct Reports"
                value={workExperience.directReports?.toString() || ''}
                field="directReports"
                type="number"
                workExperienceId={workExperience.id}
              />
              <EditableField
                label="Reports To"
                value={workExperience.reportsTo || ''}
                field="reportsTo"
                workExperienceId={workExperience.id}
              />
              <EditableField
                label="Metrics/KPIs"
                value={workExperience.metrics || ''}
                field="metrics"
                workExperienceId={workExperience.id}
              />
            </div>
          </Section>

          {/* Exit Information */}
          <Section title="Exit Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableField
                label="Reason for Leaving"
                value={workExperience.reasonForLeaving || ''}
                field="reasonForLeaving"
                type="select"
                options={[
                  'promotion',
                  'better_opportunity',
                  'relocation',
                  'layoff',
                  'termination',
                  'contract_end',
                  'career_change',
                  'salary',
                  'culture',
                  'management',
                  'growth',
                  'personal',
                ]}
                workExperienceId={workExperience.id}
              />
            </div>
            <EditableField
              label="Exit Notes"
              value={workExperience.exitNotes || ''}
              field="exitNotes"
              type="textarea"
              workExperienceId={workExperience.id}
              className="mt-6"
            />
          </Section>
        </div>
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/50">
      <h2 className="text-2xl font-light text-slate-900 font-serif mb-6">{title}</h2>
      {children}
    </div>
  )
}

interface EditableFieldProps {
  label: string
  value: string
  field: string
  workExperienceId: string
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select'
  options?: string[]
  prefix?: string
  placeholder?: string
  className?: string
}

function EditableField({
  label,
  value,
  field,
  type = 'text',
  options = [],
  prefix,
  placeholder,
  className = '',
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)

  const handleSave = () => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.style.display = 'none'

    const fieldInput = document.createElement('input')
    fieldInput.name = 'field'
    fieldInput.value = field

    const valueInput = document.createElement('input')
    valueInput.name = 'value'
    valueInput.value = editValue

    form.appendChild(fieldInput)
    form.appendChild(valueInput)
    document.body.appendChild(form)

    form.submit()
    document.body.removeChild(form)

    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const displayValue = value || 'Not set'

  if (isEditing) {
    return (
      <div className={className}>
        <label htmlFor={field} className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {prefix && <span className="text-slate-500">{prefix}</span>}
          {type === 'textarea' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              placeholder={placeholder}
            />
          ) : type === 'select' ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select...</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder={placeholder}
            />
          )}
          <button
            type="button"
            onClick={handleSave}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <CheckIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <label htmlFor={field} className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <div className="flex items-center justify-between group">
        <div className="flex-1">
          {prefix && value && <span className="text-slate-500 mr-1">{prefix}</span>}
          <span className={`${!value ? 'text-slate-400 italic' : 'text-slate-900'}`}>
            {type === 'number' && value ? Number.parseInt(value).toLocaleString() : displayValue}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-all"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
