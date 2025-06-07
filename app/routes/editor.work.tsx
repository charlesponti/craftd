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
    <section className="p-6 bg-white shadow-md rounded-lg mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Work Experience</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border border-gray-300 rounded-md space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`workExperiences.${index}.role`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Role
                </label>
                <input
                  {...register(`workExperiences.${index}.role` as const, {
                    required: 'Role is required',
                  })}
                  className="mt-1 block w-full input-class"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
              <div>
                <label
                  htmlFor={`workExperiences.${index}.company`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Company
                </label>
                <input
                  {...register(`workExperiences.${index}.company` as const, {
                    required: 'Company is required',
                  })}
                  className="mt-1 block w-full input-class"
                  placeholder="e.g., Acme Corp"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`workExperiences.${index}.startDate`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  {...register(`workExperiences.${index}.startDate` as const, {
                    required: 'Start date is required',
                  })}
                  className="mt-1 block w-full input-class"
                />
              </div>
              <div>
                <label
                  htmlFor={`workExperiences.${index}.endDate`}
                  className="block text-sm font-medium text-gray-700"
                >
                  End Date
                </label>
                <input
                  type="date"
                  {...register(`workExperiences.${index}.endDate` as const)}
                  className="mt-1 block w-full input-class"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor={`workExperiences.${index}.description`}
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                {...register(`workExperiences.${index}.description` as const)}
                rows={4}
                className="mt-1 block w-full input-class"
                placeholder="Describe your responsibilities and achievements"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveExperience(index)}
              className="ml-2 text-red-600 hover:text-red-700 text-xs font-medium"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddNewExperience}
          className="mb-6 py-2 px-4 border border-dashed border-gray-400 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add New Work Experience
        </button>

        <div>
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            Save All Work Experience Changes
          </button>
        </div>
      </form>
      <style>{`
        .input-class {
          display: block;
          width: 100%;
          padding-left: 0.75rem;
          padding-right: 0.75rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-width: 1px;
          border-color: #D1D5DB; /* gray-300 */
          border-radius: 0.375rem; /* rounded-md */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
        }
        .input-class:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          border-color: #6366F1; /* indigo-500 */
          box-shadow: 0 0 0 0.2rem rgba(99,102,241,.25); /* focus:ring-indigo-500 with some opacity */
        }
        .input-class.bg-gray-100 {
            background-color: #F3F4F6; /* gray-100 */
        }
      `}</style>
    </section>
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
