import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  portfolios,
  socialLinks,
  portfolioStats,
  workExperiences,
  skills,
  projects,
  testimonials,
  type Portfolio,
  type SocialLinks,
  type PortfolioStats,
  type WorkExperience,
  type Skill,
  type Project,
  type Testimonial,
} from "./db/schema";

export interface FullPortfolio extends Portfolio {
  socialLinks: SocialLinks | null;
  portfolioStats: PortfolioStats[];
  workExperiences: WorkExperience[];
  skills: Skill[];
  projects: Project[];
  testimonials: Testimonial[];
}

export async function getFullUserPortfolio(
  userId: string
): Promise<FullPortfolio | null> {
  // Get the main portfolio
  const portfolio = await db
    .select()
    .from(portfolios)
    .where(eq(portfolios.userId, userId))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!portfolio) {
    return null;
  }

  // Get all related data in parallel
  const [
    socialLinksData,
    portfolioStatsData,
    workExperiencesData,
    skillsData,
    projectsData,
    testimonialsData,
  ] = await Promise.all([
    db
      .select()
      .from(socialLinks)
      .where(eq(socialLinks.portfolioId, portfolio.id)),
    db
      .select()
      .from(portfolioStats)
      .where(eq(portfolioStats.portfolioId, portfolio.id)),
    db
      .select()
      .from(workExperiences)
      .where(eq(workExperiences.portfolioId, portfolio.id)),
    db.select().from(skills).where(eq(skills.portfolioId, portfolio.id)),
    db.select().from(projects).where(eq(projects.portfolioId, portfolio.id)),
    db
      .select()
      .from(testimonials)
      .where(eq(testimonials.portfolioId, portfolio.id)),
  ]);

  return {
    ...portfolio,
    socialLinks: socialLinksData[0] ?? null,
    portfolioStats: portfolioStatsData,
    workExperiences: workExperiencesData,
    skills: skillsData,
    projects: projectsData,
    testimonials: testimonialsData,
  };
}
