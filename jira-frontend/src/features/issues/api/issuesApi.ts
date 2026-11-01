import { http } from '@/shared/api'
import type { CreateIssueValues, Issue, UpdateIssueChanges } from '../types'

const base = (projectId: string) => `/projects/${projectId}/issues`

export const issuesApi = {
  list: (projectId: string, signal?: AbortSignal) => http.get<Issue[]>(base(projectId), { signal }),
  search: (projectId: string, term: string, signal?: AbortSignal) =>
    http.get<Issue[]>(base(projectId), { searchParams: { search: term }, signal }),
  create: (projectId: string, values: CreateIssueValues) => http.post<Issue>(base(projectId), values),
  update: (projectId: string, issueId: string, changes: UpdateIssueChanges) =>
    http.patch<Issue>(`${base(projectId)}/${issueId}`, changes),
  remove: (projectId: string, issueId: string) => http.delete<null>(`${base(projectId)}/${issueId}`),
}
