import type React from 'react'

interface AboutSectionProps {
  title?: string | null
  content?: string | null // This could be portfolio.description or a dedicated about_content field
  // Potentially add other fields like skills highlights, years of experience, etc.
}

const AboutSection: React.FC<AboutSectionProps> = ({ title = 'About Me', content }) => {
  if (!content) {
    return null // Don't render the section if there's no content for it
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">{title}</h2>
        <div className="max-w-3xl mx-auto text-gray-700 text-lg leading-relaxed prose lg:prose-xl">
          {/* Using a simple paragraph for content. For markdown, a parser would be needed. */}
          <p>{content}</p>
        </div>
      </div>
    </section>
  )
}

export default AboutSection
