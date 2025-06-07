import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import type { NewPortfolioStats } from '~/lib/db/schema'

// Use schema types
type PortfolioStat = NewPortfolioStats

interface PortfolioStatsFormValues {
  stats: Partial<PortfolioStat>[]
}

interface PortfolioStatsEditorSectionProps {
  stats?: PortfolioStat[] | null
  portfolioId: string
}

const PortfolioStatsEditorSection = ({
  stats: initialStats,
  portfolioId,
}: PortfolioStatsEditorSectionProps) => {
  const { user } = useAuth()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm<PortfolioStatsFormValues>({
    defaultValues: {
      stats: initialStats || [],
    },
    mode: 'onChange',
  })

  useEffect(() => {
    reset({ stats: initialStats || [] })
  }, [initialStats, reset])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stats',
  })

  const handleAddNewStat = () => {
    append({ label: '', value: '' })
  }

  const handleRemoveStat = (index: number, statId?: string) => {
    if (statId) {
      if (confirm('Are you sure you want to delete this stat? This action is permanent.')) {
        remove(index)
      }
    } else {
      remove(index)
    }
  }

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const onSubmit = async (formData: PortfolioStatsFormValues) => {
    if (!isDirty) {
      alert('No changes to save in portfolio stats.')
      return
    }
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)
    try {
      const statsToSave = formData.stats.map((s) => ({ ...s, portfolioId }))
      const fd = new FormData()
      fd.append('statsData', JSON.stringify(statsToSave))
      const res = await fetch('/editor.stats', { method: 'POST', body: fd })
      const result: { success?: boolean; error?: string } = await res.json()
      if (result.success) {
        setSaveSuccess('Portfolio stats saved successfully!')
      } else {
        setSaveError(result.error || 'Failed to save stats.')
      }
    } catch (err) {
      setSaveError((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const isLoading = false

  return (
    <section className="p-6 bg-white shadow-md rounded-lg mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Portfolio Stats</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border border-gray-300 rounded-md space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`stats.${index}.label`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Label
                </label>
                <input
                  id={`stats.${index}.label`}
                  {...register(`stats.${index}.label` as const, { required: 'Label is required' })}
                  className="mt-1 block w-full input-class"
                  placeholder="e.g., Projects Completed"
                />
              </div>
              <div>
                <label
                  htmlFor={`stats.${index}.value`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Value
                </label>
                <input
                  id={`stats.${index}.value`}
                  {...register(`stats.${index}.value` as const, { required: 'Value is required' })}
                  className="mt-1 block w-full input-class"
                  placeholder="e.g., 50+"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveStat(index, fields[index].id)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
              disabled={isLoading}
            >
              Remove Stat
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddNewStat}
          className="mb-6 py-2 px-4 border border-dashed border-gray-400 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add New Stat
        </button>

        <div>
          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            Save All Stat Changes
          </button>
        </div>
      </form>
    </section>
  )
}

export default PortfolioStatsEditorSection
