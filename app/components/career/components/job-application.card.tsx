import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card'
import type { JobApplication } from '~/types/career'
import { useUpdateApplication } from './use-job-applications'

export const JobApplicationCard = ({
  application: app,
  setSelectedApp,
}: {
  setSelectedApp: (app: JobApplication) => void
  application: JobApplication & { company?: string }
}) => {
  const { updateApplication } = useUpdateApplication()

  async function onStatusSelect(status: JobApplication['status']) {
    await updateApplication.mutateAsync({ status, id: app.id })
  }

  return (
    <Card key={app.id} className="mb-4">
      <CardHeader>
        <CardTitle className="flex flex-col gap-2">
          <span>{app.position}</span>
          <span className="text-sm italic rounded-2xl border border-gray-500 px-2 max-w-fit text-gray-500">
            {app.company}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="md:grid md:grid-cols-2 gap-4 space-y-4">
          <div className="col-span-2 flex items-center justify-end gap-2">
            <p className="font-medium">Current Status:</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {app.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-gray-400 italic">{new Date(app.startDate).toLocaleDateString()}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setSelectedApp(app)}>
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
