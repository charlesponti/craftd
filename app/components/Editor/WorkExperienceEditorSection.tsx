import { useEffect } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { useForm, useFieldArray } from 'react-hook-form'
import type { WorkExperience } from '~/lib/db/schema'

interface WorkExperienceFormValues {
  workExperiences: Partial<WorkExperience>[]
}

interface WorkExperienceEditorSectionProps {
  workExperiences?: WorkExperience[] | null
  portfolioId: string
}

const WorkExperienceEditorSection: React.FC<WorkExperienceEditorSectionProps> = ({
  workExperiences: initialWorkExperiences,
  portfolioId,
}) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm<WorkExperienceFormValues>({
    defaultValues: {
      workExperiences: initialWorkExperiences || [],
    },
    mode: 'onChange',
  })

  useEffect(() => {
    reset({ workExperiences: initialWorkExperiences || [] })
  }, [initialWorkExperiences, reset])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'workExperiences',
  })

  const handleAddNewExperience = () => {
    append({
      title: '',
      subtitle: '',
      description: '',
      role: '',
      startDate: undefined,
      endDate: undefined,
      image: '',
      gradient: '',
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

  const onSubmit: SubmitHandler<WorkExperienceFormValues> = async (formData) => {
    if (!isDirty) {
      alert('No changes to save in work experiences.')
      return
    }
    try {
      const payload = formData.workExperiences.map((exp) => ({ ...exp, portfolioId }))
      const response = await fetch('/editor/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workExperiencesData: payload }),
      })
      const result = (await response.json()) as {
        success: boolean
        message?: string
        error?: string
      }
      if (!response.ok || !result.success) {
        const errorMsg = result.error ?? 'Unknown error'
        alert(`Error saving work experiences: ${errorMsg}`)
        return
      }
      alert(result.message ?? 'Work experiences saved successfully!')
      reset({ workExperiences: formData.workExperiences })
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.error(error)
      alert(`Failed to save work experiences: ${errMsg}`)
    }
  }

  const isLoading = false

  return (
    <section className="p-6 bg-white shadow-md rounded-lg mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Work Experience</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border border-gray-300 rounded-md space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`workExperiences.${index}.title`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Job Title
                </label>
                <input
                  {...register(`workExperiences.${index}.title` as const, {
                    required: 'Job title is required',
                  })}
                  className="mt-1 block w-full input-class"
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div>
                <label
                  htmlFor={`workExperiences.${index}.subtitle`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Company Name
                </label>
                <input
                  {...register(`workExperiences.${index}.subtitle` as const, {
                    required: 'Company name is required',
                  })}
                  className="mt-1 block w-full input-class"
                  placeholder="e.g., Acme Corp"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`workExperiences.${index}.role`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Role
                </label>
                <input
                  {...register(`workExperiences.${index}.role` as const)}
                  className="mt-1 block w-full input-class"
                  placeholder="e.g., Lead Developer"
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
            disabled={isLoading || !isDirty}
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

export default WorkExperienceEditorSection
