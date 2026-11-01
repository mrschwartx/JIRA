import { notFound } from 'next/navigation'
import { BoardPage } from '@/features/issues'

type PageProps = {
  params: Promise<{ projectId: string; slug?: string[] }>
}

export default async function Page({ params }: PageProps) {
  const { projectId, slug } = await params

  if (!slug || slug.length === 0) {
    return <BoardPage projectId={projectId} />
  }

  const [segment, issueId, ...rest] = slug
  if (segment !== 'issues' || !issueId || rest.length > 0) {
    notFound()
  }

  return <BoardPage projectId={projectId} issueId={issueId} />
}
