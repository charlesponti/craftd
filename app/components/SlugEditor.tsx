import { Check, Edit, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSubmit } from 'react-router'

interface SlugEditorProps {
  portfolioId: string
  initialSlug: string
  onSave?: (newSlug: string) => void
  onCancel?: () => void
}

interface ValidationState {
  isChecking: boolean
  isAvailable: boolean | null
  message: string
  isValid: boolean
}

export function SlugEditor({ portfolioId, initialSlug, onSave, onCancel }: SlugEditorProps) {
  const submit = useSubmit()

  // Component state
  const [isEditing, setIsEditing] = useState(false)
  const [slugValue, setSlugValue] = useState(initialSlug)
  const [isSaving, setIsSaving] = useState(false)
  const [validation, setValidation] = useState<ValidationState>({
    isChecking: false,
    isAvailable: null,
    message: '',
    isValid: true,
  })

  // Reset slug value when initialSlug changes (from successful save)
  useEffect(() => {
    setSlugValue(initialSlug)
  }, [initialSlug])

  // Debounced slug validation
  const validateSlug = useCallback(
    async (slug: string) => {
      // Reset validation if empty or same as initial
      if (!slug || slug === initialSlug) {
        setValidation({ isChecking: false, isAvailable: null, message: '', isValid: true })
        return
      }

      // Basic client-side validation
      if (slug.length < 3) {
        setValidation({
          isChecking: false,
          isAvailable: false,
          message: 'Slug must be at least 3 characters long',
          isValid: false,
        })
        return
      }

      if (slug.length > 50) {
        setValidation({
          isChecking: false,
          isAvailable: false,
          message: 'Slug must be less than 50 characters long',
          isValid: false,
        })
        return
      }

      // Server-side availability check
      setValidation({
        isChecking: true,
        isAvailable: null,
        message: 'Checking availability...',
        isValid: true,
      })

      try {
        const response = await fetch(
          `/api/validate-slug?slug=${encodeURIComponent(slug)}&currentId=${encodeURIComponent(portfolioId)}`
        )
        const data = (await response.json()) as {
          success: boolean
          data?: { isAvailable: boolean; message: string }
          error?: string
        }

        if (data.success && data.data) {
          setValidation({
            isChecking: false,
            isAvailable: data.data.isAvailable,
            message: data.data.message,
            isValid: data.data.isAvailable,
          })
        } else {
          setValidation({
            isChecking: false,
            isAvailable: false,
            message: data.error || 'Invalid slug format',
            isValid: false,
          })
        }
      } catch (error) {
        setValidation({
          isChecking: false,
          isAvailable: false,
          message: 'Error checking availability',
          isValid: false,
        })
      }
    },
    [portfolioId, initialSlug]
  )

  // Debounce validation calls
  useEffect(() => {
    if (!isEditing) return

    const timer = setTimeout(() => {
      validateSlug(slugValue)
    }, 500)

    return () => clearTimeout(timer)
  }, [slugValue, validateSlug, isEditing])

  // Event handlers
  const handleEdit = () => {
    setIsEditing(true)
    setSlugValue(initialSlug)
    setValidation({ isChecking: false, isAvailable: null, message: '', isValid: true })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSlugValue(initialSlug)
    setValidation({ isChecking: false, isAvailable: null, message: '', isValid: true })
    onCancel?.()
  }

  const handleSave = async () => {
    if (!validation.isValid || !validation.isAvailable || slugValue === initialSlug || isSaving) {
      return
    }

    setIsSaving(true)

    try {
      const formData = new FormData()
      formData.append('action', 'update-slug')
      formData.append('slug', slugValue)
      formData.append('portfolioId', portfolioId)

      submit(formData, { method: 'post' })

      // Let the parent component handle the success state
      onSave?.(slugValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save slug:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Transform input to valid slug format
    const newValue = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlugValue(newValue)
  }

  // Determine if save button should be enabled
  const canSave =
    validation.isValid && validation.isAvailable && slugValue !== initialSlug && !isSaving

  // Get status icon and styling
  const getValidationStatus = () => {
    if (!isEditing || !slugValue || slugValue === initialSlug) return null

    if (validation.isChecking) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    }

    if (validation.isAvailable) {
      return <Check className="w-4 h-4 text-green-500" />
    }

    if (validation.isAvailable === false) {
      return <X className="w-4 h-4 text-red-500" />
    }

    return null
  }

  // Get message styling
  const getMessageStyling = () => {
    if (!validation.message) return ''

    if (validation.isChecking) return 'text-blue-600'
    if (validation.isAvailable) return 'text-green-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-2">
      <label htmlFor="portfolio-slug" className="text-sm font-medium text-gray-700">
        Portfolio URL
      </label>

      <div className="flex items-center space-x-2">
        <div className="flex items-center flex-1 min-w-0">
          <span className="text-sm text-gray-500 flex-shrink-0">craftd.dev/p/</span>
          {isEditing ? (
            <div className="flex-1 relative">
              <input
                id="portfolio-slug"
                type="text"
                value={slugValue}
                onChange={handleInputChange}
                className="w-full text-sm font-mono px-2 py-1 pr-8 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your-portfolio-name"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                {getValidationStatus()}
              </div>
            </div>
          ) : (
            <span className="flex-1 text-sm font-mono text-blue-600 px-2 py-1">{initialSlug}</span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="inline-flex items-center px-3 py-1 text-xs border border-green-300 rounded text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                Save
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Validation message */}
      {isEditing && validation.message && (
        <p className={`text-xs ${getMessageStyling()}`}>{validation.message}</p>
      )}
    </div>
  )
}
