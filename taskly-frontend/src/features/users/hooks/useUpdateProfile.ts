import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { sessionStore } from '@/features/auth'
import { getErrorMessage } from '@/shared/api'
import { usersApi } from '../api/usersApi'
import type { ProfileFormValues, UpdateProfilePayload } from '../types'

type UpdateProfileVariables = {
  userId: string
  values: ProfileFormValues
  avatarFile: File | null
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async ({ userId, values, avatarFile }: UpdateProfileVariables) => {
      const payload: UpdateProfilePayload = {
        username: values.username,
        email: values.email,
      }

      if (values.password) {
        payload.password = values.password
      }

      if (avatarFile) {
        const { avatar } = await usersApi.uploadAvatar(userId, avatarFile)
        payload.avatar = avatar
      }

      return usersApi.updateProfile(userId, payload)
    },
    onSuccess: (user) => {
      sessionStore.setUser(user)
      toast.success('Profile Updated')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Profile Update Error'))
    },
  })
}
