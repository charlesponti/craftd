import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// Type definitions for better TypeScript support
export type ProjectStatus = 'in-progress' | 'completed' | 'archived'
export type AnalyticsEvent =
  | 'view'
  | 'contact_click'
  | 'project_click'
  | 'skill_click'
  | 'social_click'
  | 'download_resume'
  | 'copy_email'

// Users table - stores basic user information
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    supabaseUserId: varchar('supabase_user_id', { length: 255 }).unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_supabase_user_id_idx').on(table.supabaseUserId),
  ]
)

export const portfolios = pgTable(
  'portfolios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull()
      .unique(), // Enforce one portfolio per user
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    isPublic: boolean('is_public').default(true).notNull(),
    isActive: boolean('is_active').default(true).notNull(),

    // Personal Information (normalized from JSON)
    name: varchar('name', { length: 255 }).notNull(),
    initials: varchar('initials', { length: 10 }),
    jobTitle: varchar('job_title', { length: 255 }).notNull(),
    bio: text('bio').notNull(),
    tagline: varchar('tagline', { length: 500 }).notNull(),

    // Location
    currentLocation: varchar('current_location', { length: 255 }).notNull(),
    locationTagline: varchar('location_tagline', { length: 255 }),

    // Availability
    availabilityStatus: boolean('availability_status').default(false).notNull(),
    availabilityMessage: varchar('availability_message', { length: 500 }),

    // Contact
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),

    // Theme settings (simple object is fine)
    theme: json('theme').$type<{
      primaryColor?: string
      accentColor?: string
      backgroundColor?: string
      fontFamily?: string
    }>(),

    // Copyright
    copyright: varchar('copyright', { length: 255 }),

    // Profile Image
    profileImageUrl: varchar('profile_image_url', { length: 500 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('portfolio_user_id_idx').on(table.userId),
    index('portfolio_slug_idx').on(table.slug),
    index('portfolio_public_idx').on(table.isPublic),
    index('portfolio_active_idx').on(table.isActive),
    index('portfolio_email_idx').on(table.email),
    // Composite indexes for common queries
    index('portfolio_public_active_idx').on(table.isPublic, table.isActive),
    index('portfolio_user_active_idx').on(table.userId, table.isActive),
  ]
)

// Social Links table - separate table for social media links
export const socialLinks = pgTable(
  'social_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    portfolioId: uuid('portfolio_id')
      .references(() => portfolios.id, { onDelete: 'cascade' })
      .notNull()
      .unique(), // One-to-one relationship with portfolio

    github: varchar('github', { length: 500 }),
    linkedin: varchar('linkedin', { length: 500 }),
    twitter: varchar('twitter', { length: 500 }),
    website: varchar('website', { length: 500 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('social_links_portfolio_id_idx').on(table.portfolioId)]
)

// Portfolio Stats table - separate table for personal stats
export const portfolioStats = pgTable(
  'portfolio_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    portfolioId: uuid('portfolio_id')
      .references(() => portfolios.id, { onDelete: 'cascade' })
      .notNull(),

    label: varchar('label', { length: 255 }).notNull(),
    value: varchar('value', { length: 255 }).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('portfolio_stats_portfolio_id_idx').on(table.portfolioId),
    index('portfolio_stats_sort_order_idx').on(table.sortOrder),
    index('portfolio_stats_portfolio_sort_idx').on(table.portfolioId, table.sortOrder),
  ]
)

