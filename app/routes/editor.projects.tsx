import type { MetaFunction, ActionFunctionArgs } from 'react-router'
import {
  withAuthAction,
  createErrorResponse,
  createSuccessResponse,
  tryAsync,
  parseFormData,
} from '../lib/route-utils'
import { db } from '~/lib/db'
import { projects } from '~/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import type { Project } from '~/lib/db/schema'
import { useOutletContext } from 'react-router'
import type { FullPortfolio } from '../lib/portfolio.server'
import ProjectsEditorSection from '../components/Editor/ProjectsEditorSection'

export const meta: MetaFunction = () => [{ title: 'Projects - Portfolio Editor | Craftd' }]

export async function action(args: ActionFunctionArgs) {
  return withAuthAction(args, async ({ user }) => {
    const formData = await args.request.formData()
    // Expecting a JSON array of projects under 'projectsData'
    const projectsDataResult = parseFormData<Project[]>(formData, 'projectsData')
    if ('success' in projectsDataResult && !projectsDataResult.success) {
      return projectsDataResult
    }
    let projectsData = projectsDataResult as Project[]
    if (!Array.isArray(projectsData)) {
      return createErrorResponse('Invalid projects data')
    }
    // Ensure all projects have portfolioId
    const portfolioId = projectsData[0]?.portfolioId
    if (!portfolioId) return createErrorResponse('Missing portfolioId')
    projectsData = projectsData.map((p) => ({ ...p, portfolioId }))
    return tryAsync(async () => {
      // Fetch existing projects for this portfolio
      const existingProjects = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.portfolioId, portfolioId))
      const existingIds = (existingProjects || []).map((p) => p.id)
      const submittedIds = projectsData.filter((p) => p.id).map((p) => p.id)
      // Delete removed projects
      const idsToDelete = existingIds.filter((id: string) => !submittedIds.includes(id))
      if (idsToDelete.length > 0) {
        await db
          .delete(projects)
          .where(and(eq(projects.portfolioId, portfolioId), inArray(projects.id, idsToDelete)))
      }
      // Upsert (insert/update) all submitted projects
      for (const proj of projectsData) {
        if (proj.id) {
          // Update
          const { id, ...updateData } = proj
          await db
            .update(projects)
            .set(updateData)
            .where(and(eq(projects.id, id), eq(projects.portfolioId, portfolioId)))
        } else {
          // Insert
          await db.insert(projects).values({ ...proj, portfolioId })
        }
      }
      return createSuccessResponse(null, 'Projects saved successfully')
    }, 'Failed to save projects')
  })
}

export default function EditorProjects() {
  // Consume portfolio from parent editor layout loader via outlet context
  const portfolio = useOutletContext<FullPortfolio>()

  return <ProjectsEditorSection projects={portfolio.projects} portfolioId={portfolio.id} />
}
