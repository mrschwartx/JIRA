import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth'
import { tasksApi } from '../api/tasksApi'
import { taskKeys } from '../queryKeys'
import type { TaskFilters } from '../types'

export function useTasks(filters: TaskFilters) {
  const { user } = useSession()
  const userId = user?._id ?? ''

  return useQuery({
    queryKey: taskKeys.list(userId, filters),
    queryFn: ({ signal }) => tasksApi.list(userId, filters, signal),
    enabled: userId !== '',
    placeholderData: keepPreviousData,
  })
}
