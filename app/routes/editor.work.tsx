import { and, eq, inArray } from 'drizzle-orm'
import { useEffect } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { useFieldArray, useForm } from 'react-hook-form'
import type { ActionFunctionArgs, MetaFunction } from 'react-router'
import { useFetcher, useOutletContext } from 'react-router'
import { db } from '~/lib/db'
import type { NewWorkExperience, WorkExperience } from '~/lib/db/schema'
import { workExperiences } from '~/lib/db/schema'
import { useToast } from '../hooks/useToast'
import type { FullPortfolio } from '../lib/portfolio.server'
import {
  createErrorResponse,
  createSuccessResponse,
  parseFormData,
  tryAsync,
  withAuthAction,
} from '../lib/route-utils'

interface WorkExperienceFormValues {
  workExperiences: Partial<
    Omit<WorkExperience, 'startDate' | 'endDate'> & {
      startDate?: string
      endDate?: string
    }
  >[]
}

interface WorkExperienceEditorSectionProps {
  workExperiences?: WorkExperience[] | null
  portfolioId: string
}

// Helper function to format dates for HTML date inputs
const formatDateForInput = (date: string | Date | null | undefined): string | undefined => {
  if (!date) return undefined
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (Number.isNaN(dateObj.getTime())) return undefined
    return dateObj.toISOString().split('T')[0] // Returns YYYY-MM-DD format
  } catch {
    return undefined
  }
}

