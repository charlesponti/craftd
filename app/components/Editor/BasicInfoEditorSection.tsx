import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { NewPortfolio } from '~/lib/db/schema'

export type BasicInfoFormValues = NewPortfolio

interface BasicInfoEditorSectionProps {
  defaultValues: Partial<BasicInfoFormValues>
  portfolioId: string
}

const BasicInfoEditorSection = ({ defaultValues, portfolioId }: BasicInfoEditorSectionProps) => {
  const queryClient = useQueryClient()

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

  const mutation = useMutation({
    mutationFn: async (updatedInfo: BasicInfoFormValues) => {
      if (!portfolioId) {
        throw new Error('Portfolio ID not found.')
      }
      const fd = new FormData()
      fd.append('portfolioData', JSON.stringify({ ...updatedInfo, id: portfolioId }))
      const response = await fetch('/editor/basic', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: fd,
      })
      if (!response.ok) throw new Error('Failed to update basic info')
      const data = await response.clone().json()
      return data
    },
    onSuccess: () => {
      alert('Basic info updated successfully!')
      queryClient.invalidateQueries()
    },
    onError: (error: Error) => {
      alert(`Error updating basic info: ${error.message}`)
      console.error('Error updating basic info:', error)
    },
  })

  const onSubmit = (data: BasicInfoFormValues) => {
    if (!isDirty) {
      alert('No changes made to submit.')
      return
    }
    mutation.mutate(data)
  }

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
            disabled={mutation.isPending || !isDirty}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {mutation.isPending ? 'Saving...' : 'Save Basic Info'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default BasicInfoEditorSection
