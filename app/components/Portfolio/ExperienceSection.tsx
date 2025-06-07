import type React from 'react'

interface WorkExperience {
  id: string
  job_title: string
  company_name: string
  start_date: string // ISO date string
  end_date?: string | null // ISO date string or null if current
  description?: string
  location?: string
  is_current?: boolean
}

interface ExperienceSectionProps {
  workExperiences?: WorkExperience[] | null
  title?: string
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  })
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  workExperiences,
  title = 'Work Experience',
}) => {
  if (!workExperiences || workExperiences.length === 0) {
    return null // Don't render if there are no experiences
  }

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">{title}</h2>
        <div className="space-y-12">
          {workExperiences.map((exp) => (
            <div key={exp.id} className="flex flex-col md:flex-row">
              <div className="md:w-1/4 mb-4 md:mb-0">
                <h3 className="text-xl font-semibold text-gray-800">{exp.company_name}</h3>
                {exp.location && <p className="text-sm text-gray-500">{exp.location}</p>}
                <p className="text-sm text-gray-500">
                  {formatDate(exp.start_date)} -
                  {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                </p>
              </div>
              <div className="md:w-3/4 md:pl-8">
                <h4 className="text-lg font-medium text-indigo-600 mb-1">{exp.job_title}</h4>
                {exp.description && (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {exp.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ExperienceSection