// Work Experience table - stores individual work experiences
export const workExperiences = pgTable(
  'work_experiences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    portfolioId: uuid('portfolio_id')
      .references(() => portfolios.id, { onDelete: 'cascade' })
      .notNull(),

    role: varchar('role', { length: 255 }).notNull(),
    company: varchar('company', { length: 255 }).notNull(),
    description: text('description').notNull(),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),

    // Financial/Compensation Information
    baseSalary: integer('base_salary'), // Annual base salary in cents
    currency: varchar('currency', { length: 10 }).default('USD').notNull(),
    salaryRange: json('salary_range').$type<{
      min: number
      max: number
      currency: string
    }>(),
    totalCompensation: integer('total_compensation'), // Including equity, bonuses in cents
    equityValue: integer('equity_value'), // Estimated equity value in cents
    equityPercentage: varchar('equity_percentage', { length: 20 }),
    signingBonus: integer('signing_bonus'), // One-time signing bonus in cents
    annualBonus: integer('annual_bonus'), // Expected/average annual bonus in cents
    bonusHistory: json('bonus_history')
      .$type<
        Array<{
          type: 'annual' | 'signing' | 'performance' | 'retention' | 'spot'
          amount: number // in cents
          date: string
          description?: string
        }>
      >()
      .default([]),

    // Benefits and Perks
    benefits: json('benefits').$type<{
      healthInsurance?: boolean
      dental?: boolean
      vision?: boolean
      retirement401k?: number // percentage match
      retirementVesting?: string // vesting schedule
      paidTimeOff?: number // days per year
      sickLeave?: number // days per year
      parentalLeave?: number // weeks
      stockOptions?: boolean
      stockPurchasePlan?: boolean
      flexibleSchedule?: boolean
      remoteWork?: boolean
      gymMembership?: boolean
      tuitionReimbursement?: number // annual amount in cents
      professionalDevelopment?: number // annual budget in cents
      commuter?: number // monthly allowance in cents
      meals?: string // "free", "subsidized", "none"
      other?: string[]
    }>(),

    // Employment Details
    employmentType: varchar('employment_type', { length: 50 }).default('full-time').notNull(),
    workArrangement: varchar('work_arrangement', { length: 50 }).default('office').notNull(),
    seniorityLevel: varchar('seniority_level', { length: 50 }),
    department: varchar('department', { length: 100 }),
    teamSize: integer('team_size'),
    reportsTo: varchar('reports_to', { length: 255 }),
    directReports: integer('direct_reports').default(0),

    // Performance and Growth
    performanceRatings: json('performance_ratings')
      .$type<
        Array<{
          period: string // "2023-Q4", "2023-Annual"
          rating: string // "exceeds", "meets", "below"
          score?: number // if numeric scale
          feedback?: string
          goals?: string[]
        }>
      >()
      .default([]),

    // Promotion/Raise History within this role
    salaryAdjustments: json('salary_adjustments')
      .$type<
        Array<{
          effectiveDate: string
          previousSalary: number
          newSalary: number
          increaseAmount: number
          increasePercentage: number
          reason:
            | 'promotion'
            | 'merit_increase'
            | 'market_adjustment'
            | 'cost_of_living'
            | 'role_change'
          newTitle?: string
          notes?: string
        }>
      >()
      .default([]),

    // Display information (existing)
    image: varchar('image', { length: 500 }),
    gradient: varchar('gradient', { length: 100 }),
    metrics: varchar('metrics', { length: 100 }),
    action: varchar('action', { length: 100 }),

    // Tags and metadata (enhanced)
    tags: json('tags').$type<string[]>().default([]),
    metadata: json('metadata').$type<{
      company_size?: string
      industry?: string
      location?: string
      website?: string
      achievements?: string[]
      technologies?: string[]
      projects?: string[]
      certifications_earned?: string[]
    }>(),

    // Ordering and display
    sortOrder: integer('sort_order').default(0).notNull(),
    isVisible: boolean('is_visible').default(true).notNull(),

    // Reason for leaving
    reasonForLeaving: varchar('reason_for_leaving', { length: 100 }),
    exitNotes: text('exit_notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('work_exp_portfolio_id_idx').on(table.portfolioId),
    index('work_exp_sort_order_idx').on(table.sortOrder),
    index('work_exp_visible_idx').on(table.isVisible),
    index('work_exp_created_at_idx').on(table.createdAt),
    index('work_exp_start_date_idx').on(table.startDate),
    index('work_exp_base_salary_idx').on(table.baseSalary),
    index('work_exp_employment_type_idx').on(table.employmentType),
    index('work_exp_seniority_level_idx').on(table.seniorityLevel),
    // Composite indexes for common queries
    index('work_exp_portfolio_visible_idx').on(table.portfolioId, table.isVisible),
    index('work_exp_portfolio_sort_idx').on(table.portfolioId, table.sortOrder),
    index('work_exp_portfolio_salary_idx').on(table.portfolioId, table.baseSalary),
    // Check constraints
    check(
      'work_exp_employment_type_check',
      sql`${table.employmentType} IN ('full-time', 'part-time', 'contract', 'freelance', 'internship', 'temporary')`
    ),
    check(
      'work_exp_work_arrangement_check',
      sql`${table.workArrangement} IN ('office', 'remote', 'hybrid', 'travel')`
    ),
    check(
      'work_exp_seniority_level_check',
      sql`${table.seniorityLevel} IN ('intern', 'entry-level', 'mid-level', 'senior', 'lead', 'principal', 'staff', 'director', 'vp', 'c-level')`
    ),
    check(
      'work_exp_reason_leaving_check',
      sql`${table.reasonForLeaving} IN ('promotion', 'better_opportunity', 'relocation', 'layoff', 'termination', 'contract_end', 'career_change', 'salary', 'culture', 'management', 'growth', 'personal')`
    ),
  ]
)

