import { useOutletContext } from 'react-router'
import type { FullPortfolio } from '../lib/portfolio.server'
import BasicInfoEditorSection from '../components/Editor/BasicInfoEditorSection'
import type { MetaFunction, ActionFunctionArgs } from 'react-router'
import { withAuthAction, createSuccessResponse, parseFormData } from '../lib/route-utils'
import { db } from '~/lib/db'
import { portfolios } from '~/lib/db/schema'
import { eq } from 'drizzle-orm'

export const meta: MetaFunction = () => {
  return [{ title: 'Basic Info - Portfolio Editor | Craftd' }]
}

// Server action to save portfolio data
export async function action(args: ActionFunctionArgs) {
  return withAuthAction(args, async ({ user }) => {
    const formData = await args.request.formData()
    // Use Drizzle inferInsert type for type safety
    type PortfolioInsert = typeof portfolios.$inferInsert
    const portfolioDataResult = parseFormData<PortfolioInsert>(formData, 'portfolioData')
    if ('success' in portfolioDataResult && !portfolioDataResult.success) {
      return portfolioDataResult
    }
    const portfolioData = portfolioDataResult as PortfolioInsert
    // Check if portfolio exists
    const existingPortfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, user.id),
      columns: { id: true },
    })
    if (existingPortfolio) {
      await db
        .update(portfolios)
        .set({
          name: portfolioData.name,
          initials: portfolioData.initials,
          jobTitle: portfolioData.jobTitle,
          title: portfolioData.title,
          bio: portfolioData.bio,
          tagline: portfolioData.tagline,
          currentLocation: portfolioData.currentLocation,
          locationTagline: portfolioData.locationTagline,
          availabilityStatus: portfolioData.availabilityStatus,
          availabilityMessage: portfolioData.availabilityMessage,
          email: portfolioData.email,
          phone: portfolioData.phone,
          theme: portfolioData.theme,
          copyright: portfolioData.copyright,
          isPublic: portfolioData.isPublic,
          isActive: portfolioData.isActive,
          updatedAt: new Date(),
        })
        .where(eq(portfolios.id, existingPortfolio.id))
    } else {
      await db.insert(portfolios).values({
        userId: user.id,
        name: portfolioData.name,
        initials: portfolioData.initials,
        jobTitle: portfolioData.jobTitle,
        title: portfolioData.title,
        bio: portfolioData.bio,
        tagline: portfolioData.tagline,
        currentLocation: portfolioData.currentLocation,
        locationTagline: portfolioData.locationTagline,
        availabilityStatus: portfolioData.availabilityStatus,
        availabilityMessage: portfolioData.availabilityMessage,
        email: portfolioData.email,
        phone: portfolioData.phone,
        theme: portfolioData.theme,
        copyright: portfolioData.copyright,
        isPublic: portfolioData.isPublic ?? false,
        isActive: portfolioData.isActive ?? true,
        slug:
          portfolioData.slug ??
          portfolioData.name
            ?.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, ''),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
    return createSuccessResponse(null, 'Portfolio saved successfully')
  })
}

export default function EditorBasic() {
  // Consume portfolio provided by parent editor layout loader via outlet context
  const portfolio = useOutletContext<FullPortfolio>()

  return (
    <div className="container mx-auto p-4">
      <BasicInfoEditorSection
        defaultValues={{
          name: portfolio.name,
          initials: portfolio.initials,
          jobTitle: portfolio.jobTitle,
          bio: portfolio.bio,
          tagline: portfolio.tagline,
          currentLocation: portfolio.currentLocation,
          locationTagline: portfolio.locationTagline,
          email: portfolio.email,
          phone: portfolio.phone,
          availabilityStatus: portfolio.availabilityStatus,
          availabilityMessage: portfolio.availabilityMessage,
        }}
        portfolioId={portfolio.id}
      />
    </div>
  )
}
