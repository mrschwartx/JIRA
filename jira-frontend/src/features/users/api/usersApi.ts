import { http } from '@/shared/api'
import type { User } from '@/features/auth'
import type { UpdateProfilePayload } from '../types'

export const usersApi = {
  search: (query: string, signal?: AbortSignal) => http.get<User[]>('/users', { searchParams: { q: query }, signal }),
  uploadAvatar: (userId: string, file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return http.upload<User>(`/users/${userId}/avatar`, formData)
  },
  updateProfile: (userId: string, payload: UpdateProfilePayload) => http.patch<User>(`/users/${userId}`, payload),
  deleteAccount: (userId: string) => http.delete<null>(`/users/${userId}`),
}
