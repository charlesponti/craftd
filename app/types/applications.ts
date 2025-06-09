import type { JobApplication } from './career'

export type ApplicationWithCompany = JobApplication & {
  company?: string | { name: string; [key: string]: unknown } | null
  applicationDate?: Date | null
  responseDate?: Date | null
  salaryOffered?: number | null
  source?: string | null
}
