import { supabase } from '../lib/supabaseClient'

// --- INTERFACES (approximated due to missing schema.ts) ---

interface SocialLink {
  id: string
  portfolio_id: string
  platform: string
  url: string
  username?: string
}

interface PortfolioStat {
  id: string
  portfolio_id: string
  label: string
  value: string
  icon?: string
}

interface WorkExperience {
  id: string
  portfolio_id: string
  job_title: string
  company_name: string
  start_date: string
  end_date?: string | null
  description?: string
  location?: string
  is_current?: boolean
}

interface Skill {
  id: string
  portfolio_id: string
  name: string
  proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  category?: string
}

// ADDED Project interface
interface Project {
  id: string
  portfolio_id: string
  title: string
  description: string
  short_description?: string | null
  live_url?: string | null
  github_url?: string | null
  image_url?: string | null
  video_url?: string | null
  technologies?: string[] | null // Stored as JSON or text array in DB
  status?: string | null // e.g., 'Completed', 'In Progress', 'Archived'
  start_date?: string | null
  end_date?: string | null
}

// ADDED Testimonial interface
interface Testimonial {
  id: string
  portfolio_id: string
  name: string // Reviewer's name
  title: string // Reviewer's title/position
  company?: string | null
  content: string
  avatar_url?: string | null
  linkedin_url?: string | null
  rating?: number | null // e.g., 1-5
}

interface Portfolio {
  id: string
  userId: string
  name: string
  title: string
  description?: string
  profile_image_url?: string
  tagline?: string
  availability_status?: 'available' | 'unavailable' | 'open_to_offers'
  location?: string
  contact_email?: string
  created_at: string
  updated_at: string

  // Related entities
  socialLinks?: SocialLink[]
  portfolioStats?: PortfolioStat[]
  workExperiences?: WorkExperience[]
  skills?: Skill[]
  projects?: Project[] // ADDED
  testimonials?: Testimonial[] // ADDED
}

// --- FETCH FUNCTION ---

export const fetchFullUserPortfolio = async (userId: string): Promise<Portfolio | null> => {
  if (!userId) {
    throw new Error('User ID is required to fetch portfolio.')
  }

  const { data: portfolioData, error: portfolioError } = await supabase
    .from('portfolios')
    .select('*')
    .eq('userId', userId)
    .maybeSingle()

  if (portfolioError) {
    console.error('Error fetching main portfolio:', portfolioError)
    throw new Error(portfolioError.message)
  }

  if (!portfolioData) {
    return null
  }

  const portfolioId = portfolioData.id
  let fetchedSocialLinks: SocialLink[] = []
  let fetchedPortfolioStats: PortfolioStat[] = []
  let fetchedWorkExperiences: WorkExperience[] = []
  let fetchedSkills: Skill[] = []
  let fetchedProjects: Project[] = [] // ADDED
  let fetchedTestimonials: Testimonial[] = [] // ADDED

  // 2. Fetch related SocialLinks
  const { data: slData, error: slError } = await supabase
    .from('social_links')
    .select('*')
    .eq('portfolio_id', portfolioId)

  if (slError) console.warn('Error fetching social links:', slError.message)
  else if (slData) fetchedSocialLinks = slData as SocialLink[]

  // 3. Fetch related PortfolioStats
  const { data: psData, error: psError } = await supabase
    .from('portfolio_stats')
    .select('*')
    .eq('portfolio_id', portfolioId)

  if (psError) console.warn('Error fetching portfolio stats:', psError.message)
  else if (psData) fetchedPortfolioStats = psData as PortfolioStat[]

  // 4. Fetch related WorkExperiences
  const { data: weData, error: weError } = await supabase
    .from('work_experiences')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('start_date', { ascending: false })

  if (weError) console.warn('Error fetching work experiences:', weError.message)
  else if (weData) fetchedWorkExperiences = weData as WorkExperience[]

  // 5. Fetch related Skills
  const { data: skData, error: skError } = await supabase
    .from('skills')
    .select('*')
    .eq('portfolio_id', portfolioId)

  if (skError) console.warn('Error fetching skills:', skError.message)
  else if (skData) fetchedSkills = skData as Skill[]

  // 6. Fetch related Projects (ADDED)
  const { data: prData, error: prError } = await supabase
    .from('projects')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('start_date', { ascending: false }) // Example order

  if (prError) console.warn('Error fetching projects:', prError.message)
  else if (prData) fetchedProjects = prData as Project[]

  // 7. Fetch related Testimonials (ADDED)
  const { data: tmData, error: tmError } = await supabase
    .from('testimonials')
    .select('*')
    .eq('portfolio_id', portfolioId)

  if (tmError) console.warn('Error fetching testimonials:', tmError.message)
  else if (tmData) fetchedTestimonials = tmData as Testimonial[]

  return {
    ...(portfolioData as Omit<
      Portfolio,
      'socialLinks' | 'portfolioStats' | 'workExperiences' | 'skills' | 'projects' | 'testimonials'
    >),
    socialLinks: fetchedSocialLinks,
    portfolioStats: fetchedPortfolioStats,
    workExperiences: fetchedWorkExperiences,
    skills: fetchedSkills,
    projects: fetchedProjects, // ADDED
    testimonials: fetchedTestimonials, // ADDED
  }
}

// Add interface for portfolio summary (lightweight for listings)
interface PortfolioSummary {
  id: string
  userId: string
  slug: string
  title: string
  name: string
  jobTitle: string
  bio: string
  isPublic: boolean
  isActive: boolean
  updatedAt: string
}

// Function to fetch multiple portfolios for a user (lightweight summary)
export const fetchUserPortfolios = async (userId: string): Promise<PortfolioSummary[]> => {
  if (!userId) {
    throw new Error('User ID is required to fetch portfolios.')
  }

  const { data: portfoliosData, error: portfoliosError } = await supabase
    .from('portfolios')
    .select(
      `
      id,
      userId:user_id,
      slug,
      title,
      name,
      jobTitle:job_title,
      bio,
      isPublic:is_public,
      isActive:is_active,
      updatedAt:updated_at
    `
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (portfoliosError) {
    console.error('Error fetching user portfolios:', portfoliosError)
    throw new Error(portfoliosError.message)
  }

  return portfoliosData || []
}
