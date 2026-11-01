import { http } from '@/shared/api'
import type { CreateProjectValues, Member, Project, UpdateProjectValues } from '../types'

const toPayload = (url: string) => (url.trim() === '' ? null : url.trim())

export const projectsApi = {
  list: (signal?: AbortSignal) => http.get<Project[]>('/projects', { signal }),
  get: (projectId: string, signal?: AbortSignal) => http.get<Project>(`/projects/${projectId}`, { signal }),
  create: (values: CreateProjectValues) =>
    http.post<Project>('/projects', { ...values, key: values.key.trim().toUpperCase(), url: toPayload(values.url) }),
  update: (projectId: string, values: UpdateProjectValues) =>
    http.patch<Project>(`/projects/${projectId}`, { ...values, url: toPayload(values.url) }),
  remove: (projectId: string) => http.delete<null>(`/projects/${projectId}`),
  listMembers: (projectId: string, signal?: AbortSignal) => http.get<Member[]>(`/projects/${projectId}/members`, { signal }),
  addMember: (projectId: string, userId: string) => http.post<Member>(`/projects/${projectId}/members`, { userId }),
  removeMember: (projectId: string, userId: string) => http.delete<null>(`/projects/${projectId}/members/${userId}`),
}
