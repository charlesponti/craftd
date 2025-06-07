import {
  BarChart3,
  Briefcase,
  Code,
  Eye,
  FolderOpen,
  Link2,
  MessageSquare,
  Save,
  User,
} from 'lucide-react'
import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { Link, Outlet, redirect, useLoaderData, useLocation } from 'react-router'
import type { FullPortfolio } from '../lib/portfolio.server'
import { getFullUserPortfolio } from '../lib/portfolio.server'
import { withAuthLoader } from '../lib/route-utils'

export const meta: MetaFunction = () => {
  return [
    { title: 'Portfolio Editor | Craftd' },
    {
      name: 'description',
      content: 'Edit and customize your professional portfolio',
    },
  ]
}

/**
 * Loader for wizard editor: ensure the user has a portfolio or redirect to onboarding
 */
export async function loader(args: LoaderFunctionArgs) {
  return withAuthLoader(args, async ({ user }) => {
    const portfolio = await getFullUserPortfolio(user.id)
    if (!portfolio) {
      throw redirect('/onboarding')
    }
    return portfolio
  })
}

const editorSteps = [
  {
    path: '/editor',
    value: 'basic',
    label: 'Basic Info',
    icon: User,
  },
  {
    path: '/editor/work',
    value: 'work',
    label: 'Work Experience',
    icon: Briefcase,
  },
  {
    path: '/editor/skills',
    value: 'skills',
    label: 'Skills',
    icon: Code,
  },
  {
    path: '/editor/social',
    value: 'social',
    label: 'Social Links',
    icon: Link2,
  },
  {
    path: '/editor/stats',
    value: 'stats',
    label: 'Portfolio Stats',
    icon: BarChart3,
  },
  {
    path: '/editor/projects',
    value: 'projects',
    label: 'Projects',
    icon: FolderOpen,
  },
  {
    path: '/editor/testimonials',
    value: 'testimonials',
    label: 'Testimonials',
    icon: MessageSquare,
  },
]

export default function EditorLayout() {
  const location = useLocation()
  const portfolio = useLoaderData<FullPortfolio>()

  const currentStepIndex = editorSteps.findIndex((step) => location.pathname.startsWith(step.path))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/account" className="text-gray-600 hover:text-gray-900">
                <span className="font-medium">← Back to Account</span>
              </Link>
              <div className="w-px h-6 bg-gray-300" />
              <h1 className="font-serif text-xl font-light text-gray-900">Portfolio Editor</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="font-medium text-gray-900 mb-6">Edit Sections</h2>

              <nav className="space-y-2">
                {editorSteps.map((step, index) => {
                  const isActive = step.value === location.pathname.split('/').pop()
                  const isCompleted = index < currentStepIndex
                  const Icon = step.icon

                  return (
                    <Link
                      key={step.path}
                      to={step.path}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 border border-blue-200 text-blue-900'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-blue-100' : isCompleted ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isActive
                              ? 'text-blue-600'
                              : isCompleted
                                ? 'text-green-600'
                                : 'text-gray-600'
                          }`}
                        />
                      </div>
                      <div>
                        <div
                          className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}
                        >
                          {step.label}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </nav>

              {/* Progress */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">
                    {Math.max(0, currentStepIndex)}/{editorSteps.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(0, (currentStepIndex / editorSteps.length) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Outlet context={portfolio} />
          </div>
        </div>
      </div>
    </div>
  )
}
