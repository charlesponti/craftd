import { useState } from 'react'
import { useNavigate, useSubmit, useLoaderData, useActionData } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { Edit, ExternalLink, Trash2, LogOut, User as UserIcon } from 'lucide-react'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import {
  withAuthLoader,
  withAuthAction,
  createErrorResponse,
  createSuccessResponse,
  tryAsync,
  withMockDataFallback,
} from '../lib/route-utils'
import { getMockPortfolioForForms } from '../lib/utils/mock-data'

// Account loader - migrated from Svelte layout server
export async function loader(args: LoaderFunctionArgs) {
  return withAuthLoader(args, async ({ user, request }) => {
    return withMockDataFallback(
      request,
      async (request) => {
        const mockData = await getMockPortfolioForForms(request)
        // Convert mock data to PortfolioSummary format
        const mockSummary = {
          id: mockData.portfolioId,
          slug: 'test-portfolio',
          title: 'Test Portfolio',
          name: mockData.personalInfoData.name,
          jobTitle: mockData.personalInfoData.jobTitle,
          bio: mockData.personalInfoData.bio,
          isPublic: true,
          isActive: true,
          updatedAt: new Date(),
        }
        return {
          user,
          portfolios: [mockSummary],
          hasPortfolio: true,
        }
      },
      async () => {
        // TODO: Regular users: fetch from database
        // const portfolios = await PortfolioRepository.getPortfolioSummaries(user.id);
        const portfolios: Portfolio[] = []
        return {
          user,
          portfolios,
          hasPortfolio: portfolios.length > 0,
        }
      }
    )
  })
}

// Server action for portfolio operations
export async function action(args: ActionFunctionArgs) {
  return withAuthAction(args, async ({ supabase }) => {
    const formData = await args.request.formData()
    const action = formData.get('action')
    const portfolioId = formData.get('portfolioId')

    if (action === 'delete' && portfolioId) {
      return tryAsync(async () => {
        const { error } = await supabase.from('portfolios').delete().eq('id', portfolioId)

        if (error) {
          return createErrorResponse(error.message)
        }

        return createSuccessResponse(null, 'Portfolio deleted successfully')
      }, 'Failed to delete portfolio')
    }

    return createErrorResponse('Invalid action')
  })
}

interface Portfolio {
  id: string
  title: string
  slug: string
  isPublic: boolean
  isActive: boolean
  updatedAt: string | Date
  name?: string
  jobTitle?: string
  bio?: string
}

export function meta() {
  return [
    { title: 'Account - Craftd' },
    { name: 'description', content: 'Manage your portfolio and account settings' },
  ]
}

export default function Account() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const submit = useSubmit()
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Use data from loader instead of client-side queries
  const { user, portfolios, hasPortfolio } = loaderData

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleDeletePortfolio = (portfolioId: string) => {
    if (confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
      const formData = new FormData()
      formData.append('action', 'delete')
      formData.append('portfolioId', portfolioId)

      submit(formData, { method: 'post' })
    }
  }

  // User should be available from loader (requireAuth ensures this)
  if (!user) {
    navigate('/login')
    return null
  }

  const portfolio = portfolios[0] // Primary portfolio
  const userDisplayName = user.supabaseUser?.user_metadata?.full_name || user.name || user.email
  const userAvatar = user.supabaseUser?.user_metadata?.avatar_url

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center -mt-4">
          <p className="mt-2 text-gray-600">Manage your portfolio and account settings</p>
        </div>

        {/* Profile Information Card */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Profile Information
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userDisplayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium">{userDisplayName}</h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>

        {/* Portfolio Management Section */}
        <div className="mb-6">
          {portfolio ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {/* Mobile: Stack everything vertically */}
                <div className="space-y-3 sm:hidden">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Portfolio</h2>
                    {portfolio.isPublic && (
                      <a
                        href={`/p/${portfolio.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-xs">View</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-medium text-gray-900">{portfolio.title}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          portfolio.isPublic
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {portfolio.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">URL:</span>
                    <span className="font-mono text-blue-600 ml-1">
                      craftd.dev/p/{portfolio.slug}
                    </span>
                  </div>
                </div>

                {/* Desktop: Horizontal layout */}
                <div className="hidden sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-semibold">Portfolio</h2>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-medium text-gray-900">{portfolio.title}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          portfolio.isPublic
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {portfolio.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>

                  {portfolio.isPublic && (
                    <a
                      href={`/p/${portfolio.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Live
                    </a>
                  )}
                </div>

                <div className="mt-4 space-y-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">URL:</span>
                    <span className="font-mono text-blue-600 ml-1">
                      craftd.dev/p/{portfolio.slug}
                    </span>
                  </div>

                  {/* Mobile: Stack buttons vertically */}
                  <div className="flex flex-col space-y-2 sm:hidden">
                    <button
                      type="button"
                      onClick={() => navigate('/editor')}
                      className="inline-flex items-center justify-center w-full px-3 py-1 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Portfolio
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePortfolio(portfolio.id)}
                      className="inline-flex items-center justify-center w-full px-3 py-1 text-sm border border-red-200 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Portfolio
                    </button>
                  </div>

                  {/* Desktop: Horizontal layout */}
                  <div className="hidden sm:flex sm:items-center sm:justify-end">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => navigate('/editor')}
                        className="inline-flex items-center px-3 py-1 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Portfolio
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePortfolio(portfolio.id)}
                        className="inline-flex items-center px-3 py-1 text-sm border border-red-200 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Last updated: {new Date(portfolio.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-8 text-center">
                <p className="text-gray-500 mb-4">No portfolio found</p>
                <p className="text-sm text-gray-400 mb-6">
                  Create your professional portfolio to showcase your skills and experience.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/onboarding')}
                  className="inline-flex items-center justify-center px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
