import { useEffect, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import type { SocialLinks, NewSocialLinks } from '~/lib/db/schema'

// Use schema types
interface SocialLinksFormValues extends Partial<NewSocialLinks> {}

interface SocialLinksEditorSectionProps {
  socialLinks?: SocialLinks | null
  portfolioId: string
}

const SocialLinksEditorSection: React.FC<SocialLinksEditorSectionProps> = ({
  socialLinks: initialSocialLinks,
  portfolioId,
}) => {
  const { user } = useAuth()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm<SocialLinksFormValues>({
    defaultValues: initialSocialLinks || {},
    mode: 'onChange',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  useEffect(() => {
    reset(initialSocialLinks || {})
  }, [initialSocialLinks, reset])

  const onSubmit: SubmitHandler<SocialLinksFormValues> = async (formData) => {
    if (!isDirty) {
      alert('No changes to save in social links.')
      return
    }
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)
    try {
      const fd = new FormData()
      fd.append('socialLinksData', JSON.stringify([{ ...formData, portfolioId }]))
      const res = await fetch('/editor.social', { method: 'POST', body: fd })
      const result: { success?: boolean; error?: string } = await res.json()
      if (result.success) {
        setSaveSuccess('Social links saved successfully!')
      } else {
        setSaveError(result.error || 'Failed to save social links.')
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
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Social Links</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 border border-gray-300 rounded-md space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="github" className="block text-sm font-medium text-gray-700">
                GitHub
              </label>
              <input
                id="github"
                {...register('github')}
                className="mt-1 block w-full input-class"
                placeholder="GitHub profile URL"
              />
            </div>
            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
                LinkedIn
              </label>
              <input
                id="linkedin"
                {...register('linkedin')}
                className="mt-1 block w-full input-class"
                placeholder="LinkedIn profile URL"
              />
            </div>
            <div>
              <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                Twitter
              </label>
              <input
                id="twitter"
                {...register('twitter')}
                className="mt-1 block w-full input-class"
                placeholder="Twitter profile URL"
              />
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                id="website"
                {...register('website')}
                className="mt-1 block w-full input-class"
                placeholder="Personal website URL"
              />
            </div>
          </div>
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            Save Social Links
          </button>
        </div>
      </form>
      {saveSuccess && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {saveError}
        </div>
      )}
    </section>
  )
}

export default SocialLinksEditorSection
