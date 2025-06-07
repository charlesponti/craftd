import type React from 'react'

interface Skill {
  id: string
  name: string
  proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  category?: string
}

interface SkillsSectionProps {
  skills?: Skill[] | null
  title?: string
}

const SkillsSection: React.FC<SkillsSectionProps> = ({ skills, title = 'Skills & Expertise' }) => {
  if (!skills || skills.length === 0) {
    return null // Don't render if there are no skills
  }

  // Group skills by category if categories exist
  const groupedSkills: { [key: string]: Skill[] } = skills.reduce(
    (acc, skill) => {
      const category = skill.category || 'General'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(skill)
      return acc
    },
    {} as { [key: string]: Skill[] }
  )

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">{title}</h2>
        {Object.entries(groupedSkills).map(([category, skillsInCategory]) => (
          <div key={category} className="mb-10">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b-2 border-indigo-200 pb-2">
              {category}
            </h3>
            <div className="flex flex-wrap -m-2">
              {skillsInCategory.map((skill) => (
                <div key={skill.id} className="p-2">
                  <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-300">
                    <h4 className="text-md font-medium text-indigo-700">{skill.name}</h4>
                    {skill.proficiency && (
                      <p className="text-sm text-gray-600">{skill.proficiency}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default SkillsSection
