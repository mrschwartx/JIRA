import { http } from '@/shared/api'
import type { Comment } from '../types'

const base = (projectId: string, issueId: string) => `/projects/${projectId}/issues/${issueId}/comments`

export const commentsApi = {
  list: (projectId: string, issueId: string, signal?: AbortSignal) => http.get<Comment[]>(base(projectId, issueId), { signal }),
  create: (projectId: string, issueId: string, body: string) => http.post<Comment>(base(projectId, issueId), { body }),
  update: (projectId: string, issueId: string, commentId: string, body: string) =>
    http.patch<Comment>(`${base(projectId, issueId)}/${commentId}`, { body }),
  remove: (projectId: string, issueId: string, commentId: string) =>
    http.delete<null>(`${base(projectId, issueId)}/${commentId}`),
}
