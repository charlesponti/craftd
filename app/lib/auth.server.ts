/**
 * Server-side authentication utilities for React Router V7
 * Migrated from Svelte auth.server.ts
 */

import { db } from "./db";
import { users } from "./db/schema";
import { createServerSupabaseClient } from "./supabase.server";
import {
  createTestUser,
  defaultTestUser,
  defaultTestPortfolio,
} from "./test/mock-data";
import { redirect } from "react-router";
import { eq } from "drizzle-orm";

export interface User {
  id: string;
  email: string;
  name: string;
  supabaseUser?: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  };
}

/**
 * Get the authenticated user from request
 */
export async function getAuthenticatedUser(
  request: Request
): Promise<User | null> {
  try {
    // Check for test auth cookie first (e2e testing)
    const cookieHeader = request.headers.get("Cookie");
    const testAuthCookie = cookieHeader
      ?.split(";")
      .find((c) => c.trim().startsWith("test-auth-user="))
      ?.split("=")[1];

    if (testAuthCookie) {
      try {
        const testUserData = JSON.parse(decodeURIComponent(testAuthCookie));
        // Create test user with any overrides from cookie
        const testUser = createTestUser(testUserData);
        return testUser;
      } catch (e) {
        console.error("Error parsing test auth cookie:", e);
        return defaultTestUser;
      }
    }

    const supabase = createServerSupabaseClient(request);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Get or create user in our database
    const email = user.email;
    if (!email) return null;

    let dbUser = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Create user if doesn't exist
    if (dbUser.length === 0) {
      const newUser = await db
        .insert(users)
        .values({
          email,
          name: user.user_metadata?.full_name || "User",
          supabaseUserId: user.id,
        })
        .returning({ id: users.id, email: users.email, name: users.name });

      dbUser = newUser;
    }

    return {
      id: dbUser[0].id,
      email: dbUser[0].email,
      name: dbUser[0].name,
      supabaseUser: user,
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

/**
 * Require authentication - redirect to home if not authenticated
 */
export function requireAuth(user: User | null): User {
  if (!user) {
    throw redirect("/");
  }
  return user;
}

/**
 * Redirect if already authenticated
 */
export function redirectIfAuthenticated(
  user: User | null,
  redirectTo = "/account"
) {
  if (user) {
    throw redirect(redirectTo);
  }
}

/**
 * Get mock portfolio data for test users
 */
export function getMockPortfolioData(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  const testAuthCookie = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("test-auth-user="))
    ?.split("=")[1];

  if (testAuthCookie) {
    try {
      const testUserData = JSON.parse(decodeURIComponent(testAuthCookie));
      const userId = testUserData.id || "00000000-0000-0000-0000-000000000000";

      const mockPortfolio = defaultTestPortfolio;
      const portfolioId = "test-portfolio-id";

      return {
        portfolio: {
          ...mockPortfolio,
          id: portfolioId,
          userId,
        },
        completePortfolio: {
          ...mockPortfolio,
          id: portfolioId,
          userId,
          workExperience: mockPortfolio.workExperience.map((we) => ({
            ...we,
            portfolioId,
          })),
          skills: mockPortfolio.skills.map((skill) => ({
            ...skill,
            portfolioId,
          })),
        },
        workExperience: mockPortfolio.workExperience.map((we) => ({
          ...we,
          portfolioId,
        })),
        skills: mockPortfolio.skills.map((skill) => ({
          ...skill,
          portfolioId,
        })),
      };
    } catch (e) {
      console.error("Error parsing test auth cookie for portfolio data:", e);
    }
  }

  return null;
}
