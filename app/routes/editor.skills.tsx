import { useOutletContext } from 'react-router'
import type { FullPortfolio } from '../lib/portfolio.server'
import SkillsEditorSection from '../components/Editor/SkillsEditorSection'
import type { MetaFunction, ActionFunctionArgs } from 'react-router'
import {
  withAuthAction,
  createErrorResponse,
  createSuccessResponse,
  tryAsync,
  parseFormData,
} from '../lib/route-utils'
import { db } from '~/lib/db'
import { skills } from '~/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export const meta: MetaFunction = () => {
  return [{ title: 'Skills - Portfolio Editor | Craftd' }]
}

export default function EditorSkills() {
  // Use portfolio from parent editor layout via outlet context
  const portfolio = useOutletContext<FullPortfolio>()

  return (
    <div className="container mx-auto p-4">
      <SkillsEditorSection skills={portfolio.skills} portfolioId={portfolio.id} />
    </div>
  )
}

export async function action(args: ActionFunctionArgs) {
  return withAuthAction(args, async ({ user }) => {
    const formData = await args.request.formData()
    type SkillInsert = typeof skills.$inferInsert
    const skillsDataResult = parseFormData<SkillInsert[]>(formData, 'skillsData')
    if ('success' in skillsDataResult && !skillsDataResult.success) {
      return skillsDataResult
    }
    let skillsData = skillsDataResult as SkillInsert[]
    if (!Array.isArray(skillsData)) {
      return createErrorResponse('Invalid skills data')
    }
    // Ensure all skills have portfolioId and level is a number
    const portfolioId = skillsData[0]?.portfolioId
    if (!portfolioId) return createErrorResponse('Missing portfolioId')
    skillsData = skillsData.map((s) => ({ ...s, portfolioId, level: Number(s.level) }))
    return tryAsync(async () => {
      // Fetch existing skills for this portfolio
      const existingSkills = await db
        .select({ id: skills.id })
        .from(skills)
        .where(eq(skills.portfolioId, portfolioId))
      const existingIds = (existingSkills || []).map((s) => s.id)
      const submittedIds = skillsData.filter((s) => s.id).map((s) => s.id)
      // Delete removed skills
      const idsToDelete = existingIds.filter((id: string) => !submittedIds.includes(id))
      if (idsToDelete.length > 0) {
        await db
          .delete(skills)
          .where(and(eq(skills.portfolioId, portfolioId), inArray(skills.id, idsToDelete)))
      }
      // Upsert (insert/update) all submitted skills
      for (const skill of skillsData) {
        if (skill.id) {
          // Update
          const { id, ...updateData } = skill
          await db
            .update(skills)
            .set(updateData)
            .where(and(eq(skills.id, id), eq(skills.portfolioId, portfolioId)))
        } else {
          // Insert
          await db.insert(skills).values({ ...skill, portfolioId })
        }
      }
      return createSuccessResponse(null, 'Skills saved successfully')
    }, 'Failed to save skills')
  })
}
