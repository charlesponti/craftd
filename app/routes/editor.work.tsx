import type { MetaFunction, ActionFunctionArgs } from 'react-router'
import { useOutletContext } from 'react-router'
import type { FullPortfolio } from '../lib/portfolio.server'
import WorkExperienceEditorSection from '../components/Editor/WorkExperienceEditorSection'
import {
  withAuthAction,
  createErrorResponse,
  createSuccessResponse,
  tryAsync,
  parseFormData,
} from '../lib/route-utils'
import { db } from '~/lib/db'
import { workExperiences } from '~/lib/db/schema'
import type { NewWorkExperience } from '~/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

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
