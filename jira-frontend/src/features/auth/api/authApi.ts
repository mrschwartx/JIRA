import { http } from '@/shared/api'
import type { SignInValues, SignUpValues, User } from '../types'

export const authApi = {
  signIn: (values: SignInValues) => http.post<User>('/auth/signin', values),
  signUp: (values: SignUpValues) => http.post<User>('/auth/signup', values),
  signOut: () => http.post<null>('/auth/signout'),
}
