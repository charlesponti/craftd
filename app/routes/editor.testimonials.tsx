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
    <section className="editor-section">
      <h2>Testimonials</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="editor-form">
        {fields.map((field, index) => (
          <div key={field.id} className="editor-form-group">
            <input {...register(`testimonials.${index}.id` as const)} type="hidden" />
            <div className="editor-grid-2">
              <div>
                <label htmlFor={`testimonials.${index}.name`} className="editor-label">
                  Reviewer's Name
                </label>
                <input
                  id={`testimonials.${index}.name`}
                  {...register(`testimonials.${index}.name` as const, { required: true })}
                  className="editor-input"
                />
              </div>
              <div>
                <label htmlFor={`testimonials.${index}.title`} className="editor-label">
                  Reviewer's Title
                </label>
                <input
                  id={`testimonials.${index}.title`}
                  {...register(`testimonials.${index}.title` as const, { required: true })}
                  className="editor-input"
                />
              </div>
            </div>
            <div className="editor-grid-2">
              <div>
                <label htmlFor={`testimonials.${index}.company`} className="editor-label">
                  Company (Optional)
                </label>
                <input
                  id={`testimonials.${index}.company`}
                  {...register(`testimonials.${index}.company` as const)}
                  className="editor-input"
                />
              </div>
              <div>
                <label htmlFor={`testimonials.${index}.rating`} className="editor-label">
                  Rating (1-5, Optional)
                </label>
                <input
                  id={`testimonials.${index}.rating`}
                  type="number"
                  min="1"
                  max="5"
                  {...register(`testimonials.${index}.rating` as const, {
                    valueAsNumber: true,
                    min: 1,
                    max: 5,
                  })}
                  className="editor-input"
                />
              </div>
            </div>
            <div>
              <label htmlFor={`testimonials.${index}.content`} className="editor-label">
                Content
              </label>
              <textarea
                id={`testimonials.${index}.content`}
                {...register(`testimonials.${index}.content` as const, { required: true })}
                rows={3}
                className="editor-textarea"
              />
            </div>
            <div className="editor-grid-2">
              <div>
                <label htmlFor={`testimonials.${index}.avatarUrl`} className="editor-label">
                  Avatar URL (Optional)
                </label>
                <input
                  id={`testimonials.${index}.avatarUrl`}
                  type="url"
                  {...register(`testimonials.${index}.avatarUrl` as const)}
                  className="editor-input"
                />
              </div>
              <div>
                <label htmlFor={`testimonials.${index}.linkedinUrl`} className="editor-label">
                  LinkedIn URL (Optional)
                </label>
                <input
                  id={`testimonials.${index}.linkedinUrl`}
                  type="url"
                  {...register(`testimonials.${index}.linkedinUrl` as const)}
                  className="editor-input"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveTestimonial(index, field.id)}
              disabled={isSaving}
              className="editor-remove-btn"
            >
              Remove Testimonial
            </button>
          </div>
        ))}
        <button type="button" onClick={handleAddNewTestimonial} className="editor-add-btn">
          + Add New Testimonial
        </button>
        <div>
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="editor-btn-primary disabled:bg-gray-400"
          >
            Save All Testimonial Changes
          </button>
        </div>
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
