import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import type { NewSkill } from '~/lib/db/schema'

interface SkillsFormValues {
  skills: NewSkill[] // Partial because new skills might not have an id yet
}

interface SkillsEditorSectionProps {
  skills?: NewSkill[] | null
  portfolioId: string
}

const SkillsEditorSection = ({ skills: initialSkills, portfolioId }: SkillsEditorSectionProps) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm<SkillsFormValues>({
    defaultValues: {
      skills: initialSkills || [],
    },
    mode: 'onChange', // To track dirty fields accurately for updates
  })

  useEffect(() => {
    reset({ skills: initialSkills || [] })
  }, [initialSkills, reset])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'skills',
  })

  const handleAddNewSkill = () => {
    // For immediate add UX, we'd call addSkillMutation here with placeholder data,
    // then update the form state. Or, add to form, then save on main "Save Skills".
    // Simpler: append to form, user fills it, then saves.
    // For this iteration, let's make "Add Skill" add to the form, and "Save All Skills" persist them.
    append({ name: '', category: '', level: 50, portfolioId })
  }

  const handleRemoveSkill = (index: number) => {
    remove(index)
  }

  const onSubmit = async (formData: SkillsFormValues) => {
    if (!isDirty) {
      alert('No changes to save in skills.')
      return
    }
    // TODO: Call the server action endpoint (e.g., /routes/editor.skills) via fetch or mutation function
    // Example:
    // const response = await fetch('/routes/editor.skills', {
    //   method: 'POST',
    //   body: JSON.stringify({ skillsData: formData.skills }),
    //   headers: { 'Content-Type': 'application/json' },
    // })
    // if (!response.ok) throw new Error('Failed to save skills')
    // const result = await response.json()
    // if (result.success) { alert('Skills saved successfully!') }
    // else { alert('Error saving skills: ' + result.error) }
    throw new Error('Not implemented: replace supabase calls with server action fetch')
  }

  return (
    <section className="p-6 bg-white shadow-md rounded-lg mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Skills</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border border-gray-300 rounded-md space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`skills.${index}.name`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Skill Name
                </label>
                <input
                  {...register(`skills.${index}.name` as const, {
                    required: 'Skill name is required',
                  })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., React"
                />
              </div>
              <div>
                <label
                  htmlFor={`skills.${index}.category`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Category (Optional)
                </label>
                <input
                  {...register(`skills.${index}.category` as const)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Frontend"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor={`skills.${index}.level`}
                className="block text-sm font-medium text-gray-700"
              >
                Skill Level (1-100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                {...register(`skills.${index}.level` as const, {
                  valueAsNumber: true,
                  min: { value: 1, message: 'Level must be at least 1' },
                  max: { value: 100, message: 'Level cannot exceed 100' },
                })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="50"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveSkill(index)}
              className="ml-2 text-red-600 hover:text-red-700 text-xs font-medium"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddNewSkill}
          className="mb-6 py-2 px-4 border border-dashed border-gray-400 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add New Skill
        </button>

        <div>
          <button
            type="submit"
            disabled={!isDirty}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            Save All Skill Changes
          </button>
        </div>
      </form>
    </section>
  )
}

export default SkillsEditorSection
