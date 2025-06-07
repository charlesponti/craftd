import { eq } from 'drizzle-orm'
import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import type { ActionFunctionArgs, MetaFunction } from 'react-router'
import { useFetcher, useOutletContext } from 'react-router'
import { db } from '~/lib/db'
import type { NewPortfolio } from '~/lib/db/schema'
import { portfolios } from '~/lib/db/schema'
import { useToast } from '../hooks/useToast'
import type { FullPortfolio } from '../lib/portfolio.server'
import { createSuccessResponse, parseFormData, withAuthAction } from '../lib/route-utils'

export type BasicInfoFormValues = NewPortfolio

interface BasicInfoEditorSectionProps {
  defaultValues: Partial<BasicInfoFormValues>
  portfolioId: string
}

function BasicInfoEditorSection({ defaultValues, portfolioId }: BasicInfoEditorSectionProps) {
  const fetcher = useFetcher()
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<BasicInfoFormValues>({
    defaultValues: {
      name: defaultValues.name || '',
      initials: defaultValues.initials || '',
      jobTitle: defaultValues.jobTitle || '',
      bio: defaultValues.bio || '',
      tagline: defaultValues.tagline || '',
      currentLocation: defaultValues.currentLocation || '',
      locationTagline: defaultValues.locationTagline || '',
      email: defaultValues.email || '',
      phone: defaultValues.phone || '',
      availabilityStatus: defaultValues.availabilityStatus || false,
      availabilityMessage: defaultValues.availabilityMessage || '',
      // Add more fields as needed from the schema
    },
  })

  useEffect(() => {
    reset({
      name: defaultValues.name || '',
      initials: defaultValues.initials || '',
      jobTitle: defaultValues.jobTitle || '',
      bio: defaultValues.bio || '',
      tagline: defaultValues.tagline || '',
      currentLocation: defaultValues.currentLocation || '',
      locationTagline: defaultValues.locationTagline || '',
      email: defaultValues.email || '',
      phone: defaultValues.phone || '',
      availabilityStatus: defaultValues.availabilityStatus || false,
      availabilityMessage: defaultValues.availabilityMessage || '',
    })
  }, [defaultValues, reset])

  // Handle fetcher errors and success
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const result = fetcher.data as { success: boolean; error?: string; message?: string }
      if (result.success) {
        addToast(result.message || 'Basic info updated successfully!', 'success')
      } else {
        addToast(`Failed to update basic info: ${result.error || 'Unknown error'}`, 'error')
      }
    }
  }, [fetcher.state, fetcher.data, addToast])

  const onSubmit: SubmitHandler<BasicInfoFormValues> = (formData) => {
    if (!isDirty) {
      addToast('No changes made to submit.', 'info')
      return
    }

    // Clean up the data - only send essential fields
    const portfolioToSave = {
      id: portfolioId,
      name: formData.name,
      initials: formData.initials,
      jobTitle: formData.jobTitle,
      bio: formData.bio,
      tagline: formData.tagline,
      currentLocation: formData.currentLocation,
      locationTagline: formData.locationTagline,
      email: formData.email,
      phone: formData.phone,
      availabilityStatus: formData.availabilityStatus,
      availabilityMessage: formData.availabilityMessage,
    }

    const formData2 = new FormData()
    formData2.append('portfolioData', JSON.stringify(portfolioToSave))

    fetcher.submit(formData2, {
      method: 'POST',
      action: '/editor/basic',
    })
  }

  const isSaving = fetcher.state === 'submitting'

  return (
    <section className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Basic Information</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="name"
            {...register('name', { required: 'Name is required' })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="initials" className="block text-sm font-medium text-gray-700">
            Initials (Optional)
          </label>
          <input
            id="initials"
            {...register('initials')}
            maxLength={10}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
            Job Title / Professional Title
          </label>
          <input
            id="jobTitle"
            {...register('jobTitle', { required: 'Job title is required' })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.jobTitle && (
            <p className="mt-1 text-xs text-red-500">{errors.jobTitle.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="tagline" className="block text-sm font-medium text-gray-700">
            Tagline (Short, catchy phrase)
          </label>
          <input
            id="tagline"
            {...register('tagline', { required: 'Tagline is required' })}
            maxLength={500}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.tagline && <p className="mt-1 text-xs text-red-500">{errors.tagline.message}</p>}
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Bio / Description
          </label>
          <textarea
            id="bio"
            {...register('bio', { required: 'Bio is required' })}
            rows={5}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.bio && <p className="mt-1 text-xs text-red-500">{errors.bio.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Contact Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' },
            })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="currentLocation" className="block text-sm font-medium text-gray-700">
            Current Location (e.g., City, Country)
          </label>
          <input
            id="currentLocation"
            {...register('currentLocation', { required: 'Location is required' })}
            maxLength={255}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.currentLocation && (
            <p className="mt-1 text-xs text-red-500">{errors.currentLocation.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="locationTagline" className="block text-sm font-medium text-gray-700">
            Location Tagline (Optional)
          </label>
          <input
            id="locationTagline"
            {...register('locationTagline')}
            maxLength={255}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone (Optional)
          </label>
          <input
            id="phone"
            {...register('phone')}
            maxLength={50}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="availabilityStatus" className="block text-sm font-medium text-gray-700">
            Available for new opportunities?
          </label>
          <input
            id="availabilityStatus"
            type="checkbox"
            {...register('availabilityStatus')}
            className="mr-2"
          />
        </div>
        <div>
          <label htmlFor="availabilityMessage" className="block text-sm font-medium text-gray-700">
            Availability Message (Optional)
          </label>
          <input
            id="availabilityMessage"
            {...register('availabilityMessage')}
            maxLength={500}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isSaving ? 'Saving...' : 'Save Basic Info'}
          </button>
        </div>
      </form>
    </section>
  )
}

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
    <div className="container mx-auto">
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
