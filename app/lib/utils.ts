import { cva } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(cva([...inputs], { variants: {} })());
}

// Form utilities for handling nullable database values

/**
 * Helper function to format dates for HTML date inputs
 * Converts Date objects or date strings to YYYY-MM-DD format
 */
export const formatDateForInput = (
  date: string | Date | null | undefined
): string | undefined => {
  if (!date) return undefined;
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(dateObj.getTime())) return undefined;
    return dateObj.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
  } catch {
    return undefined;
  }
};

/**
 * Helper function to safely convert nullable string to undefined
 * Useful for form default values where null should become undefined
 */
export const nullToUndefined = (
  value: string | null | undefined
): string | undefined => {
  return value === null ? undefined : value;
};

/**
 * Helper function to safely convert nullable array to undefined
 * Useful for form default values where null arrays should become undefined
 */
export const nullArrayToUndefined = (
  value: string[] | null | undefined
): string[] | undefined => {
  return value === null ? undefined : value;
};

/**
 * Helper function to safely convert nullable object to undefined
 * Useful for form default values where null objects should become undefined
 */
export const nullObjectToUndefined = (
  value: Record<string, unknown> | null | undefined
): Record<string, unknown> | undefined => {
  return value === null ? undefined : value;
};

/**
 * Helper function to convert date string to Date object
 * Returns undefined for invalid dates
 */
export const stringToDate = (dateString?: string): Date | undefined => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? undefined : date;
};
