import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import type { Project, NewProject } from '~/lib/db/schema'

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

const ProjectsEditorSection = ({
  projects: initialProjects,
  portfolioId,
}: ProjectsEditorSectionProps) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields },
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

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const onSubmit = async (formData: ProjectsFormValues) => {
    if (!isDirty) {
      alert('No project changes to save.')
      return
    }
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)
    try {
      // Transform technologies to array
      const projectsToSave = formData.projects.map((p) => ({
        ...p,
        technologies:
          typeof p.technologies === 'string'
            ? p.technologies
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        portfolioId,
      }))
      const fd = new FormData()
      fd.append('projectsData', JSON.stringify(projectsToSave))
      const res = await fetch('/editor.projects', { method: 'POST', body: fd })
      const result: { success?: boolean; error?: string } = await res.json()
      if (result.success) {
        setSaveSuccess('Projects saved successfully!')
      } else {
        setSaveError(result.error || 'Failed to save projects.')
      }
    } catch (err) {
      setSaveError((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const isLoading = isSaving

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
    <section className="p-6 bg-white shadow-md rounded-lg mt-8">
      <h2 className="text-2xl font-semibold mb-4">Projects</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-md space-y-3">
            <input {...register(`projects.${index}.id` as const)} type="hidden" />
            <div>
              <label htmlFor={`project-${index}-title`}>Title</label>
              <input
                id={`project-${index}-title`}
                {...register(`projects.${index}.title` as const, { required: true })}
                className="mt-1 block w-full input-class"
              />
            </div>
            <div>
              <label htmlFor={`project-${index}-shortDescription`}>Short Description</label>
              <input
                id={`project-${index}-shortDescription`}
                {...register(`projects.${index}.shortDescription` as const)}
                className="mt-1 block w-full input-class"
              />
            </div>
            <div>
              <label htmlFor={`project-${index}-description`}>Full Description</label>
              <textarea
                id={`project-${index}-description`}
                {...register(`projects.${index}.description` as const, { required: true })}
                rows={3}
                className="mt-1 block w-full input-class"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`project-${index}-liveUrl`}>Live URL</label>
                <input
                  id={`project-${index}-liveUrl`}
                  type="url"
                  {...register(`projects.${index}.liveUrl` as const)}
                  className="mt-1 block w-full input-class"
                />
              </div>
              <div>
                <label htmlFor={`project-${index}-githubUrl`}>GitHub URL</label>
                <input
                  id={`project-${index}-githubUrl`}
                  type="url"
                  {...register(`projects.${index}.githubUrl` as const)}
                  className="mt-1 block w-full input-class"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`project-${index}-imageUrl`}>Image URL</label>
                <input
                  id={`project-${index}-imageUrl`}
                  type="url"
                  {...register(`projects.${index}.imageUrl` as const)}
                  className="mt-1 block w-full input-class"
                />
              </div>
              <div>
                <label htmlFor={`project-${index}-videoUrl`}>Video URL</label>
                <input
                  id={`project-${index}-videoUrl`}
                  type="url"
                  {...register(`projects.${index}.videoUrl` as const)}
                  className="mt-1 block w-full input-class"
                />
              </div>
            </div>
            <div>
              <label htmlFor={`project-${index}-technologies`}>
                Technologies (comma-separated)
              </label>
              <input
                id={`project-${index}-technologies`}
                {...register(`projects.${index}.technologies` as const)}
                className="mt-1 block w-full input-class"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor={`project-${index}-status`}>Status</label>
                <input
                  id={`project-${index}-status`}
                  {...register(`projects.${index}.status` as const)}
                  className="mt-1 block w-full input-class"
                />
              </div>
              <div>
                <label htmlFor={`project-${index}-startDate`}>Start Date</label>
                <input
                  id={`project-${index}-startDate`}
                  type="date"
                  {...register(`projects.${index}.startDate` as const)}
                  className="mt-1 block w-full input-class"
                />
              </div>
              <div>
                <label htmlFor={`project-${index}-endDate`}>End Date</label>
                <input
                  id={`project-${index}-endDate`}
                  type="date"
                  {...register(`projects.${index}.endDate` as const)}
                  className="mt-1 block w-full input-class"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveProject(index)}
              disabled={isSaving}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove Project
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddNewProject}
          className="mb-6 py-2 px-4 border border-dashed rounded-md text-sm"
        >
          + Add New Project
        </button>
        <div>
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="w-full py-2 px-4 btn-primary disabled:bg-gray-400"
          >
            Save All Project Changes
          </button>
        </div>
      </form>
      {saveSuccess && <p className="text-green-500 mt-4">{saveSuccess}</p>}
      {saveError && <p className="text-red-500 mt-4">{saveError}</p>}
    </section>
  )
}

export default ProjectsEditorSection
