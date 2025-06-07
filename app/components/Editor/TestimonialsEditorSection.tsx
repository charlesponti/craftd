import { useEffect, useState } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { useForm, useFieldArray } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import type { Testimonial, NewTestimonial } from '~/lib/db/schema'

interface TestimonialsFormValues {
  testimonials: Partial<NewTestimonial>[]
}

interface TestimonialsEditorSectionProps {
  testimonials?: Testimonial[] | null
  portfolioId: string
}

const TestimonialsEditorSection: React.FC<TestimonialsEditorSectionProps> = ({
  testimonials: initialTestimonials,
  portfolioId,
}) => {
  const { user } = useAuth()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields },
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

  const handleAddNewTestimonial = () => append({ name: '', title: '', content: '' })

  const handleRemoveTestimonial = (index: number, testimonialId?: string) => {
    if (testimonialId) {
      if (confirm('Delete this testimonial permanently?')) remove(index)
    } else remove(index)
  }

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const onSubmit: SubmitHandler<TestimonialsFormValues> = async (formData) => {
    if (!isDirty) {
      alert('No testimonial changes to save.')
      return
    }
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)
    try {
      const testimonialsToSave = formData.testimonials.map((t) => ({
        ...t,
        portfolioId,
        avatarUrl: t.avatarUrl,
        linkedinUrl: t.linkedinUrl,
      }))
      const fd = new FormData()
      fd.append('testimonialsData', JSON.stringify(testimonialsToSave))
      const res = await fetch('/editor.testimonials', { method: 'POST', body: fd })
      const result: { success?: boolean; error?: string } = await res.json()
      if (result.success) {
        setSaveSuccess('Testimonials saved successfully!')
      } else {
        setSaveError(result.error || 'Failed to save testimonials.')
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
              disabled={isLoading}
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
            disabled={isLoading || !isDirty}
            className="w-full py-2 px-4 btn-primary disabled:bg-gray-400"
          >
            Save All Testimonial Changes
          </button>
        </div>
      </form>
      {saveSuccess && <p className="text-green-500 mt-4">{saveSuccess}</p>}
      {saveError && <p className="text-red-500 mt-4">{saveError}</p>}
    </section>
  )
}

export default TestimonialsEditorSection
