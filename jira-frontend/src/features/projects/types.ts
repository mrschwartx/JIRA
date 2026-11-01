export type ProjectCategory = 'software' | 'marketing' | 'business'
export type MemberRole = 'owner' | 'member'

export type Project = {
  id: string
  key: string
  name: string
  url: string | null
  description: string
  category: ProjectCategory
  ownerId: string
  role: MemberRole
  createdAt: string
  updatedAt: string
}

export type Member = {
  id: string
  username: string
  email: string
  avatar: string
  role: MemberRole
}

export type CreateProjectValues = {
  key: string
  name: string
  category: ProjectCategory
  url: string
  description: string
}

export type UpdateProjectValues = {
  name: string
  category: ProjectCategory
  url: string
  description: string
}
