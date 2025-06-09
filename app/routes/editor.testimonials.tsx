import { and, eq, inArray } from 'drizzle-orm'
import type { ActionFunctionArgs, MetaFunction } from 'react-router'
import { db } from '~/lib/db'
import { testimonials } from '~/lib/db/schema'
import { useToast } from '../hooks/useToast'
import {
  createErrorResponse,
  createSuccessResponse,
  parseFormData,
  withAuthAction,
} from '../lib/route-utils'

import { useEffect } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { useFieldArray, useForm } from 'react-hook-form'
import { useFetcher, useOutletContext } from 'react-router'
import type { NewTestimonial, Testimonial } from '~/lib/db/schema'
import type { FullPortfolio } from '../lib/portfolio.server'

interface TestimonialsFormValues {
  testimonials: Partial<NewTestimonial>[]
}

interface TestimonialsEditorSectionProps {
  testimonials?: Testimonial[] | null
  portfolioId: string
}

function TestimonialsEditorSection({
  testimonials: initialTestimonials,
  portfolioId,
}: TestimonialsEditorSectionProps) {
  const fetcher = useFetcher()
  const { addToast } = useToast()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<TestimonialsFormValues>({
    defaultValues: {
      testimonials: initialTestimonials || [],
    },
    mode: 'onChange',
  })

  useEffect(() => {
    reset({ testimonials: initialTestimonials || [] })
  }, [initialTestimonials, reset])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'testimonials',
  })

  // Handle fetcher errors and success
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const result = fetcher.data as { success: boolean; error?: string; message?: string }
      if (result.success) {
        addToast(result.message || 'Testimonials saved successfully!', 'success')
      } else {
        addToast(`Failed to save testimonials: ${result.error || 'Unknown error'}`, 'error')
      }
    }
  }, [fetcher.state, fetcher.data, addToast])

  const handleAddNewTestimonial = () => append({ name: '', title: '', content: '' })

  const handleRemoveTestimonial = (index: number, testimonialId?: string) => {
    if (testimonialId) {
      if (confirm('Delete this testimonial permanently?')) remove(index)
    } else remove(index)
  }

  const onSubmit: SubmitHandler<TestimonialsFormValues> = (formData) => {
    if (!isDirty) {
      addToast('No testimonial changes to save.', 'info')
      return
    }

    // Clean up the data - only send essential fields
    const testimonialsToSave = formData.testimonials.map((t) => ({
      id: t.id,
      name: t.name,
      title: t.title,
      content: t.content,
      company: t.company,
      rating: t.rating,
      avatarUrl: t.avatarUrl,
      linkedinUrl: t.linkedinUrl,
      portfolioId,
    }))

    const formData2 = new FormData()
    formData2.append('testimonialsData', JSON.stringify(testimonialsToSave))

    fetcher.submit(formData2, {
      method: 'POST',
      action: '/editor/testimonials',
    })
  }

  const isSaving = fetcher.state === 'submitting'

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-2xl">
        <h2 className="text-2xl font-semibold text-foreground">Client Testimonials</h2>
        <div className="flex gap-sm">
          <button
            type="button"
            onClick={handleAddNewTestimonial}
            className="btn btn-outline btn-sm"
          >
            Add New Testimonial
          </button>
          <button
            type="submit"
            form="testimonials-form"
            disabled={isSaving || !isDirty}
            className="btn btn-primary btn-sm"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      <form id="testimonials-form" onSubmit={handleSubmit(onSubmit)} className="space-y-lg">
        {fields.map((field, index) => (
          <div key={field.id} className="card-sm bg-muted/50 space-y-lg">
            <div className="grid-2">
              <div className="form-group">
                <label htmlFor={`testimonials.${index}.name`} className="label">
                  Name
                </label>
                <input
                  id={`testimonials.${index}.name`}
                  type="text"
                  className="input"
                  {...register(`testimonials.${index}.name` as const)}
                />
              </div>
              <div className="form-group">
                <label htmlFor={`testimonials.${index}.title`} className="label">
                  Title
                </label>
                <input
                  id={`testimonials.${index}.title`}
                  type="text"
                  className="input"
                  {...register(`testimonials.${index}.title` as const)}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label htmlFor={`testimonials.${index}.company`} className="label">
                  Company
                </label>
                <input
                  id={`testimonials.${index}.company`}
                  type="text"
                  className="input"
                  {...register(`testimonials.${index}.company` as const)}
                />
              </div>
              <div className="form-group">
                <label htmlFor={`testimonials.${index}.rating`} className="label">
                  Rating (1-5)
                </label>
                <select
                  id={`testimonials.${index}.rating`}
                  className="select"
                  {...register(`testimonials.${index}.rating` as const)}
                >
                  <option value="">Select rating</option>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor={`testimonials.${index}.content`} className="label">
                Testimonial
              </label>
              <textarea
                id={`testimonials.${index}.content`}
                rows={4}
                className="textarea"
                {...register(`testimonials.${index}.content` as const)}
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label htmlFor={`testimonials.${index}.avatarUrl`} className="label">
                  Avatar URL (optional)
                </label>
                <input
                  id={`testimonials.${index}.avatarUrl`}
                  type="url"
                  className="input"
                  {...register(`testimonials.${index}.avatarUrl` as const)}
                />
              </div>
              <div className="form-group">
                <label htmlFor={`testimonials.${index}.linkedinUrl`} className="label">
                  LinkedIn URL (optional)
                </label>
                <input
                  id={`testimonials.${index}.linkedinUrl`}
                  type="url"
                  className="input"
                  {...register(`testimonials.${index}.linkedinUrl` as const)}
                />
              </div>
            </div>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="btn btn-destructive btn-sm"
              >
                Remove Testimonial
              </button>
            )}
          </div>
        ))}
      </form>
    </section>
  )
}

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
