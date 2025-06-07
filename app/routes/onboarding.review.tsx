import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  CheckCircle2,
  Edit3,
  Eye,
  ExternalLink,
  User,
  Briefcase,
  Code,
  FolderOpen,
  BarChart3,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import type { MetaFunction } from 'react-router'

export const meta: MetaFunction = () => {
  return [
    { title: 'Review Your Portfolio | Craftd' },
    {
      name: 'description',
      content: 'Review and finalize your portfolio before going live',
    },
  ]
}

const reviewSteps = [
  {
    id: 'overview',
    title: 'Review Your Portfolio',
    description: "Let's review what we extracted from your resume",
  },
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Check your contact details and summary',
  },
  {
    id: 'experience',
    title: 'Work Experience',
    description: 'Review your professional experience',
  },
  {
    id: 'skills',
    title: 'Skills & Technologies',
    description: 'Verify your skill set',
  },
  {
    id: 'finalize',
    title: 'Ready to Launch',
    description: 'Your portfolio is ready to go live',
  },
]

// Mock portfolio data - this would come from the API
const mockPortfolio = {
  personalInfo: {
    name: 'Sarah Chen',
    title: 'Senior Product Designer',
    email: 'sarah.chen@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    summary:
      'I design digital experiences that bridge the gap between user needs and business objectives, with a focus on accessibility and sustainable design practices.',
  },
  workExperience: [
    {
      company: 'Stripe',
      position: 'Senior Product Designer',
      startDate: '2022-01-01',
      endDate: null,
      description:
        "Leading design for Stripe's next-generation payment processing platform, focusing on developer experience and enterprise merchant tools.",
    },
    {
      company: 'Figma',
      position: 'Product Designer',
      startDate: '2020-03-01',
      endDate: '2021-12-31',
      description:
        "Designed collaboration features for Figma's web platform, including real-time commenting, version history, and team libraries.",
    },
  ],
  skills: [
    'Product Design',
    'UX Research',
    'Design Systems',
    'Prototyping',
    'Figma',
    'Sketch',
    'JavaScript',
    'React',
  ],
  projects: [
    {
      title: 'Stripe Dashboard Redesign',
      description: 'Complete redesign of the merchant dashboard with focus on data visualization.',
      technologies: ['Product Design', 'Data Visualization'],
    },
  ],
}

export default function OnboardingReview() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [portfolio] = useState(mockPortfolio)
  const [isNewPortfolio] = useState(searchParams.get('new') === 'true')

  useEffect(() => {
    if (isNewPortfolio) {
      setShowCelebration(true)
      const timer = setTimeout(() => setShowCelebration(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isNewPortfolio])

  const nextStep = () => {
    if (currentStep < reviewSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const finishReview = () => {
    navigate('/onboarding/complete?completed=true')
  }

  const editSection = (section: string) => {
    navigate(`/portfolio-editor?section=${section}`)
  }

  const previewPortfolio = () => {
    window.open('/demo', '_blank')
  }

  const currentStepData = reviewSteps[currentStep]

  return (
    <>
      {/* Celebration for new portfolio */}
      {showCelebration && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Portfolio Created!</h4>
                <p className="text-green-700 text-sm">Let's review before going live</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-light text-gray-900 mb-4">
              Review Your Portfolio
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {isNewPortfolio
                ? "Great! We've extracted information from your resume. Let's review everything before your portfolio goes live."
                : 'Review your portfolio content and make any necessary adjustments before publishing.'}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              {reviewSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center ${index < reviewSteps.length - 1 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index < currentStep ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                  </div>
                  {index < reviewSteps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 ${
                        index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className="font-medium text-gray-900">{currentStepData.title}</h2>
              <p className="text-sm text-gray-600">{currentStepData.description}</p>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            {currentStep === 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-6">Portfolio Overview</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Personal Information</span>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Work Experience</span>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Code className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Skills & Technologies</span>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Projects</span>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">SEO Optimization</span>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-gray-900">Personal Information</h3>
                  <button
                    type="button"
                    onClick={() => editSection('personal')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Name</span>
                    <p className="text-gray-900">{portfolio.personalInfo.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Title</span>
                    <p className="text-gray-900">{portfolio.personalInfo.title}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Email</span>
                    <p className="text-gray-900">{portfolio.personalInfo.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Summary</span>
                    <p className="text-gray-900">{portfolio.personalInfo.summary}</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-gray-900">Work Experience</h3>
                  <button
                    type="button"
                    onClick={() => editSection('experience')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                </div>
                <div className="space-y-6">
                  {portfolio.workExperience.map((job) => (
                    <div
                      key={`${job.company}-${job.position}`}
                      className="border-l-2 border-gray-200 pl-4"
                    >
                      <h4 className="font-medium text-gray-900">{job.position}</h4>
                      <p className="text-gray-700">{job.company}</p>
                      <p className="text-sm text-gray-600 mb-2">
                        {new Date(job.startDate).getFullYear()} -{' '}
                        {job.endDate ? new Date(job.endDate).getFullYear() : 'Present'}
                      </p>
                      <p className="text-gray-700">{job.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-gray-900">Skills & Technologies</h3>
                  <button
                    type="button"
                    onClick={() => editSection('skills')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {portfolio.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-4">Your Portfolio is Ready!</h3>
                <p className="text-gray-600 mb-8">
                  Everything looks great! Your portfolio is ready to go live and make a great
                  impression on potential employers and clients.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    type="button"
                    onClick={previewPortfolio}
                    className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Preview Portfolio
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {currentStep === reviewSteps.length - 1 ? (
              <button
                type="button"
                onClick={finishReview}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Launch Portfolio
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