// Skills table - stores individual skills
export const skills = pgTable(
  'skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    portfolioId: uuid('portfolio_id')
      .references(() => portfolios.id, { onDelete: 'cascade' })
      .notNull(),

    name: varchar('name', { length: 255 }).notNull(),
    level: integer('level').notNull(), // 1-100
    category: varchar('category', { length: 100 }), // e.g., 'technical', 'leadership', 'design'
    icon: varchar('icon', { length: 100 }), // Icon identifier or class name

    // Additional metadata
    description: text('description'),
    yearsOfExperience: integer('years_of_experience'),
    certifications: json('certifications').$type<string[]>().default([]),

    // Display options
    isVisible: boolean('is_visible').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('skills_portfolio_id_idx').on(table.portfolioId),
    index('skills_category_idx').on(table.category),
    index('skills_sort_order_idx').on(table.sortOrder),
    index('skills_visible_idx').on(table.isVisible),
    index('skills_level_idx').on(table.level),
    // Composite indexes for common queries
    index('skills_portfolio_visible_idx').on(table.portfolioId, table.isVisible),
    index('skills_portfolio_category_idx').on(table.portfolioId, table.category),
    index('skills_portfolio_sort_idx').on(table.portfolioId, table.sortOrder),
    // Check constraints
    check('skills_level_check', sql`${table.level} >= 1 AND ${table.level} <= 100`),
  ]
)

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    portfolioId: uuid('portfolio_id')
      .references(() => portfolios.id, { onDelete: 'cascade' })
      .notNull(),

    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    shortDescription: varchar('short_description', { length: 500 }),

    // Links and media
    liveUrl: varchar('live_url', { length: 500 }),
    githubUrl: varchar('github_url', { length: 500 }),
    imageUrl: varchar('image_url', { length: 500 }),
    videoUrl: varchar('video_url', { length: 500 }),

    // Technical details
    technologies: json('technologies').$type<string[]>().default([]),
    status: varchar('status', { length: 50 }).default('completed').notNull(),

    // Timeline
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),

    // Display options
    isFeatured: boolean('is_featured').default(false).notNull(),
    isVisible: boolean('is_visible').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('projects_portfolio_id_idx').on(table.portfolioId),
    index('projects_status_idx').on(table.status),
    index('projects_featured_idx').on(table.isFeatured),
    index('projects_sort_order_idx').on(table.sortOrder),
    // Composite indexes for common queries
    index('projects_portfolio_featured_visible_idx').on(
      table.portfolioId,
      table.isFeatured,
      table.isVisible
    ),
    index('projects_portfolio_visible_idx').on(table.portfolioId, table.isVisible),
    // Check constraints
    check(
      'projects_status_check',
      sql`${table.status} IN ('in-progress', 'completed', 'archived')`
    ),
  ]
)

