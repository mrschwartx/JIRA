import { http, type MessageResponse } from '@/shared/api'
import type { SignInValues, SignUpValues, User } from '../types'

export const authApi = {
  signIn: (values: SignInValues) => http.post<User>('/auth/signin', values),
  signUp: (values: SignUpValues) => http.post<User>('/auth/signup', values),
  signOut: () => http.get<MessageResponse>('/auth/signout'),
}
