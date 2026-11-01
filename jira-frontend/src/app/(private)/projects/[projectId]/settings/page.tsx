import { ProjectSettingsPage } from '@/features/projects'

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params

  return <ProjectSettingsPage projectId={projectId} />
}
