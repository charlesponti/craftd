import { sql } from "drizzle-orm";
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
} from "drizzle-orm/pg-core";

// Type definitions for better TypeScript support
export type ProjectStatus = "in-progress" | "completed" | "archived";
export type AnalyticsEvent =
  | "view"
  | "contact_click"
  | "project_click"
  | "skill_click"
  | "social_click"
  | "download_resume"
  | "copy_email";

// Users table - stores basic user information
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    supabaseUserId: varchar("supabase_user_id", { length: 255 }).unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_supabase_user_id_idx").on(table.supabaseUserId),
  ]
);

export const portfolios = pgTable(
  "portfolios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(), // Enforce one portfolio per user
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    isPublic: boolean("is_public").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    // Personal Information (normalized from JSON)
    name: varchar("name", { length: 255 }).notNull(),
    initials: varchar("initials", { length: 10 }),
    jobTitle: varchar("job_title", { length: 255 }).notNull(),
    bio: text("bio").notNull(),
    tagline: varchar("tagline", { length: 500 }).notNull(),

    // Location
    currentLocation: varchar("current_location", { length: 255 }).notNull(),
    locationTagline: varchar("location_tagline", { length: 255 }),

    // Availability
    availabilityStatus: boolean("availability_status").default(false).notNull(),
    availabilityMessage: varchar("availability_message", { length: 500 }),

    // Contact
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),

    // Theme settings (simple object is fine)
    theme: json("theme").$type<{
      primaryColor?: string;
      accentColor?: string;
      backgroundColor?: string;
      fontFamily?: string;
    }>(),

    // Copyright
    copyright: varchar("copyright", { length: 255 }),

    // Profile Image
    profileImageUrl: varchar("profile_image_url", { length: 500 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("portfolio_user_id_idx").on(table.userId),
    index("portfolio_slug_idx").on(table.slug),
    index("portfolio_public_idx").on(table.isPublic),
    index("portfolio_active_idx").on(table.isActive),
    index("portfolio_email_idx").on(table.email),
    // Composite indexes for common queries
    index("portfolio_public_active_idx").on(table.isPublic, table.isActive),
    index("portfolio_user_active_idx").on(table.userId, table.isActive),
  ]
);

// Social Links table - separate table for social media links
export const socialLinks = pgTable(
  "social_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .references(() => portfolios.id, { onDelete: "cascade" })
      .notNull()
      .unique(), // One-to-one relationship with portfolio

    github: varchar("github", { length: 500 }),
    linkedin: varchar("linkedin", { length: 500 }),
    twitter: varchar("twitter", { length: 500 }),
    website: varchar("website", { length: 500 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("social_links_portfolio_id_idx").on(table.portfolioId)]
);

// Portfolio Stats table - separate table for personal stats
export const portfolioStats = pgTable(
  "portfolio_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .references(() => portfolios.id, { onDelete: "cascade" })
      .notNull(),

    label: varchar("label", { length: 255 }).notNull(),
    value: varchar("value", { length: 255 }).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("portfolio_stats_portfolio_id_idx").on(table.portfolioId),
    index("portfolio_stats_sort_order_idx").on(table.sortOrder),
    index("portfolio_stats_portfolio_sort_idx").on(
      table.portfolioId,
      table.sortOrder
    ),
  ]
);

// Work Experience table - stores individual work experiences
export const workExperiences = pgTable(
  "work_experiences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .references(() => portfolios.id, { onDelete: "cascade" })
      .notNull(),

    role: varchar("role", { length: 255 }).notNull(),
    company: varchar("company", { length: 255 }).notNull(),
    description: text("description").notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),

    // Display information
    image: varchar("image", { length: 500 }),
    gradient: varchar("gradient", { length: 100 }),
    metrics: varchar("metrics", { length: 100 }),
    action: varchar("action", { length: 100 }),

    // Tags and metadata
    tags: json("tags").$type<string[]>().default([]),
    metadata: json("metadata").$type<{
      company_size?: string;
      industry?: string;
      location?: string;
      website?: string;
      achievements?: string[];
    }>(),

    // Ordering and display
    sortOrder: integer("sort_order").default(0).notNull(),
    isVisible: boolean("is_visible").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("work_exp_portfolio_id_idx").on(table.portfolioId),
    index("work_exp_sort_order_idx").on(table.sortOrder),
    index("work_exp_visible_idx").on(table.isVisible),
    index("work_exp_created_at_idx").on(table.createdAt),
    // Composite indexes for common queries
    index("work_exp_portfolio_visible_idx").on(
      table.portfolioId,
      table.isVisible
    ),
    index("work_exp_portfolio_sort_idx").on(table.portfolioId, table.sortOrder),
  ]
);