// Testimonials table - for recommendations and testimonials
export const testimonials = pgTable(
  'testimonials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    portfolioId: uuid('portfolio_id')
      .references(() => portfolios.id, { onDelete: 'cascade' })
      .notNull(),

    name: varchar('name', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }),
    company: varchar('company', { length: 255 }),
    content: text('content').notNull(),

    // Contact and media
    avatarUrl: varchar('avatar_url', { length: 500 }),
    linkedinUrl: varchar('linkedin_url', { length: 500 }),

    // Rating and validation
    rating: integer('rating'), // 1-5 stars
    isVerified: boolean('is_verified').default(false).notNull(),

    // Display options
    isVisible: boolean('is_visible').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('testimonials_portfolio_id_idx').on(table.portfolioId),
    index('testimonials_rating_idx').on(table.rating),
    index('testimonials_sort_order_idx').on(table.sortOrder),
    // Composite indexes for common queries
    index('testimonials_portfolio_verified_idx').on(
      table.portfolioId,
      table.isVerified,
      table.isVisible
    ),
    index('testimonials_portfolio_visible_idx').on(table.portfolioId, table.isVisible),
    // Check constraints
    check('testimonials_rating_check', sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
  ]
)

// Analytics table - for tracking portfolio views and engagement
export const analytics = pgTable(
  'analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    portfolioId: uuid('portfolio_id')
      .references(() => portfolios.id, { onDelete: 'cascade' })
      .notNull(),

    // Event tracking
    event: varchar('event', { length: 100 }).notNull(),
    path: varchar('path', { length: 500 }),

    // Visitor information
    visitorId: varchar('visitor_id', { length: 100 }), // Anonymous visitor tracking
    ipAddress: varchar('ip_address', { length: 50 }),
    userAgent: text('user_agent'),
    referer: varchar('referer', { length: 500 }),

    // Geolocation
    country: varchar('country', { length: 100 }),
    city: varchar('city', { length: 100 }),

    // Additional metadata
    metadata: json('metadata').$type<Record<string, unknown>>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('analytics_portfolio_id_idx').on(table.portfolioId),
    index('analytics_event_idx').on(table.event),
    index('analytics_visitor_id_idx').on(table.visitorId),
    // Composite indexes for common dashboard queries
    index('analytics_portfolio_event_date_idx').on(table.portfolioId, table.event, table.createdAt),
    index('analytics_portfolio_date_idx').on(table.portfolioId, table.createdAt),
    // Check constraint for valid events
    check(
      'analytics_event_check',
      sql`${table.event} IN ('view', 'contact_click', 'project_click', 'skill_click', 'social_click', 'download_resume', 'copy_email')`
    ),
  ]
)

// Companies table - for job application companies
export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    website: varchar('website', { length: 500 }),
    industry: varchar('industry', { length: 100 }),
    size: integer('size'),
    location: varchar('location', { length: 255 }),
    description: text('description'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('companies_name_idx').on(table.name),
    index('companies_industry_idx').on(table.industry),
    index('companies_size_idx').on(table.size),
  ]
)

