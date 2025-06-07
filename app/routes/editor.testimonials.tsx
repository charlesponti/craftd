import type { MetaFunction, ActionFunctionArgs } from 'react-router'
import {
  withAuthAction,
  createErrorResponse,
  createSuccessResponse,
  parseFormData,
} from '../lib/route-utils'
import { db } from '~/lib/db'
import { testimonials } from '~/lib/db/schema'
import { eq, inArray, and } from 'drizzle-orm'

import { useOutletContext } from 'react-router'
import type { FullPortfolio } from '../lib/portfolio.server'
import TestimonialsEditorSection from '../components/Editor/TestimonialsEditorSection'

export const meta: MetaFunction = () => [{ title: 'Testimonials - Portfolio Editor | Craftd' }]

export async function action(args: ActionFunctionArgs) {
  return withAuthAction(args, async ({ user }) => {
    const formData = await args.request.formData()
    // Use Drizzle insert type for type safety
    type TestimonialInsert = typeof testimonials.$inferInsert
    const testimonialsDataResult = parseFormData<TestimonialInsert[]>(formData, 'testimonialsData')
    if ('success' in testimonialsDataResult && !testimonialsDataResult.success) {
      return testimonialsDataResult
    }
    const testimonialsData = testimonialsDataResult as TestimonialInsert[]
    if (!Array.isArray(testimonialsData)) {
      return createErrorResponse('Invalid testimonials data')
    }
    if (testimonialsData.length === 0) {
      return createSuccessResponse(null, 'No testimonials to save')
    }
    const portfolioId = testimonialsData[0].portfolioId
    if (!portfolioId) {
      return createErrorResponse('Missing portfolioId')
    }
    // Fetch existing testimonial IDs
    const current = await db
      .select({ id: testimonials.id })
      .from(testimonials)
      .where(eq(testimonials.portfolioId, portfolioId))
    const currentIds = current.map((t) => t.id)
    const submittedIds = testimonialsData
      .map((t) => t.id)
      .filter((id): id is string => typeof id === 'string')
    // Delete removed testimonials
    const toDelete = currentIds.filter((id) => !submittedIds.includes(id))
    if (toDelete.length > 0) {
      await db
        .delete(testimonials)
        .where(and(eq(testimonials.portfolioId, portfolioId), inArray(testimonials.id, toDelete)))
    }
    // Upsert (insert or update)
    for (const t of testimonialsData) {
      if (t.id) {
        const { id, ...updateData } = t
        await db.update(testimonials).set(updateData).where(eq(testimonials.id, id))
      } else {
        await db.insert(testimonials).values(t)
      }
    }
    return createSuccessResponse(null, 'Testimonials saved successfully')
  })
}

export default function EditorTestimonials() {
  // Consume portfolio from parent editor layout loader via outlet context
  const portfolio = useOutletContext<FullPortfolio>()

  return (
    <TestimonialsEditorSection testimonials={portfolio.testimonials} portfolioId={portfolio.id} />
  )
}