// Skills table - stores individual skills
export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .references(() => portfolios.id, { onDelete: "cascade" })
      .notNull(),

    name: varchar("name", { length: 255 }).notNull(),
    level: integer("level").notNull(), // 1-100
    category: varchar("category", { length: 100 }), // e.g., 'technical', 'leadership', 'design'
    icon: varchar("icon", { length: 100 }), // Icon identifier or class name

    // Additional metadata
    description: text("description"),
    yearsOfExperience: integer("years_of_experience"),
    certifications: json("certifications").$type<string[]>().default([]),

    // Display options
    isVisible: boolean("is_visible").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("skills_portfolio_id_idx").on(table.portfolioId),
    index("skills_category_idx").on(table.category),
    index("skills_sort_order_idx").on(table.sortOrder),
    index("skills_visible_idx").on(table.isVisible),
    index("skills_level_idx").on(table.level),
    // Composite indexes for common queries
    index("skills_portfolio_visible_idx").on(
      table.portfolioId,
      table.isVisible
    ),
    index("skills_portfolio_category_idx").on(
      table.portfolioId,
      table.category
    ),
    index("skills_portfolio_sort_idx").on(table.portfolioId, table.sortOrder),
    // Check constraints
    check(
      "skills_level_check",
      sql`${table.level} >= 1 AND ${table.level} <= 100`
    ),
  ]
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .references(() => portfolios.id, { onDelete: "cascade" })
      .notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    shortDescription: varchar("short_description", { length: 500 }),

    // Links and media
    liveUrl: varchar("live_url", { length: 500 }),
    githubUrl: varchar("github_url", { length: 500 }),
    imageUrl: varchar("image_url", { length: 500 }),
    videoUrl: varchar("video_url", { length: 500 }),

    // Technical details
    technologies: json("technologies").$type<string[]>().default([]),
    status: varchar("status", { length: 50 }).default("completed").notNull(),

    // Timeline
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),

    // Display options
    isFeatured: boolean("is_featured").default(false).notNull(),
    isVisible: boolean("is_visible").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("projects_portfolio_id_idx").on(table.portfolioId),
    index("projects_status_idx").on(table.status),
    index("projects_featured_idx").on(table.isFeatured),
    index("projects_sort_order_idx").on(table.sortOrder),
    // Composite indexes for common queries
    index("projects_portfolio_featured_visible_idx").on(
      table.portfolioId,
      table.isFeatured,
      table.isVisible
    ),
    index("projects_portfolio_visible_idx").on(
      table.portfolioId,
      table.isVisible
    ),
    // Check constraints
    check(
      "projects_status_check",
      sql`${table.status} IN ('in-progress', 'completed', 'archived')`
    ),
  ]
);

// Testimonials table - for recommendations and testimonials
export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .references(() => portfolios.id, { onDelete: "cascade" })
      .notNull(),

    name: varchar("name", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }),
    company: varchar("company", { length: 255 }),
    content: text("content").notNull(),

    // Contact and media
    avatarUrl: varchar("avatar_url", { length: 500 }),
    linkedinUrl: varchar("linkedin_url", { length: 500 }),

    // Rating and validation
    rating: integer("rating"), // 1-5 stars
    isVerified: boolean("is_verified").default(false).notNull(),

    // Display options
    isVisible: boolean("is_visible").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("testimonials_portfolio_id_idx").on(table.portfolioId),
    index("testimonials_rating_idx").on(table.rating),
    index("testimonials_sort_order_idx").on(table.sortOrder),
    // Composite indexes for common queries
    index("testimonials_portfolio_verified_idx").on(
      table.portfolioId,
      table.isVerified,
      table.isVisible
    ),
    index("testimonials_portfolio_visible_idx").on(
      table.portfolioId,
      table.isVisible
    ),
    // Check constraints
    check(
      "testimonials_rating_check",
      sql`${table.rating} >= 1 AND ${table.rating} <= 5`
    ),
  ]
);

// Analytics table - for tracking portfolio views and engagement
export const analytics = pgTable(
  "analytics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .references(() => portfolios.id, { onDelete: "cascade" })
      .notNull(),

    // Event tracking
    event: varchar("event", { length: 100 }).notNull(),
    path: varchar("path", { length: 500 }),

    // Visitor information
    visitorId: varchar("visitor_id", { length: 100 }), // Anonymous visitor tracking
    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: text("user_agent"),
    referer: varchar("referer", { length: 500 }),

    // Geolocation
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 100 }),

    // Additional metadata
    metadata: json("metadata").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("analytics_portfolio_id_idx").on(table.portfolioId),
    index("analytics_event_idx").on(table.event),
    index("analytics_visitor_id_idx").on(table.visitorId),
    // Composite indexes for common dashboard queries
    index("analytics_portfolio_event_date_idx").on(
      table.portfolioId,
      table.event,
      table.createdAt
    ),
    index("analytics_portfolio_date_idx").on(
      table.portfolioId,
      table.createdAt
    ),
    // Check constraint for valid events
    check(
      "analytics_event_check",
      sql`${table.event} IN ('view', 'contact_click', 'project_click', 'skill_click', 'social_click', 'download_resume', 'copy_email')`
    ),
  ]
);

// Type exports for Drizzle ORM tables
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;

export type SocialLinks = typeof socialLinks.$inferSelect;
export type NewSocialLinks = typeof socialLinks.$inferInsert;

export type PortfolioStats = typeof portfolioStats.$inferSelect;
export type NewPortfolioStats = typeof portfolioStats.$inferInsert;

export type WorkExperience = typeof workExperiences.$inferSelect;
export type NewWorkExperience = typeof workExperiences.$inferInsert;

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;

export type Analytics = typeof analytics.$inferSelect;
export type NewAnalytics = typeof analytics.$inferInsert;

// Composite types for portfolio with relations
export interface PortfolioWithRelations extends Portfolio {
  socialLinks?: SocialLinks;
  stats: PortfolioStats[];
  workExperience: WorkExperience[];
  skills: Skill[];
  projects?: Project[];
  testimonials?: Testimonial[];
}

// Legacy PersonalInfo interface (for backward compatibility during migration)
export interface PersonalInfo {
  name: string;
  initials?: string;
  title: string;
  bio: string;
  tagline: string;
  location: {
    current: string;
    tagline?: string;
  };
  availability: {
    status: boolean;
    message?: string;
  };
  contact: {
    email: string;
    phone?: string;
  };
  social: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  stats: Array<{
    label: string;
    value: string;
  }>;
  copyright?: string;
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
  };
}
