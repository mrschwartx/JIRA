import { http, type MessageResponse } from '@/shared/api'
import type { User } from '@/features/auth'
import type { UpdateProfilePayload, UploadAvatarResponse } from '../types'

export const usersApi = {
  uploadAvatar: (userId: string, file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return http.upload<UploadAvatarResponse>(`/users/upload/${userId}`, formData)
  },
  updateProfile: (userId: string, payload: UpdateProfilePayload) =>
    http.patch<User>(`/users/update/${userId}`, payload),
  deleteAccount: (userId: string) => http.delete<MessageResponse>(`/users/delete/${userId}`),
}
