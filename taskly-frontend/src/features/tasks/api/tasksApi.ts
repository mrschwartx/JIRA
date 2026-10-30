import { http, type MessageResponse } from '@/shared/api'
import type { Task, TaskFilters, TaskListResponse, TaskPayload } from '../types'
import { buildTaskSearchParams } from '../utils/taskFilters'

export const tasksApi = {
  list: (userId: string, filters: TaskFilters, signal?: AbortSignal) =>
    http.get<TaskListResponse>(`/tasks/user/${userId}`, {
      searchParams: buildTaskSearchParams(filters),
      signal,
    }),
  get: (taskId: string, signal?: AbortSignal) => http.get<Task>(`/tasks/${taskId}`, { signal }),
  create: (payload: TaskPayload) => http.post<Task>('/tasks/create', payload),
  update: (taskId: string, payload: TaskPayload) => http.patch<Task>(`/tasks/${taskId}`, payload),
  remove: (taskId: string) => http.delete<MessageResponse>(`/tasks/${taskId}`),
}
