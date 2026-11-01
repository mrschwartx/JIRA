export type ProfileFormValues = {
  username: string
  email: string
  password: string
}

export type UpdateProfilePayload = {
  username: string
  email: string
  password?: string
}
