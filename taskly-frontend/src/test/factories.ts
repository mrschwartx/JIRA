export type FakeUser = {
  _id: string
  username: string
  email: string
  password: string
  avatar?: string
}

export type FakeTask = {
  _id: string
  userId: string
  name: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  due: string
}

let sequence = 0

const nextSequence = () => {
  sequence += 1
  return sequence
}

export const createFakeUser = (overrides: Partial<FakeUser> = {}): FakeUser => {
  const id = nextSequence()
  return {
    _id: `user-${id}`,
    username: `user${id}`,
    email: `user${id}@example.com`,
    password: 'secret123',
    ...overrides,
  }
}

export const createFakeTask = (userId: string, overrides: Partial<FakeTask> = {}): FakeTask => {
  const id = nextSequence()
  return {
    _id: `task-${id}`,
    userId,
    name: `Task ${id}`,
    description: `Description ${id}`,
    priority: 'low',
    status: 'todo',
    due: '2026-03-01T10:00:00.000Z',
    ...overrides,
  }
}

export const createFakeTasks = (userId: string, count: number, overrides: Partial<FakeTask> = {}) =>
  Array.from({ length: count }, (_, index) =>
    createFakeTask(userId, { name: `Task ${String(index + 1).padStart(2, '0')}`, ...overrides }),
  )

export const toSessionUser = ({ password, ...user }: FakeUser) => {
  void password
  return user
}
