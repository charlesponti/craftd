import type { MetaFunction, ActionFunctionArgs } from 'react-router'
import { withAuthAction, createSuccessResponse, parseFormData } from '../lib/route-utils'
import { db } from '~/lib/db'
import { socialLinks } from '~/lib/db/schema'
import { eq, inArray, and } from 'drizzle-orm'

import { useOutletContext } from 'react-router'
import type { FullPortfolio } from '../lib/portfolio.server'
import SocialLinksEditorSection from '../components/Editor/SocialLinksEditorSection'

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
  // Consume portfolio from parent editor layout loader via outlet context
  const portfolio = useOutletContext<FullPortfolio>()

  return <SocialLinksEditorSection socialLinks={portfolio.socialLinks} portfolioId={portfolio.id} />
}
