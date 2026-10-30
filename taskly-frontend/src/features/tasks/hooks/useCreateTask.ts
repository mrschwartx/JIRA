import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/shared/api'
import { tasksApi } from '../api/tasksApi'
import { taskKeys } from '../queryKeys'

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksApi.create,
    onSuccess: async (_task, payload) => {
      toast.success(`New Task Created: ${payload.name}`)
      await queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
