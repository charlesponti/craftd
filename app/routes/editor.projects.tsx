import { and, eq, inArray } from 'drizzle-orm'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import type { ActionFunctionArgs, MetaFunction } from 'react-router'
import { useFetcher, useOutletContext } from 'react-router'
import { db } from '~/lib/db'
import { projects, type NewProject, type Project } from '~/lib/db/schema'
import { useToast } from '../hooks/useToast'
import type { FullPortfolio } from '../lib/portfolio.server'
import {
  createErrorResponse,
  createSuccessResponse,
  parseFormData,
  tryAsync,
  withAuthAction,
} from '../lib/route-utils'

export const meta: MetaFunction = () => [{ title: 'Projects - Portfolio Editor | Craftd' }]

interface ProjectFormData extends Omit<NewProject, 'technologies'> {
  technologies?: string
}

interface ProjectsFormValues {
  projects: Partial<ProjectFormData>[]
}

interface ProjectsEditorSectionProps {
  projects?: Project[] | null
  portfolioId: string
}

function ProjectsEditorSection({
  projects: initialProjects,
  portfolioId,
}: ProjectsEditorSectionProps) {
  const fetcher = useFetcher()
  const { addToast } = useToast()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<ProjectsFormValues>({
    defaultValues: {
      projects: (initialProjects || []).map((p) => ({
        ...p,
        technologies: Array.isArray(p.technologies) ? p.technologies.join(', ') : '',
      })),
    },
    mode: 'onChange',
  })

  useEffect(() => {
    reset({
      projects: (initialProjects || []).map((p) => ({
        ...p,
        technologies: Array.isArray(p.technologies) ? p.technologies.join(', ') : '',
      })),
    })
  }, [initialProjects, reset])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'projects',
  })

  // Handle fetcher errors and success
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const result = fetcher.data as { success: boolean; error?: string; message?: string }
      if (result.success) {
        addToast(result.message || 'Projects saved successfully!', 'success')
      } else {
        addToast(`Failed to save projects: ${result.error || 'Unknown error'}`, 'error')
      }
    }
  }, [fetcher.state, fetcher.data, addToast])

  const onSubmit = (formData: ProjectsFormValues) => {
    if (!isDirty) {
      addToast('No project changes to save.', 'info')
      return
    }

    // Transform technologies to array and clean up data
    const projectsToSave = formData.projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      shortDescription: p.shortDescription,
      liveUrl: p.liveUrl,
      githubUrl: p.githubUrl,
      imageUrl: p.imageUrl,
      videoUrl: p.videoUrl,
      technologies:
        typeof p.technologies === 'string'
          ? p.technologies
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      isFeatured: p.isFeatured,
      isVisible: p.isVisible,
      sortOrder: p.sortOrder,
      portfolioId,
    }))

    const formData2 = new FormData()
    formData2.append('projectsData', JSON.stringify(projectsToSave))

    fetcher.submit(formData2, {
      method: 'POST',
      action: '/editor/projects',
    })
  }

  const isSaving = fetcher.state === 'submitting'

  const handleAddNewProject = () => {
    append({
      title: '',
      description: '',
      shortDescription: '',
      liveUrl: '',
      githubUrl: '',
      imageUrl: '',
      videoUrl: '',
      technologies: '',
      status: 'completed',
      startDate: undefined,
      endDate: undefined,
      isFeatured: false,
      isVisible: true,
      sortOrder: 0,
      portfolioId,
    })
  }

  const handleRemoveProject = (index: number) => {
    remove(index)
  }

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-2xl">
        <h2 className="text-2xl font-semibold text-foreground">Projects</h2>
        <div className="flex gap-sm">
          <button type="button" onClick={handleAddNewProject} className="btn btn-outline btn-sm">
            Add New Project
          </button>
          <button
            type="submit"
            form="projects-form"
            disabled={isSaving || !isDirty}
            className="btn btn-primary btn-sm"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      <form id="projects-form" onSubmit={handleSubmit(onSubmit)} className="space-y-lg">
        {fields.map((field, index) => (
          <div key={field.id} className="card-sm bg-muted/50 space-y-lg">
            <input {...register(`projects.${index}.id` as const)} type="hidden" />
            <div className="form-group">
              <label htmlFor={`project-${index}-title`} className="label">
                Title
              </label>
              <input
                id={`project-${index}-title`}
                {...register(`projects.${index}.title` as const, { required: true })}
                className="input"
              />
            </div>
            <div className="form-group">
              <label htmlFor={`project-${index}-shortDescription`} className="label">
                Short Description
              </label>
              <input
                id={`project-${index}-shortDescription`}
                {...register(`projects.${index}.shortDescription` as const)}
                className="input"
              />
            </div>
            <div className="form-group">
              <label htmlFor={`project-${index}-description`} className="label">
                Full Description
              </label>
              <textarea
                id={`project-${index}-description`}
                {...register(`projects.${index}.description` as const, { required: true })}
                rows={3}
                className="textarea"
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label htmlFor={`project-${index}-liveUrl`} className="label">
                  Live URL
                </label>
                <input
                  id={`project-${index}-liveUrl`}
                  type="url"
                  {...register(`projects.${index}.liveUrl` as const)}
                  className="input"
                />
              </div>
              <div className="form-group">
                <label htmlFor={`project-${index}-githubUrl`} className="label">
                  GitHub URL
                </label>
                <input
                  id={`project-${index}-githubUrl`}
                  type="url"
                  {...register(`projects.${index}.githubUrl` as const)}
                  className="input"
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label htmlFor={`project-${index}-imageUrl`} className="label">
                  Image URL
                </label>
                <input
                  id={`project-${index}-imageUrl`}
                  type="url"
                  {...register(`projects.${index}.imageUrl` as const)}
                  className="input"
                />
              </div>
              <div className="form-group">
                <label htmlFor={`project-${index}-videoUrl`} className="label">
                  Video URL
                </label>
                <input
                  id={`project-${index}-videoUrl`}
                  type="url"
                  {...register(`projects.${index}.videoUrl` as const)}
                  className="input"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor={`project-${index}-technologies`} className="label">
                Technologies (comma-separated)
              </label>
              <input
                id={`project-${index}-technologies`}
                {...register(`projects.${index}.technologies` as const)}
                className="input"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveProject(index)}
              className="btn btn-destructive btn-sm"
            >
              Remove
            </button>
          </div>
        ))}
      </form>
    </section>
  )
}

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
