import { and, eq, inArray } from 'drizzle-orm'
import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import type { ActionFunctionArgs, MetaFunction } from 'react-router'
import { useFetcher, useOutletContext } from 'react-router'
import { db } from '~/lib/db'
import type { NewSocialLinks, SocialLinks } from '~/lib/db/schema'
import { socialLinks } from '~/lib/db/schema'
import { useToast } from '../hooks/useToast'
import type { FullPortfolio } from '../lib/portfolio.server'
import { createSuccessResponse, parseFormData, withAuthAction } from '../lib/route-utils'

// Use schema types
interface SocialLinksFormValues extends Partial<NewSocialLinks> {}

interface SocialLinksEditorSectionProps {
  socialLinks?: SocialLinks | null
  portfolioId: string
}

function SocialLinksEditorSection({
  socialLinks: initialSocialLinks,
  portfolioId,
}: SocialLinksEditorSectionProps) {
  const fetcher = useFetcher()
  const { addToast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<SocialLinksFormValues>({
    defaultValues: initialSocialLinks || {},
    mode: 'onChange',
  })

  useEffect(() => {
    reset(initialSocialLinks || {})
  }, [initialSocialLinks, reset])

  // Handle fetcher errors and success
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const result = fetcher.data as { success: boolean; error?: string; message?: string }
      if (result.success) {
        addToast(result.message || 'Social links saved successfully!', 'success')
      } else {
        addToast(`Failed to save social links: ${result.error || 'Unknown error'}`, 'error')
      }
    }
  }, [fetcher.state, fetcher.data, addToast])

  const onSubmit: SubmitHandler<SocialLinksFormValues> = (formData) => {
    if (!isDirty) {
      addToast('No changes to save in social links.', 'info')
      return
    }

    // Clean up the data - only send essential fields
    const socialLinksToSave = {
      id: formData.id,
      github: formData.github,
      linkedin: formData.linkedin,
      twitter: formData.twitter,
      website: formData.website,
      portfolioId,
    }

    const formData2 = new FormData()
    formData2.append('socialLinksData', JSON.stringify([socialLinksToSave]))

    fetcher.submit(formData2, {
      method: 'POST',
      action: '/editor/social',
    })
  }

  const isSaving = fetcher.state === 'submitting'

  return (
    <section className="editor-section">
      <h2>Social Links</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="editor-form">
        <div className="editor-form-group">
          <div className="editor-grid-2">
            <div>
              <label htmlFor="github" className="editor-label">
                GitHub
              </label>
              <input
                id="github"
                {...register('github')}
                className="editor-input"
                placeholder="GitHub profile URL"
              />
            </div>
            <div>
              <label htmlFor="linkedin" className="editor-label">
                LinkedIn
              </label>
              <input
                id="linkedin"
                {...register('linkedin')}
                className="editor-input"
                placeholder="LinkedIn profile URL"
              />
            </div>
            <div>
              <label htmlFor="twitter" className="editor-label">
                Twitter
              </label>
              <input
                id="twitter"
                {...register('twitter')}
                className="editor-input"
                placeholder="Twitter profile URL"
              />
            </div>
            <div>
              <label htmlFor="website" className="editor-label">
                Website
              </label>
              <input
                id="website"
                {...register('website')}
                className="editor-input"
                placeholder="Personal website URL"
              />
            </div>
          </div>
        </div>
        <div>
          <button type="submit" disabled={isSaving || !isDirty} className="editor-btn-primary">
            {isSaving ? 'Saving...' : 'Save Social Links'}
          </button>
        </div>
      </form>
    </section>
  )
}

export const meta: MetaFunction = () => [{ title: 'Social Links - Portfolio Editor | Craftd' }]

type SocialLinkInsert = typeof socialLinks.$inferInsert

export async function action(args: ActionFunctionArgs) {
  return withAuthAction(args, async ({ user }) => {
    const formData = await args.request.formData()

    const socialLinksDataResult = parseFormData<SocialLinkInsert[]>(formData, 'socialLinksData')
    if ('success' in socialLinksDataResult && !socialLinksDataResult.success) {
      return socialLinksDataResult
    }
    const socialLinksData = socialLinksDataResult as SocialLinkInsert[]
    // Get all current social link IDs for this portfolio
    const current = await db
      .select({ id: socialLinks.id })
      .from(socialLinks)
      .where(eq(socialLinks.portfolioId, socialLinksData[0]?.portfolioId))
    const currentIds = current.map((l) => l.id)
    const submittedIds = socialLinksData.filter((l) => l.id).map((l) => l.id)
    // Delete removed links
    if (currentIds.length > 0) {
      const toDelete = currentIds.filter((id) => !submittedIds.includes(id))
      if (toDelete.length > 0) {
        await db
          .delete(socialLinks)
          .where(
            and(
              eq(socialLinks.portfolioId, socialLinksData[0]?.portfolioId),
              inArray(socialLinks.id, toDelete)
            )
          )
      }
    }
    // Upsert (insert or update)
    for (const link of socialLinksData) {
      if (link.id) {
        await db.update(socialLinks).set(link).where(eq(socialLinks.id, link.id))
      } else {
        await db.insert(socialLinks).values(link)
      }
    }
    return createSuccessResponse(null, 'Social links saved successfully')
  })
}

export default function EditorSocial() {
  const portfolio = useOutletContext<FullPortfolio>()

  return <SocialLinksEditorSection socialLinks={portfolio.socialLinks} portfolioId={portfolio.id} />
}
