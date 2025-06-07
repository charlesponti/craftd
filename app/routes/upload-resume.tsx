import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import type { MetaFunction } from 'react-router'

export const meta: MetaFunction = () => {
  return [
    { title: 'Upload Resume | Craftd' },
    {
      name: 'description',
      content: 'Upload your resume to get started with Craftd',
    },
  ]
}

export default function UploadResume() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/onboarding')
  }, [navigate])

  return null
}
