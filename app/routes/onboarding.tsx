import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Craftd!',
      description: "Let's create your professional portfolio in minutes",
      icon: '✨',
      color: 'text-blue-500',
    },
    {
      id: 'upload',
      title: 'Upload Your Resume',
      description: "We'll automatically extract your experience and skills",
      icon: '📄',
      color: 'text-green-500',
    },
    {
      id: 'ai-magic',
      title: 'AI Magic',
      description: 'Our AI structures your data into a beautiful portfolio',
      icon: '🪄',
      color: 'text-purple-500',
    },
    {
      id: 'customize',
      title: 'Customize & Launch',
      description: 'Review, edit, and publish your portfolio',
      icon: '🚀',
      color: 'text-orange-500',
    },
  ]

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true)
    }, 100)
  }, [])

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      navigate('/upload-resume')
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipToUpload = () => {
    navigate('/upload-resume')
  }

  const startFromScratch = () => {
    navigate('/portfolio-editor')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-lg">Craftd</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
            <button
              type="button"
              onClick={skipToUpload}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip intro
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        index === currentStep
                          ? 'bg-black text-white scale-110'
                          : index < currentStep
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {index < currentStep ? (
                        <span>✓</span>
                      ) : (
                        <span className="text-xs font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 text-center max-w-20 ${
                        index === currentStep ? 'text-black font-medium' : 'text-gray-500'
                      }`}
                    >
                      {step.title.split(' ')[0]}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-4 ${
                        index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      } transition-colors duration-300`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div
            className={`text-center transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {currentStep === 0 && (
              /* Welcome Step */
              <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">✨</span>
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Craftd!</h1>
                  <p className="text-xl text-gray-600 mb-8">
                    Let's create your professional portfolio and showcase your skills to the world.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <span className="text-2xl mb-4 block">⚡</span>
                    <h3 className="font-semibold mb-2">Quick Setup</h3>
                    <p className="text-sm text-gray-600">
                      Get your portfolio live in under 5 minutes
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <span className="text-2xl mb-4 block">🪄</span>
                    <h3 className="font-semibold mb-2">AI-Powered</h3>
                    <p className="text-sm text-gray-600">
                      Our AI extracts and structures your resume data
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <span className="text-2xl mb-4 block">👁️</span>
                    <h3 className="font-semibold mb-2">Professional</h3>
                    <p className="text-sm text-gray-600">
                      Beautiful, responsive design that impresses
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 font-medium text-lg"
                  >
                    Get Started
                  </button>
                  <button
                    type="button"
                    onClick={startFromScratch}
                    className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-lg"
                  >
                    Start from Scratch
                  </button>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              /* Upload Step */
              <div className="max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">📄</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Resume</h2>
                <p className="text-lg text-gray-600 mb-8">
                  We'll use AI to automatically extract your experience, skills, and achievements.
                </p>

                <div className="bg-white p-8 rounded-xl shadow-sm border mb-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border text-left">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">1</span>
                        </div>
                        <h4 className="font-semibold">Upload Document</h4>
                      </div>
                      <p className="text-sm text-gray-600">PDF, DOC, or DOCX files supported</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border text-left">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold text-sm">2</span>
                        </div>
                        <h4 className="font-semibold">Smart Analysis</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        AI identifies and categorizes different sections of your resume
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border text-left">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold text-sm">3</span>
                        </div>
                        <h4 className="font-semibold">Portfolio Generation</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        Creates a beautiful, structured portfolio with your data
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <h4 className="font-semibold mb-2">What we'll extract:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Personal information and contact details</li>
                    <li>• Work experience and achievements</li>
                    <li>• Skills and technologies</li>
                    <li>• Education and certifications</li>
                    <li>• Projects and portfolio items</li>
                  </ul>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              /* AI Magic Step */
              <div className="max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🪄</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Magic at Work</h2>
                <p className="text-lg text-gray-600 mb-8">
                  Our intelligent system analyzes your resume and creates a professional portfolio
                  structure.
                </p>

                <div className="bg-white p-8 rounded-xl shadow-sm border mb-6">
                  <h4 className="font-semibold mb-4">Our AI will:</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-left">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Parse your work experience</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Extract technical skills</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Identify key achievements</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Organize education details</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Structure contact information</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Create professional sections</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              /* Launch Step */
              <div className="max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🚀</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Customize & Launch</h2>
                <p className="text-lg text-gray-600 mb-8">
                  Review the generated portfolio, make any edits you'd like, and publish it to the
                  world.
                </p>

                <div className="bg-white p-8 rounded-xl shadow-sm border mb-6 text-left">
                  <h4 className="font-semibold mb-4 text-center">
                    After your portfolio is created, you can:
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Edit all content and sections</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Add custom projects and links</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Customize your unique URL</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Make it public or private</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Share with potential employers</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm">Track views and engagement</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-12">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`px-6 py-3 border border-gray-300 rounded-lg font-medium transition-colors ${
                  currentStep === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>

              <div className="flex items-center space-x-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      steps.indexOf(step) === currentStep ? 'bg-black' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
