import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { Link } from 'react-router'
import { ResumeCustomizer } from '~/components/ResumeCustomizer'
import { withAuthLoader } from '~/lib/route-utils'

export const meta: MetaFunction = () => {
  return [
    { title: 'AI Resume Customizer | Craftd' },
    {
      name: 'description',
      content:
        'Use AI to customize your resume for specific job postings based on your portfolio data',
    },
  ]
}

export async function loader(args: LoaderFunctionArgs) {
  return withAuthLoader(args, async ({ user }) => {
    return { user }
  })
}

export default function ResumeCustomizerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-start justify-start gap-4 mb-6">
            <Link
              to="/job-applications"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 bg-white border border-gray-300 hover:bg-gray-50 h-9 px-4 py-2"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Applications
            </Link>
            <div className="flex flex-col items-start justify-start">
              <h1 className="text-xl font-bold text-gray-900">AI Resume Customizer</h1>
              <p className="text-md text-gray-600 max-w-2xl mx-auto">
                Leverage AI to create tailored resumes that perfectly match job postings using your
                portfolio data
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">How it works:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center md:flex-col md:text-center gap-3 md:gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">Paste Job Posting</h3>
                <p className="text-xs text-gray-600">Copy and paste the job posting content</p>
              </div>
            </div>
            <div className="flex items-center md:flex-col md:text-center gap-3 md:gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">AI Analysis</h3>
                <p className="text-xs text-gray-600">AI analyzes and matches with your portfolio</p>
              </div>
            </div>
            <div className="flex items-center md:flex-col md:text-center gap-3 md:gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">Customized Resume</h3>
                <p className="text-xs text-gray-600">
                  Get a tailored resume with relevant experience
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Customizer Component */}
        <ResumeCustomizer />
      </div>
    </div>
  )
}
