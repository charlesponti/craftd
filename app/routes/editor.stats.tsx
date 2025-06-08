import { and, eq, inArray } from 'drizzle-orm'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import type { ActionFunctionArgs, MetaFunction } from 'react-router'
import { useFetcher, useOutletContext } from 'react-router'
import { db } from '~/lib/db'
import type { NewPortfolioStats } from '~/lib/db/schema'
import { portfolioStats } from '~/lib/db/schema'
import { useToast } from '../hooks/useToast'
import type { FullPortfolio } from '../lib/portfolio.server'
import {
  createErrorResponse,
  createSuccessResponse,
  parseFormData,
  withAuthAction,
} from '../lib/route-utils'

// Use schema types
type PortfolioStat = NewPortfolioStats

interface PortfolioStatsFormValues {
  stats: Partial<PortfolioStat>[]
}

interface PortfolioStatsEditorSectionProps {
  stats?: PortfolioStat[] | null
  portfolioId: string
}

function PortfolioStatsEditorSection({
  stats: initialStats,
  portfolioId,
}: PortfolioStatsEditorSectionProps) {
  const fetcher = useFetcher()
  const { addToast } = useToast()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
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

  // Handle fetcher errors and success
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const result = fetcher.data as { success: boolean; error?: string; message?: string }
      if (result.success) {
        addToast(result.message || 'Portfolio stats saved successfully!', 'success')
      } else {
        addToast(`Failed to save portfolio stats: ${result.error || 'Unknown error'}`, 'error')
      }
    }
  }, [fetcher.state, fetcher.data, addToast])

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

  const onSubmit = (formData: PortfolioStatsFormValues) => {
    if (!isDirty) {
      addToast('No changes to save in portfolio stats.', 'info')
      return
    }

    // Clean up the data - only send essential fields
    const statsToSave = formData.stats.map((s) => ({
      id: s.id,
      label: s.label,
      value: s.value,
      portfolioId,
    }))

    const formData2 = new FormData()
    formData2.append('statsData', JSON.stringify(statsToSave))

    fetcher.submit(formData2, {
      method: 'POST',
      action: '/editor/stats',
    })
  }

  const isSaving = fetcher.state === 'submitting'

  return (
    <section className="editor-section">
      <h2>Portfolio Stats</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="editor-form">
        {fields.map((field, index) => (
          <div key={field.id} className="editor-form-group">
            <div className="editor-grid-2">
              <div>
                <label htmlFor={`stats.${index}.label`} className="editor-label">
                  Label
                </label>
                <input
                  id={`stats.${index}.label`}
                  {...register(`stats.${index}.label` as const, { required: 'Label is required' })}
                  className="editor-input"
                  placeholder="e.g., Projects Completed"
                />
              </div>
              <div>
                <label htmlFor={`stats.${index}.value`} className="editor-label">
                  Value
                </label>
                <input
                  id={`stats.${index}.value`}
                  {...register(`stats.${index}.value` as const, { required: 'Value is required' })}
                  className="editor-input"
                  placeholder="e.g., 50+"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveStat(index, fields[index].id)}
              className="editor-remove-btn"
              disabled={isSaving}
            >
              Remove Stat
            </button>
          </div>
        ))}

        <button type="button" onClick={handleAddNewStat} className="editor-add-btn">
          + Add New Stat
        </button>

        <div>
          <button type="submit" disabled={isSaving || !isDirty} className="editor-btn-primary">
            Save All Stat Changes
          </button>
        </div>
      </form>
    </section>
  )
}

export const meta: MetaFunction = () => [{ title: 'Portfolio Stats - Portfolio Editor | Craftd' }]

export async function action(args: ActionFunctionArgs) {
  return withAuthAction(args, async ({ user }) => {
    const formData = await args.request.formData()
    // Use Drizzle-generated insert type for safety
    type StatInsert = typeof portfolioStats.$inferInsert
    const statsDataResult = parseFormData<StatInsert[]>(formData, 'statsData')
    if ('success' in statsDataResult && !statsDataResult.success) {
      return statsDataResult
    }
    const statsData = statsDataResult as StatInsert[]
    if (!Array.isArray(statsData)) {
      return createErrorResponse('Invalid stats data')
    }
    if (statsData.length === 0) {
      // Nothing to do
      return createSuccessResponse(null, 'No stats to save')
    }
    // Ensure portfolioId exists
    const portfolioId = statsData[0]?.portfolioId
    if (!portfolioId) return createErrorResponse('Missing portfolioId')
    // Fetch existing stat IDs
    const current = await db
      .select({ id: portfolioStats.id })
      .from(portfolioStats)
      .where(eq(portfolioStats.portfolioId, portfolioId))
    const currentIds = current.map((s) => s.id)
    const submittedIds = statsData.filter((s) => s.id).map((s) => s.id)
    // Delete removed stats
    const toDelete = currentIds.filter((id) => !submittedIds.includes(id))
    if (toDelete.length > 0) {
      await db
        .delete(portfolioStats)
        .where(
          and(eq(portfolioStats.portfolioId, portfolioId), inArray(portfolioStats.id, toDelete))
        )
    }
    // Upsert (insert or update)
    for (const stat of statsData) {
      if (stat.id) {
        const { id, ...updateData } = stat
        await db.update(portfolioStats).set(updateData).where(eq(portfolioStats.id, id))
      } else {
        await db.insert(portfolioStats).values(stat)
      }
    }
    return createSuccessResponse(null, 'Portfolio stats saved successfully')
  })
}

export default function EditorStats() {
  // Consume portfolio from parent editor layout loader via outlet context
  const portfolio = useOutletContext<FullPortfolio>()

  return <PortfolioStatsEditorSection stats={portfolio.portfolioStats} portfolioId={portfolio.id} />
}
