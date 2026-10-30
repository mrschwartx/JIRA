import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/shared/api'
import { tasksApi } from '../api/tasksApi'
import { taskKeys } from '../queryKeys'

export function useDeleteTask(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => tasksApi.remove(taskId),
    onSuccess: async (data) => {
      toast.success(data.message)
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) })
      await queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
