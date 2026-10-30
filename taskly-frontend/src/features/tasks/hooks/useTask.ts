import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '../api/tasksApi'
import { taskKeys } from '../queryKeys'

export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: ({ signal }) => tasksApi.get(taskId, signal),
    enabled: taskId !== '',
  })
}