// Job Applications table - for tracking job applications
export const jobApplications = pgTable(
  'job_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    companyId: uuid('company_id')
      .references(() => companies.id, { onDelete: 'cascade' })
      .notNull(),

    position: varchar('position', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),

    location: varchar('location', { length: 255 }),
    jobPosting: text('job_posting'),

    // Enhanced Salary Tracking
    salaryQuoted: text('salary_quoted'), // Keep for backward compatibility
    salaryAccepted: text('salary_accepted'), // Keep for backward compatibility

    // Structured Salary Data
    salaryExpected: integer('salary_expected'), // What you hoped for, in cents
    salaryRequested: integer('salary_requested'), // What you asked for, in cents
    salaryOffered: integer('salary_offered'), // Initial offer, in cents
    salaryNegotiated: integer('salary_negotiated'), // After negotiation, in cents
    salaryFinal: integer('salary_final'), // Final accepted amount, in cents
    totalCompOffered: integer('total_comp_offered'), // Including equity/bonuses, in cents
    totalCompFinal: integer('total_comp_final'), // Final total comp, in cents

    equityOffered: varchar('equity_offered', { length: 100 }), // "0.5%", "1000 shares"
    equityFinal: varchar('equity_final', { length: 100 }),
    bonusOffered: integer('bonus_offered'), // in cents
    bonusFinal: integer('bonus_final'), // in cents

    // Application Tracking
    source: varchar('source', { length: 100 }), // "linkedin", "indeed", "referral", "company_website"
    applicationDate: timestamp('application_date'),
    responseDate: timestamp('response_date'),
    firstInterviewDate: timestamp('first_interview_date'),
    offerDate: timestamp('offer_date'),
    decisionDate: timestamp('decision_date'),

    // Outcome Details
    rejectionReason: varchar('rejection_reason', { length: 255 }),
    withdrawalReason: varchar('withdrawal_reason', { length: 255 }),

    // Time Metrics (auto-calculated or manually entered)
    timeToResponse: integer('time_to_response'), // days from application to first response
    timeToFirstInterview: integer('time_to_first_interview'), // days
    timeToOffer: integer('time_to_offer'), // days from application to offer
    timeToDecision: integer('time_to_decision'), // days to make final decision
    coverLetter: text('cover_letter'),
    resume: text('resume'),
    jobId: varchar('job_id', { length: 100 }),
    link: varchar('link', { length: 500 }),
    phoneScreen: text('phone_screen'),
    reference: boolean('reference').default(false).notNull(),

    // Enhanced fields
    interviewDates: json('interview_dates')
      .$type<
        Array<{
          type: 'phone' | 'video' | 'onsite' | 'technical' | 'final'
          date: string
          duration?: number
          interviewer?: string
          notes?: string
        }>
      >()
      .default([]),

    companyNotes: text('company_notes'), // Research about the company
    negotiationNotes: text('negotiation_notes'), // Salary negotiation tracking

    stages: json('stages')
      .$type<
        Array<{
          stage: string
          date: string
          notes?: string
        }>
      >()
      .default([]),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('job_applications_user_id_idx').on(table.userId),
    index('job_applications_company_id_idx').on(table.companyId),
    index('job_applications_status_idx').on(table.status),
    index('job_applications_start_date_idx').on(table.startDate),
    index('job_applications_application_date_idx').on(table.applicationDate),
    index('job_applications_salary_final_idx').on(table.salaryFinal),
    index('job_applications_source_idx').on(table.source),
    index('job_applications_offer_date_idx').on(table.offerDate),
    // Composite indexes for common queries
    index('job_applications_user_status_idx').on(table.userId, table.status),
    index('job_applications_user_date_idx').on(table.userId, table.startDate),
    index('job_applications_user_app_date_idx').on(table.userId, table.applicationDate),
    index('job_applications_user_salary_idx').on(table.userId, table.salaryFinal),
    index('job_applications_status_salary_idx').on(table.status, table.salaryFinal),
    // Check constraints
    check(
      'job_applications_status_check',
      sql`${table.status} IN ('APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'FINAL_INTERVIEW', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')`
    ),
  ]
)

// Application Notes table - for detailed notes and feedback
export const applicationNotes = pgTable(
  'application_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id')
      .references(() => jobApplications.id, { onDelete: 'cascade' })
      .notNull(),

    type: varchar('type', { length: 50 }).notNull(), // 'general', 'interview', 'feedback', 'research'
    title: varchar('title', { length: 255 }),
    content: text('content').notNull(),
    isPrivate: boolean('is_private').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('application_notes_app_id_idx').on(table.applicationId),
    index('application_notes_type_idx').on(table.type),
    index('application_notes_created_at_idx').on(table.createdAt),
    // Check constraint for note types
    check(
      'application_notes_type_check',
      sql`${table.type} IN ('general', 'interview', 'feedback', 'research', 'follow_up')`
    ),
  ]
)

