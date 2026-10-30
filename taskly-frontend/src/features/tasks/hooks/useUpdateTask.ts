import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/shared/api'
import { tasksApi } from '../api/tasksApi'
import { taskKeys } from '../queryKeys'
import type { TaskPayload } from '../types'

export function useUpdateTask(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TaskPayload) => tasksApi.update(taskId, payload),
    onSuccess: async (_task, payload) => {
      toast.success(`Task Updated: ${payload.name}`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) }),
      ])
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
