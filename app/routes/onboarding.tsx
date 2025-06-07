import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { AIProcessingAnimation } from '../components/AIProcessingAnimation'
import { UploadResumeForm } from '../components/UploadResumeForm'
import type { ConvertedResumeData } from '../types/resume'

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [conversion, setConversion] = useState<ConvertedResumeData | null>(null)
  const navigate = useNavigate()

  const steps = [
    { id: 'upload', title: 'Upload Resume', icon: '📄' },
    { id: 'processing', title: 'Processing', icon: '⏳' },
    { id: 'overview', title: 'Overview', icon: '👁️' },
    { id: 'personal', title: 'Personal', icon: '👤' },
    { id: 'experience', title: 'Experience', icon: '💼' },
    { id: 'skills', title: 'Skills', icon: '🛠️' },
    { id: 'finalize', title: 'Launch', icon: '🚀' },
  ]

  const handleUploadStart = () => setCurrentStep(1)
  const handleUploadComplete = (data: ConvertedResumeData) => {
    // Data is always saved for authenticated users, so redirect directly to completion
    navigate('/onboarding/complete?completed=true')
  }
  const handleUploadError = (error: string) => {
    // Reset to upload step so user can try again
    setCurrentStep(0)
  }

  // Redirect to review page after showing success animation
  useEffect(() => {
    if (currentStep === 2 && conversion) {
      const timer = setTimeout(() => {
        navigate('/onboarding/review?new=true', { state: { conversion } })
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [currentStep, conversion, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* Progress */}
      <div className="flex space-x-2 mb-6">
        {steps.map((s, i) => (
          <span key={s.id} className={i === currentStep ? 'text-black' : 'text-gray-400'}>
            {s.icon}
          </span>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 0 && (
        <UploadResumeForm
          onUploadStart={handleUploadStart}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      )}

      {currentStep === 1 && <AIProcessingAnimation />}

      {currentStep === 2 && conversion && (
        <div className="flex flex-col items-center space-y-4">
          <CheckCircle2 className="text-green-500 w-16 h-16 animate-bounce" />
          <p className="text-lg text-gray-700">Done! Redirecting to review...</p>
        </div>
      )}
    </div>
  )
}
