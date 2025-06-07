import type React from 'react'
import HeroSection from './HeroSection'
import AboutSection from './AboutSection'
import ExperienceSection from './ExperienceSection' // Import ExperienceSection
import SkillsSection from './SkillsSection' // Import SkillsSection

// Re-defining a simplified Portfolio type here for clarity.
// Ideally, this would be imported from portfolioQueries.ts or a central types file.
interface SocialLink {
  platform: string
  url: string
  username?: string
}

interface WorkExperience {
  // Duplicating for clarity, ideally import
  id: string
  job_title: string
  company_name: string
  start_date: string
  end_date?: string | null
  description?: string
  location?: string
  is_current?: boolean
}

interface Skill {
  // Duplicating for clarity, ideally import
  id: string
  name: string
  proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  category?: string
}

interface Portfolio {
  id: string
  userId: string
  name: string
  title: string // Job title
  description?: string // Bio / About me
  profile_image_url?: string
  tagline?: string
  availability_status?: 'available' | 'unavailable' | 'open_to_offers'
  socialLinks?: SocialLink | null
  workExperiences?: WorkExperience[] // Added
  skills?: Skill[] // Added
}

interface PortfolioDisplayProps {
  portfolioData: Portfolio
}

const PortfolioDisplay: React.FC<PortfolioDisplayProps> = ({ portfolioData }) => {
  if (!portfolioData) {
    return <p>No portfolio data to display.</p>
  }

  return (
    <div className="font-sans">
      <HeroSection
        name={portfolioData.name}
        jobTitle={portfolioData.title}
        bio={portfolioData.description}
        tagline={portfolioData.tagline}
        avatarUrl={portfolioData.profile_image_url}
        socialLinks={portfolioData.socialLinks}
        availabilityStatus={portfolioData.availability_status}
      />
      <AboutSection title="About Me" content={portfolioData.description} />
      <ExperienceSection workExperiences={portfolioData.workExperiences} />
      <SkillsSection skills={portfolioData.skills} />
      {/*
        Future sections to be added here:
        <ProjectsSection projects={portfolioData.projects} />
        <TestimonialsSection testimonials={portfolioData.testimonials} />
        <ContactSection email={portfolioData.contact_email} />
      */}
    </div>
  )
}

export default PortfolioDisplay
