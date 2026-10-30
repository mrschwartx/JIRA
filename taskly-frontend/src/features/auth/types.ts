export type User = {
  _id: string
  username: string
  email: string
  avatar?: string
}

export type SignInValues = {
  email: string
  password: string
}

export type SignUpValues = {
  username: string
  email: string
  password: string
}
