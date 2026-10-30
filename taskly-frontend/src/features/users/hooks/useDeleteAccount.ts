import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useEndSession } from '@/features/auth'
import { getErrorMessage } from '@/shared/api'
import { usersApi } from '../api/usersApi'

export function useDeleteAccount() {
  const endSession = useEndSession()

  return useMutation({
    mutationFn: usersApi.deleteAccount,
    onSuccess: (data) => {
      toast.success(data.message)
      endSession()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Delete Error'))
    },
  })
}
