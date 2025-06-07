import type { MetaFunction, ActionFunctionArgs } from 'react-router'
import {
  withAuthAction,
  createErrorResponse,
  createSuccessResponse,
  parseFormData,
} from '../lib/route-utils'
import { db } from '~/lib/db'
import { portfolioStats } from '~/lib/db/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { useOutletContext } from 'react-router'
import type { FullPortfolio } from '../lib/portfolio.server'
import PortfolioStatsEditorSection from '../components/Editor/PortfolioStatsEditorSection'

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
