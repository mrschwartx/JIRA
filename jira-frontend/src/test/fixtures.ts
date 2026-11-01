import type { User } from '@/features/auth'
import type { Issue } from '@/features/issues'
import type { Member, Project } from '@/features/projects'

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  avatar: '/images/users/default-avatar.jpg',
  ...overrides,
})

export const makeMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  avatar: '/images/users/default-avatar.jpg',
  role: 'owner',
  ...overrides,
})

export const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  key: 'JIRA',
  name: 'Jira Demo',
  url: null,
  description: '',
  category: 'software',
  ownerId: 'user-1',
  role: 'owner',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

export const makeIssue = (overrides: Partial<Issue> = {}): Issue => ({
  id: 'issue-1',
  projectId: 'project-1',
  number: 1,
  title: 'Fix login redirect',
  type: 'bug',
  status: 'backlog',
  priority: 'high',
  listPosition: 1,
  description: '',
  estimate: null,
  timeSpent: null,
  timeRemaining: null,
  reporterId: 'user-1',
  assigneeIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})