function WorkExperienceEditorSection({
  workExperiences: initialWorkExperiences,
  portfolioId,
}: WorkExperienceEditorSectionProps) {
  const fetcher = useFetcher()
  const { addToast } = useToast()

  // Format work experiences with proper date formatting
  const formattedWorkExperiences =
    initialWorkExperiences?.map((exp) => ({
      ...exp,
      startDate: formatDateForInput(exp.startDate),
      endDate: formatDateForInput(exp.endDate),
    })) || []

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<WorkExperienceFormValues>({
    defaultValues: {
      workExperiences: formattedWorkExperiences,
    },
    mode: 'onChange',
  })

  useEffect(() => {
    const formattedData =
      initialWorkExperiences?.map((exp) => ({
        ...exp,
        startDate: formatDateForInput(exp.startDate),
        endDate: formatDateForInput(exp.endDate),
      })) || []
    reset({ workExperiences: formattedData })
  }, [initialWorkExperiences, reset])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'workExperiences',
  })

  // Handle fetcher errors and success
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const result = fetcher.data as { success: boolean; error?: string; message?: string }
      if (result.success) {
        addToast(result.message || 'Work experiences saved successfully!', 'success')
        reset({ workExperiences: fields })
      } else {
        addToast(`Failed to save work experiences: ${result.error || 'Unknown error'}`, 'error')
      }
    }
  }, [fetcher.state, fetcher.data, reset, fields, addToast])

  const handleAddNewExperience = () => {
    append({
      role: '',
      company: '',
      startDate: undefined,
      endDate: undefined,
      description: '',
      portfolioId,
      metrics: '',
      action: '',
      tags: [],
      metadata: {},
      sortOrder: 0,
      isVisible: true,
    })
  }

  const handleRemoveExperience = (index: number) => {
    remove(index)
  }

  const onSubmit: SubmitHandler<WorkExperienceFormValues> = (formData) => {
    if (!isDirty) {
      addToast('No changes to save in work experiences.', 'info')
      return
    }

    // Clean up the data - only send essential fields
    const experiencesToSave = formData.workExperiences.map((exp) => ({
      id: exp.id,
      role: exp.role,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate,
      description: exp.description,
      metrics: exp.metrics,
      action: exp.action,
      tags: exp.tags || [],
      metadata: exp.metadata || {},
      sortOrder: exp.sortOrder || 0,
      isVisible: exp.isVisible !== false,
      portfolioId,
    }))

    const formData2 = new FormData()
    formData2.append('workExperiencesData', JSON.stringify(experiencesToSave))

    fetcher.submit(formData2, {
      method: 'POST',
      action: '/editor/work',
    })
  }

  const isSaving = fetcher.state === 'submitting'

  return (
    <div className="container mx-auto p-lg">
      <div className="card">
        <div className="mb-xl">
          <h2 className="text-2xl font-semibold text-foreground mb-sm">Work Experience</h2>
          <p className="text-muted text-muted-foreground">
            Add your professional work experience and achievements.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2xl">
          {fields.map((field, index) => (
            <div key={field.id} className="card bg-muted/50 space-y-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">Experience #{index + 1}</h3>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="btn btn-ghost btn-sm text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="form-group">
                  <label htmlFor={`workExperiences.${index}.role`} className="label">
                    Job Title *
                  </label>
                  <input
                    id={`workExperiences.${index}.role`}
                    type="text"
                    {...register(`workExperiences.${index}.role` as const)}
                    className="input"
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`workExperiences.${index}.company`} className="label">
                    Company *
                  </label>
                  <input
                    id={`workExperiences.${index}.company`}
                    type="text"
                    {...register(`workExperiences.${index}.company` as const)}
                    className="input"
                    placeholder="e.g., Google"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="form-group">
                  <label htmlFor={`workExperiences.${index}.startDate`} className="label">
                    Start Date *
                  </label>
                  <input
                    id={`workExperiences.${index}.startDate`}
                    type="date"
                    {...register(`workExperiences.${index}.startDate` as const)}
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`workExperiences.${index}.endDate`} className="label">
                    End Date
                  </label>
                  <input
                    id={`workExperiences.${index}.endDate`}
                    type="date"
                    {...register(`workExperiences.${index}.endDate` as const)}
                    className="input"
                    placeholder="Leave empty if current position"
                  />
                  <p className="text-xs text-muted-foreground mt-xs">
                    Leave empty if this is your current position
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor={`workExperiences.${index}.description`} className="label">
                  Job Description *
                </label>
                <textarea
                  id={`workExperiences.${index}.description`}
                  {...register(`workExperiences.${index}.description` as const)}
                  className="textarea"
                  rows={4}
                  placeholder="Describe your role, responsibilities, and key achievements..."
                />
              </div>

              <div className="form-group">
                <label htmlFor={`workExperiences.${index}.metrics`} className="label">
                  Key Metrics & Achievements
                </label>
                <input
                  id={`workExperiences.${index}.metrics`}
                  type="text"
                  {...register(`workExperiences.${index}.metrics` as const)}
                  className="input"
                  placeholder="e.g., Increased team productivity by 40%, Led team of 8 engineers"
                />
                <p className="text-xs text-muted-foreground mt-xs">
                  Quantifiable achievements and metrics from this role
                </p>
              </div>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-md">
            <button
              type="button"
              onClick={handleAddNewExperience}
              className="btn btn-outline flex-1"
            >
              Add New Experience
            </button>

            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="btn btn-primary flex-1"
            >
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>

          {!isDirty && (
            <p className="text-sm text-muted-foreground text-center">
              Make changes to your work experience to enable saving.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export const meta: MetaFunction = () => {
  return [{ title: 'Work Experience - Portfolio Editor | Craftd' }]
}

export async function action(args: ActionFunctionArgs) {
  return withAuthAction(args, async ({ user }) => {
    const formData = await args.request.formData()
    // Expecting a JSON array of new or updated work experiences under 'workExperiencesData'
    const workExperiencesDataResult = parseFormData<NewWorkExperience[]>(
      formData,
      'workExperiencesData'
    )
    if ('success' in workExperiencesDataResult && !workExperiencesDataResult.success) {
      return workExperiencesDataResult
    }
    const workExperiencesData = workExperiencesDataResult as NewWorkExperience[]
    if (!Array.isArray(workExperiencesData)) {
      return createErrorResponse('Invalid work experiences data')
    }
    // Ensure all experiences have portfolioId
    const portfolioId = workExperiencesData[0]?.portfolioId
    if (!portfolioId) return createErrorResponse('Missing portfolioId')
    // Ensure payload items have portfolioId
    const payload = workExperiencesData.map((e) => ({ ...e, portfolioId }))
    return tryAsync(async () => {
      // Fetch existing experiences for this portfolio
      const existingExperiences = await db
        .select({ id: workExperiences.id })
        .from(workExperiences)
        .where(eq(workExperiences.portfolioId, portfolioId))
      const existingIds = (existingExperiences || []).map((e) => e.id)
      const submittedIds = payload
        .filter((e): e is NewWorkExperience & { id: string } => typeof e.id === 'string')
        .map((e) => e.id)
      // Delete removed experiences
      const idsToDelete = existingIds.filter((id: string) => !submittedIds.includes(id))
      if (idsToDelete.length > 0) {
        await db
          .delete(workExperiences)
          .where(
            and(
              eq(workExperiences.portfolioId, portfolioId),
              inArray(workExperiences.id, idsToDelete)
            )
          )
      }
      // Upsert (insert/update) all submitted experiences
      for (const exp of payload) {
        if (exp.id) {
          // Update existing experience
          const { id, ...updateData } = exp
          await db
            .update(workExperiences)
            .set(updateData)
            .where(and(eq(workExperiences.id, id), eq(workExperiences.portfolioId, portfolioId)))
        } else {
          // Insert new experience
          await db.insert(workExperiences).values(exp)
        }
      }
      return createSuccessResponse(null, 'Work experiences saved successfully')
    }, 'Failed to save work experiences')
  })
}

export default function EditorWork() {
  // Consume portfolio provided by parent editor layout loader via outlet context
  const portfolio = useOutletContext<FullPortfolio>()

  return (
    <WorkExperienceEditorSection
      workExperiences={portfolio.workExperiences}
      portfolioId={portfolio.id}
    />
  )
}
