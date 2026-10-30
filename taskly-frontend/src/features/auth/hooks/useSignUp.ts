'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config/paths'
import { authApi } from '../api/authApi'
import { sessionStore } from '../store/sessionStore'

export function useSignUp() {
  const router = useRouter()

  return useMutation({
    mutationFn: authApi.signUp,
    onSuccess: (user) => {
      sessionStore.setUser(user)
      toast.success('Sign Up Successful. You are now logged in')
      router.push(paths.profile)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
