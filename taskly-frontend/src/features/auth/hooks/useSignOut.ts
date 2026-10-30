'use client'

import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/shared/api'
import { authApi } from '../api/authApi'
import { useEndSession } from './useEndSession'

export function useSignOut() {
  const endSession = useEndSession()

  return useMutation({
    mutationFn: authApi.signOut,
    onSuccess: (data) => {
      toast.success(data.message)
      endSession()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to sign out'))
    },
  })
}
