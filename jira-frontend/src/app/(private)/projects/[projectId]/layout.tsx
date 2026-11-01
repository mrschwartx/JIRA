import type { ReactNode } from 'react'
import { ProjectShell } from '@/features/projects'

type LayoutProps = {
  children: ReactNode
  params: Promise<{ projectId: string }>
}

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const { projectId } = await params

  return <ProjectShell projectId={projectId}>{children}</ProjectShell>
}
