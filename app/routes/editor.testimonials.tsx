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
    <section className="p-6 bg-white shadow-md rounded-lg mt-8">
      <h2 className="text-2xl font-semibold mb-4">Testimonials</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-md space-y-3">
            <input {...register(`testimonials.${index}.id` as const)} type="hidden" />
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`testimonials.${index}.name`}>Reviewer's Name</label>
                <input
                  id={`testimonials.${index}.name`}
                  {...register(`testimonials.${index}.name` as const, { required: true })}
                  className="mt-1 block w-full input-class"
                />
              </div>
              <div>
                <label htmlFor={`testimonials.${index}.title`}>Reviewer's Title</label>
                <input
                  id={`testimonials.${index}.title`}
                  {...register(`testimonials.${index}.title` as const, { required: true })}
                  className="mt-1 block w-full input-class"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`testimonials.${index}.company`}>Company (Optional)</label>
                <input
                  id={`testimonials.${index}.company`}
                  {...register(`testimonials.${index}.company` as const)}
                  className="mt-1 block w-full input-class"
                />
              </div>
              <div>
                <label htmlFor={`testimonials.${index}.rating`}>Rating (1-5, Optional)</label>
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
                  className="mt-1 block w-full input-class"
                />
              </div>
            </div>
            <div>
              <label htmlFor={`testimonials.${index}.content`}>Content</label>
              <textarea
                id={`testimonials.${index}.content`}
                {...register(`testimonials.${index}.content` as const, { required: true })}
                rows={3}
                className="mt-1 block w-full input-class"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`testimonials.${index}.avatarUrl`}>Avatar URL (Optional)</label>
                <input
                  id={`testimonials.${index}.avatarUrl`}
                  type="url"
                  {...register(`testimonials.${index}.avatarUrl` as const)}
                  className="mt-1 block w-full input-class"
                />
              </div>
              <div>
                <label htmlFor={`testimonials.${index}.linkedinUrl`}>LinkedIn URL (Optional)</label>
                <input
                  id={`testimonials.${index}.linkedinUrl`}
                  type="url"
                  {...register(`testimonials.${index}.linkedinUrl` as const)}
                  className="mt-1 block w-full input-class"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveTestimonial(index, field.id)}
              disabled={isSaving}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove Testimonial
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddNewTestimonial}
          className="mb-6 py-2 px-4 border border-dashed rounded-md text-sm"
        >
          + Add New Testimonial
        </button>
        <div>
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="w-full py-2 px-4 btn-primary disabled:bg-gray-400"
          >
            Save All Testimonial Changes
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
        .btn-primary {
          background-color: #6366F1; /* indigo-600 */
          border: 1px solid transparent;
          border-radius: 0.375rem; /* rounded-md */
          color: white;
          font-size: 0.875rem; /* text-sm */
          font-weight: 500; /* font-medium */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
        }
        .btn-primary:hover {
          background-color: #4F46E5; /* indigo-700 */
        }
        .btn-primary:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          box-shadow: 0 0 0 0.2rem rgba(99,102,241,.5); /* focus:ring-indigo-500 */
        }
      `}</style>
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
