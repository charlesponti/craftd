import { ArrowLeftIcon, CheckIcon, PencilIcon, PlusIcon, TrashIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { useLoaderData, useNavigate } from 'react-router'
import { Button } from '~/components/ui/button'
import type { WorkExperience } from '~/lib/db/schema'
import { createSuccessResponse, withAuthLoader } from '~/lib/route-utils'

interface LoaderData {
  workExperience: WorkExperience
}

export async function loader(args: LoaderFunctionArgs) {
  return withAuthLoader(args, async ({ user }) => {
    const { id } = args.params
    if (!id) {
      throw new Response('Work experience ID is required', { status: 400 })
    }

    try {
      const { getWorkExperienceById } = await import('~/lib/db/queries/base')
      const workExperience = await getWorkExperienceById(user.id, id)

      if (!workExperience) {
        throw new Response('Work experience not found', { status: 404 })
      }

      return createSuccessResponse({ workExperience })
    } catch (error) {
      console.error('Error loading work experience:', error)
      throw new Response('Error loading work experience', { status: 500 })
    }
  })
}

export async function action(args: ActionFunctionArgs) {
  return withAuthLoader(args, async ({ user, request }) => {
    const { id } = args.params
    if (!id) {
      throw new Response('Work experience ID is required', { status: 400 })
    }

    const formData = await request.formData()
    const actionType = formData.get('actionType') as string

    try {
      const { updateWorkExperience, getWorkExperienceById } = await import('~/lib/db/queries/base')
      const currentExperience = await getWorkExperienceById(user.id, id)

      if (!currentExperience) {
        throw new Response('Work experience not found', { status: 404 })
      }

      const currentMetadata = currentExperience.metadata || {}
      const currentProjects = currentMetadata.projects || []

      if (actionType === 'add') {
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const status = formData.get('status') as string
        const technologies = formData.get('technologies') as string
        const impact = formData.get('impact') as string

        const newProject = {
          id: Date.now().toString(), // Simple ID for now
          title,
          description,
          status,
          technologies: technologies ? technologies.split(',').map((t) => t.trim()) : [],
          impact,
          createdAt: new Date().toISOString(),
        }

        const updatedProjects = [...currentProjects, newProject]
        const updatedMetadata = {
          ...currentMetadata,
          projects: updatedProjects,
        }

        await updateWorkExperience(user.id, id, { metadata: updatedMetadata })
      } else if (actionType === 'update') {
        const projectId = formData.get('projectId') as string
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const status = formData.get('status') as string
        const technologies = formData.get('technologies') as string
        const impact = formData.get('impact') as string

        const updatedProjects = currentProjects.map((project: any) =>
          project.id === projectId
            ? {
                ...project,
                title,
                description,
                status,
                technologies: technologies ? technologies.split(',').map((t) => t.trim()) : [],
                impact,
                updatedAt: new Date().toISOString(),
              }
            : project
        )

        const updatedMetadata = {
          ...currentMetadata,
          projects: updatedProjects,
        }

        await updateWorkExperience(user.id, id, { metadata: updatedMetadata })
      } else if (actionType === 'delete') {
        const projectId = formData.get('projectId') as string

        const updatedProjects = currentProjects.filter((project: any) => project.id !== projectId)
        const updatedMetadata = {
          ...currentMetadata,
          projects: updatedProjects,
        }

        await updateWorkExperience(user.id, id, { metadata: updatedMetadata })
      }

      return createSuccessResponse({ success: true })
    } catch (error) {
      console.error('Error updating projects:', error)
      throw new Response('Error updating projects', { status: 500 })
    }
  })
}

export default function WorkExperienceProjects() {
  const response = useLoaderData<{ success: boolean; data: LoaderData }>()
  const data = response?.data || {}
  const { workExperience } = data
  const navigate = useNavigate()
  const [showAddForm, setShowAddForm] = useState(false)

  if (!workExperience) {
    return <div>Work experience not found</div>
  }

  const projects = workExperience.metadata?.projects || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="border-b border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={() => navigate(`/career/experience/${workExperience.id}`)}
              variant="ghost"
              size="sm"
              className="p-2"
              data-testid="back-button"
            >
              <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-light text-slate-900 font-serif">
                Projects & Work Items
              </h1>
              <p className="text-lg text-slate-600 font-sans">
                {workExperience.role} at {workExperience.company}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Add Project Form */}
          {showAddForm && (
            <ProjectForm
              workExperienceId={workExperience.id}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Projects List */}
          {projects.length > 0 ? (
            projects.map((project: any) => (
              <ProjectCard
                key={project.id}
                project={project}
                workExperienceId={workExperience.id}
              />
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/50 text-center">
              <div className="text-slate-400 mb-4">
                <PlusIcon className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No projects yet</h3>
              <p className="text-slate-600 mb-4">
                Start tracking your work items, projects, and achievements for interview
                preparation.
              </p>
              <Button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Your First Project
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ProjectFormProps {
  workExperienceId: string
  project?: any
  onCancel: () => void
}

function ProjectForm({ workExperienceId, project, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    status: project?.status || 'in-progress',
    technologies: project?.technologies?.join(', ') || '',
    impact: project?.impact || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const form = document.createElement('form')
    form.method = 'POST'
    form.style.display = 'none'

    const actionInput = document.createElement('input')
    actionInput.name = 'actionType'
    actionInput.value = project ? 'update' : 'add'
    form.appendChild(actionInput)

    if (project) {
      const projectIdInput = document.createElement('input')
      projectIdInput.name = 'projectId'
      projectIdInput.value = project.id
      form.appendChild(projectIdInput)
    }

    Object.entries(formData).forEach(([key, value]) => {
      const input = document.createElement('input')
      input.name = key
      input.value = value
      form.appendChild(input)
    })

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/50">
      <h2 className="text-2xl font-light text-slate-900 font-serif mb-6">
        {project ? 'Edit Project' : 'Add New Project'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
            Project Title
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., User Authentication System, Data Migration Pipeline"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            rows={4}
            placeholder="Describe what you did, the challenges you solved, and your role in the project"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="planning">Planning</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="technologies" className="block text-sm font-medium text-slate-700 mb-2">
              Technologies Used
            </label>
            <input
              type="text"
              id="technologies"
              value={formData.technologies}
              onChange={(e) => setFormData((prev) => ({ ...prev, technologies: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="React, Node.js, PostgreSQL, AWS"
            />
          </div>
        </div>

        <div>
          <label htmlFor="impact" className="block text-sm font-medium text-slate-700 mb-2">
            Impact & Results
          </label>
          <textarea
            id="impact"
            value={formData.impact}
            onChange={(e) => setFormData((prev) => ({ ...prev, impact: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            placeholder="What was the outcome? Include metrics if possible (e.g., reduced load time by 40%, improved user conversion by 15%)"
          />
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            <CheckIcon className="w-4 h-4 mr-1" />
            {project ? 'Update Project' : 'Save Project'}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            className="text-slate-600 hover:bg-slate-100"
          >
            <XIcon className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

interface ProjectCardProps {
  project: any
  workExperienceId: string
}

function ProjectCard({ project, workExperienceId }: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false)

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this project?')) {
      const form = document.createElement('form')
      form.method = 'POST'
      form.style.display = 'none'

      const actionInput = document.createElement('input')
      actionInput.name = 'actionType'
      actionInput.value = 'delete'
      form.appendChild(actionInput)

      const projectIdInput = document.createElement('input')
      projectIdInput.name = 'projectId'
      projectIdInput.value = project.id
      form.appendChild(projectIdInput)

      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'planning':
        return 'bg-yellow-100 text-yellow-800'
      case 'on-hold':
        return 'bg-orange-100 text-orange-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isEditing) {
    return (
      <ProjectForm
        workExperienceId={workExperienceId}
        project={project}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-medium text-slate-900 mb-2">{project.title}</h3>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
          >
            {project.status.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setIsEditing(true)}
            variant="ghost"
            size="sm"
            className="p-2 text-slate-400 hover:text-slate-600"
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            variant="ghost"
            size="sm"
            className="p-2 text-red-400 hover:text-red-600"
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Description</h4>
          <p className="text-slate-600">{project.description}</p>
        </div>

        {project.technologies && project.technologies.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Technologies</h4>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech: string, index: number) => (
                <span
                  key={`${project.id}-tech-${index}`}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {project.impact && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Impact & Results</h4>
            <p className="text-slate-600">{project.impact}</p>
          </div>
        )}

        {project.createdAt && (
          <div className="text-xs text-slate-400">
            Added {new Date(project.createdAt).toLocaleDateString()}
            {project.updatedAt &&
              project.updatedAt !== project.createdAt &&
              `, updated ${new Date(project.updatedAt).toLocaleDateString()}`}
          </div>
        )}
      </div>
    </div>
  )
}