// Application Files table - for file attachments
export const applicationFiles = pgTable(
  'application_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id')
      .references(() => jobApplications.id, { onDelete: 'cascade' })
      .notNull(),

    type: varchar('type', { length: 50 }).notNull(), // 'resume', 'cover_letter', 'portfolio', 'other'
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileUrl: text('file_url'), // For external files
    fileContent: text('file_content'), // For text content
    mimeType: varchar('mime_type', { length: 100 }),
    fileSize: integer('file_size'), // in bytes

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('application_files_app_id_idx').on(table.applicationId),
    index('application_files_type_idx').on(table.type),
    index('application_files_created_at_idx').on(table.createdAt),
    // Check constraint for file types
    check(
      'application_files_type_check',
      sql`${table.type} IN ('resume', 'cover_letter', 'portfolio', 'offer_letter', 'other')`
    ),
  ]
)

// Type exports for Drizzle ORM tables
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Portfolio = typeof portfolios.$inferSelect
export type NewPortfolio = typeof portfolios.$inferInsert

export type SocialLinks = typeof socialLinks.$inferSelect
export type NewSocialLinks = typeof socialLinks.$inferInsert

export type PortfolioStats = typeof portfolioStats.$inferSelect
export type NewPortfolioStats = typeof portfolioStats.$inferInsert

export type WorkExperience = typeof workExperiences.$inferSelect
export type NewWorkExperience = typeof workExperiences.$inferInsert

export type Skill = typeof skills.$inferSelect
export type NewSkill = typeof skills.$inferInsert

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert

export type Testimonial = typeof testimonials.$inferSelect
export type NewTestimonial = typeof testimonials.$inferInsert

export type Analytics = typeof analytics.$inferSelect
export type NewAnalytics = typeof analytics.$inferInsert

export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert

export type JobApplication = typeof jobApplications.$inferSelect
export type NewJobApplication = typeof jobApplications.$inferInsert

export type ApplicationNote = typeof applicationNotes.$inferSelect
export type NewApplicationNote = typeof applicationNotes.$inferInsert

export type ApplicationFile = typeof applicationFiles.$inferSelect
export type NewApplicationFile = typeof applicationFiles.$inferInsert

export type CareerEvent = typeof careerEvents.$inferSelect
export type NewCareerEvent = typeof careerEvents.$inferInsert

// Interview data type (extracted from database schema)
export interface InterviewEntry {
  type: 'phone' | 'video' | 'onsite' | 'technical' | 'final'
  date: string
  duration?: number
  interviewer?: string
  notes?: string
}

// Enhanced application type with company data
export interface ApplicationWithCompany extends Omit<JobApplication, 'companyId'> {
  company: Company | null
  interviewDates: InterviewEntry[] | null
  companyNotes: string | null
  negotiationNotes: string | null
}

// Complete application data with all relations
export interface ApplicationWithRelations {
  application: ApplicationWithCompany
  notes: ApplicationNote[]
  files: ApplicationFile[]
}

// Enhanced work experience with financial data
export interface WorkExperienceWithFinancials extends WorkExperience {
  // Calculated fields for dashboard
  totalTenure?: number // days
  currentAnnualizedSalary?: number // in cents, accounting for raises
  totalCompensationReceived?: number // in cents, including all bonuses
  averageAnnualRaise?: number // percentage
  promotionCount?: number
  skillsAcquired?: string[]
}

// Career event with related data
export interface CareerEventWithContext extends CareerEvent {
  workExperience?: WorkExperience
  relatedEvents?: CareerEvent[] // other events from same time period
  marketContext?: {
    industryGrowth?: number
    roleMarketMedian?: number
    locationCostOfLiving?: number
  }
}

