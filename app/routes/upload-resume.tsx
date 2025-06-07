import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSubmit, useActionData } from 'react-router'
import { Upload, FileText, AlertCircle, CheckCircle2, User } from 'lucide-react'
import type { MetaFunction, ActionFunctionArgs } from 'react-router'
import { useAuth } from '../hooks/useAuth'

export const meta: MetaFunction = () => {
  return [
    { title: 'Upload Resume | Craftd' },
    {
      name: 'description',
      content: 'Upload your resume to get started with Craftd',
    },
  ]
}

// Server action for resume upload
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  if (file.type !== 'application/pdf') {
    return { success: false, error: 'Only PDF files are supported' }
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'File size must be less than 10MB' }
  }

  try {
    // Parse the resume (mock implementation)
    const { parseResume } = await import('../lib/resumeParser')
    const parsedData = await parseResume(file)

    // In a real app, you would:
    // 1. Get the user ID from session
    // 2. Save the parsed data to the database
    // 3. Create a portfolio from the parsed data

    return {
      success: true,
      message: 'Resume processed successfully! Redirecting to portfolio review...',
      data: parsedData,
    }
  } catch (error) {
    return { success: false, error: 'Failed to process resume' }
  }
}

export default function UploadResume() {
  const navigate = useNavigate()
  const submit = useSubmit()
  const actionData = useActionData()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<FileList | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)

    const droppedFiles = event.dataTransfer?.files
    if (droppedFiles && droppedFiles.length > 0) {
      setFiles(droppedFiles)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files)
  }

  const uploadResume = async () => {
    if (!files || files.length === 0) {
      alert('Please select a PDF file')
      return
    }

    const file = files[0]

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev < 90) {
          return prev + Math.random() * 10
        }
        return prev
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append('file', file)

      submit(formData, { method: 'post' })

      clearInterval(progressInterval)
      setUploadProgress(100)
    } catch (err) {
      clearInterval(progressInterval)
      setIsUploading(false)
      alert('Upload failed')
    }
  }

  // Handle action response
  useEffect(() => {
    if (actionData) {
      setIsUploading(false)
      if (actionData.success) {
        setTimeout(() => {
          navigate('/onboarding/review?new=true')
        }, 2000)
      } else {
        alert(`Upload failed: ${actionData.error}`)
      }
    }
  }, [actionData, navigate])

  const selectedFile = files?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="font-serif text-3xl font-light text-gray-900 mb-4">Upload Your Resume</h1>
          <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
            Upload your existing resume to get started. We'll extract your information and help you
            create a beautiful portfolio.
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">
                Drop your resume here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  browse
                </button>
              </h3>
              <p className="text-sm text-gray-500 mb-6">PDF files only, up to 10MB</p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Uploading...</span>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {actionData && !actionData.success && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Upload Error</h4>
                <p className="text-red-700 mt-1">{actionData.error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {actionData?.success && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Upload Successful</h4>
                <p className="text-green-700 mt-1">{actionData.message}</p>
                <p className="text-green-600 mt-2 text-sm">Redirecting to your portfolio...</p>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={uploadResume}
              disabled={!selectedFile || isUploading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? 'Uploading...' : 'Upload Resume'}
            </button>
          </div>
        </div>

        {/* Alternative Options */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Don't have a resume ready?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4" />
              Start from scratch
            </button>
            <button
              type="button"
              onClick={() => navigate('/demo')}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              View demo portfolio
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
