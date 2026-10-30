export type ProfileFormValues = {
  username: string
  email: string
  password: string
}

export type UpdateProfilePayload = {
  username: string
  email: string
  password?: string
  avatar?: string
}

export type UploadAvatarResponse = {
  avatar: string
}