// Career progression summary for dashboard
export interface CareerProgressionSummary {
  totalExperience: number // years
  currentSalary: number // in cents
  firstSalary: number // in cents
  totalSalaryGrowth: number // in cents
  salaryGrowthPercentage: number
  averageAnnualGrowth: number // percentage

  promotionCount: number
  jobChangeCount: number
  averageTenurePerJob: number // years

  highestSalaryIncrease: {
    amount: number
    percentage: number
    reason: string
    date: string
  }

  salaryByYear: Array<{
    year: number
    salary: number
    totalComp: number
    company: string
    title: string
  }>

  currentLevel: string
  levelProgression: Array<{
    level: string
    startDate: string
    endDate?: string
    duration: number // months
  }>
}

// Financial metrics for dashboard
export interface FinancialMetrics {
  // Current state
  currentSalary: number
  currentTotalComp: number

  // Growth metrics
  totalCareerGrowth: number // percentage from first to current salary
  compoundAnnualGrowthRate: number // CAGR percentage

  // Yearly breakdown
  salaryHistory: Array<{
    year: number
    baseSalary: number
    totalComp: number
    bonuses: number
    equityValue: number
    company: string
    role: string
  }>

  // Job change analysis
  jobChangeImpact: Array<{
    changeDate: string
    fromCompany: string
    toCompany: string
    salaryIncrease: number
    percentageIncrease: number
    totalCompIncrease: number
  }>

  // Market positioning
  marketComparison: {
    percentileRank?: number // where you stand vs market
    marketMedian?: number
    marketRange?: { min: number; max: number }
    lastUpdated?: string
  }
}

// Type for job application updates
export interface JobApplicationUpdate {
  position?: string
  status?: string
  location?: string | null
  jobPosting?: string | null
  salaryQuoted?: string | null
  salaryAccepted?: string | null
  companyNotes?: string | null
  negotiationNotes?: string | null
  updatedAt?: Date
}

// Job application metrics for dashboard
export interface JobApplicationMetrics {
  totalApplications: number
  responseRate: number // percentage
  interviewRate: number // percentage
  offerRate: number // percentage
  acceptanceRate: number // percentage

  averageTimeToResponse: number // days
  averageTimeToOffer: number // days
  averageTimeToDecision: number // days

  salaryMetrics: {
    averageOffered: number
    averageAccepted: number
    negotiationSuccessRate: number // percentage
    averageNegotiationIncrease: number // percentage
  }

  sourceMetrics: Array<{
    source: string
    count: number
    responseRate: number
    offerRate: number
  }>

  statusBreakdown: Array<{
    status: string
    count: number
    percentage: number
  }>
}

// Bonus/equity tracking
export interface BonusEntry {
  type: 'annual' | 'signing' | 'performance' | 'retention' | 'spot'
  amount: number // in cents
  date: string
  description?: string
  company?: string
  workExperienceId?: string
}

export interface EquityEntry {
  grantDate: string
  shares?: number
  percentage?: string
  strikePrice?: number
  currentValue?: number // estimated in cents
  vestingSchedule?: string
  company: string
  workExperienceId?: string
}

// Performance tracking
export interface PerformanceEntry {
  period: string // "2023-Q4", "2023-Annual"
  rating: string // "exceeds", "meets", "below"
  score?: number
  feedback?: string
  goals?: string[]
  company: string
  role: string
  workExperienceId: string
}

// Salary adjustment tracking
export interface SalaryAdjustment {
  effectiveDate: string
  previousSalary: number
  newSalary: number
  increaseAmount: number
  increasePercentage: number
  reason: 'promotion' | 'merit_increase' | 'market_adjustment' | 'cost_of_living' | 'role_change'
  newTitle?: string
  notes?: string
  company: string
  workExperienceId: string
}

// Composite types for portfolio with relations
export interface PortfolioWithRelations extends Portfolio {
  socialLinks?: SocialLinks
  stats: PortfolioStats[]
  workExperience: WorkExperience[]
  skills: Skill[]
  projects?: Project[]
  testimonials?: Testimonial[]
}

// Legacy PersonalInfo interface (for backward compatibility during migration)
export interface PersonalInfo {
  name: string
  initials?: string
  title: string
  bio: string
  tagline: string
  location: {
    current: string
    tagline?: string
  }
  availability: {
    status: boolean
    message?: string
  }
  contact: {
    email: string
    phone?: string
  }
  social: {
    github?: string
    linkedin?: string
    twitter?: string
    website?: string
  }
  stats: Array<{
    label: string
    value: string
  }>
  copyright?: string
  theme?: {
    primaryColor?: string
    accentColor?: string
    backgroundColor?: string
    fontFamily?: string
  }
}

// Career Events table - tracks major career milestones and transitions
export const careerEvents = pgTable(
  'career_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    workExperienceId: uuid('work_experience_id').references(() => workExperiences.id, {
      onDelete: 'cascade',
    }),

    // Event Classification
    eventType: varchar('event_type', { length: 50 }).notNull(),
    eventDate: timestamp('event_date').notNull(),

    // Title/Role Changes
    previousTitle: varchar('previous_title', { length: 255 }),
    newTitle: varchar('new_title', { length: 255 }),
    previousLevel: varchar('previous_level', { length: 50 }),
    newLevel: varchar('new_level', { length: 50 }),

    // Financial Changes
    previousSalary: integer('previous_salary'), // in cents
    newSalary: integer('new_salary'), // in cents
    salaryIncrease: integer('salary_increase'), // calculated field in cents
    increasePercentage: varchar('increase_percentage', { length: 10 }),

    previousTotalComp: integer('previous_total_comp'), // in cents
    newTotalComp: integer('new_total_comp'), // in cents
    totalCompIncrease: integer('total_comp_increase'), // in cents

    // Bonus/Equity Changes
    equityGranted: integer('equity_granted'), // shares or dollar value
    equityVesting: varchar('equity_vesting', { length: 100 }),
    bonusAmount: integer('bonus_amount'), // in cents
    bonusType: varchar('bonus_type', { length: 50 }),

    // Additional Context
    description: text('description'),
    achievements: json('achievements').$type<string[]>().default([]),
    skillsGained: json('skills_gained').$type<string[]>().default([]),
    certifications: json('certifications').$type<string[]>().default([]),

    // Performance Context
    performanceRating: varchar('performance_rating', { length: 50 }),
    managerFeedback: text('manager_feedback'),
    selfAssessment: text('self_assessment'),

    // Market Context
    marketSalaryRange: json('market_salary_range').$type<{
      min: number
      max: number
      median: number
      source: string // "glassdoor", "levels.fyi", "salary.com"
      date: string
    }>(),

    // Goals and Planning
    careerGoals: json('career_goals').$type<{
      shortTerm?: string[]
      longTerm?: string[]
      skillsToAcquire?: string[]
      targetRole?: string
      targetSalary?: number
    }>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('career_events_user_id_idx').on(table.userId),
    index('career_events_work_exp_id_idx').on(table.workExperienceId),
    index('career_events_event_type_idx').on(table.eventType),
    index('career_events_event_date_idx').on(table.eventDate),
    index('career_events_salary_increase_idx').on(table.salaryIncrease),
    // Composite indexes for common queries
    index('career_events_user_date_idx').on(table.userId, table.eventDate),
    index('career_events_user_type_idx').on(table.userId, table.eventType),
    index('career_events_timeline_idx').on(table.userId, table.eventDate, table.eventType),
    // Check constraints
    check(
      'career_events_type_check',
      sql`${table.eventType} IN ('promotion', 'raise', 'bonus', 'equity_grant', 'role_change', 'department_change', 'location_change', 'performance_review', 'goal_achievement', 'certification', 'skill_milestone', 'manager_change', 'team_expansion')`
    ),
    check(
      'career_events_bonus_type_check',
      sql`${table.bonusType} IN ('annual', 'performance', 'retention', 'signing', 'spot', 'referral', 'project')`
    ),
  ]
)
