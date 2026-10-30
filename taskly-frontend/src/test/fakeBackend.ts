import type { FakeTask, FakeUser } from './factories'

export const FAKE_PAGE_SIZE = 4

export type FakeRequest = {
  method: string
  path: string
  searchParams: URLSearchParams
  body?: unknown
}

export type FakeResponse = {
  status: number
  body: unknown
}

type Seed = {
  users?: FakeUser[]
  tasks?: FakeTask[]
  sessionUserId?: string | null
}

type JsonObject = Record<string, unknown>

const respond = (status: number, body: unknown): FakeResponse => ({ status, body })

const asObject = (value: unknown): JsonObject =>
  value && typeof value === 'object' ? (value as JsonObject) : {}

const publicUser = ({ password, ...user }: FakeUser) => {
  void password
  return user
}

const publicTask = ({ userId, ...task }: FakeTask) => {
  void userId
  return task
}

const STATUSES = ['todo', 'in_progress', 'done']
const PRIORITIES = ['low', 'medium', 'high']

const validateTask = (body: JsonObject, requireAll: boolean): string | null => {
  if (body.status !== undefined && !STATUSES.includes(String(body.status))) {
    return 'Task status must be one of: todo, in_progress, done'
  }
  if (body.priority !== undefined && !PRIORITIES.includes(String(body.priority))) {
    return 'Task priority must be one of: low, medium, high'
  }
  if (body.due !== undefined && (typeof body.due !== 'string' || Number.isNaN(Date.parse(body.due)))) {
    return 'Task due date is invalid'
  }
  if (requireAll && body.due === undefined) {
    return 'Task due date is required'
  }
  return null
}

const compareBy = (orderBy: string | null) => (a: FakeTask, b: FakeTask) => {
  const key = (orderBy ?? '') as keyof FakeTask
  if (!orderBy || !(key in a)) {
    return 0
  }
  return String(a[key] ?? '').localeCompare(String(b[key] ?? ''))
}

export function createFakeBackend(seed: Seed = {}) {
  const state = {
    users: [...(seed.users ?? [])],
    tasks: [...(seed.tasks ?? [])],
    sessionUserId: seed.sessionUserId ?? null,
    nextId: 1000,
    requests: [] as FakeRequest[],
  }

  const generateId = (prefix: string) => {
    state.nextId += 1
    return `${prefix}-${state.nextId}`
  }

  const currentUser = () => state.users.find((user) => user._id === state.sessionUserId) ?? null

  const handle = (request: FakeRequest): FakeResponse => {
    state.requests.push(request)

    const { method, searchParams } = request
    const body = asObject(request.body)
    const [resource, action, id] = request.path.split('/').filter(Boolean)

    if (resource === 'auth') {
      if (action === 'signin' && method === 'POST') {
        const user = state.users.find((item) => item.email === body.email && item.password === body.password)
        if (!user) {
          return respond(401, { message: 'Wrong credentials' })
        }
        state.sessionUserId = user._id
        return respond(200, publicUser(user))
      }

      if (action === 'signup' && method === 'POST') {
        if (state.users.some((item) => item.email === body.email)) {
          return respond(400, { message: 'Email already in use' })
        }
        const user: FakeUser = {
          _id: generateId('user'),
          username: String(body.username),
          email: String(body.email),
          password: String(body.password),
        }
        state.users.push(user)
        state.sessionUserId = user._id
        return respond(200, publicUser(user))
      }

      if (action === 'signout' && method === 'GET') {
        state.sessionUserId = null
        return respond(200, { message: 'Signout success!' })
      }
    }

    const user = currentUser()
    if (!user) {
      return respond(401, { message: 'Unauthorized' })
    }

    if (resource === 'tasks') {
      if (action === 'user' && method === 'GET') {
        let tasks = state.tasks.filter((task) => task.userId === id)
        const status = searchParams.get('status')
        if (status) {
          tasks = tasks.filter((task) => task.status === status)
        }
        tasks = [...tasks].sort(compareBy(searchParams.get('orderBy')))
        const page = Math.max(Number.parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)
        const start = (page - 1) * FAKE_PAGE_SIZE
        return respond(200, {
          tasks: tasks.slice(start, start + FAKE_PAGE_SIZE).map(publicTask),
          taskCount: tasks.length,
        })
      }

      if (action === 'create' && method === 'POST') {
        const invalid = validateTask(body, true)
        if (invalid) {
          return respond(422, { status: 422, message: invalid })
        }
        const task: FakeTask = {
          _id: generateId('task'),
          userId: user._id,
          name: String(body.name),
          description: String(body.description),
          priority: body.priority as FakeTask['priority'],
          status: body.status as FakeTask['status'],
          due: String(body.due),
        }
        state.tasks.push(task)
        return respond(200, publicTask(task))
      }

      const task = state.tasks.find((item) => item._id === action && item.userId === user._id)
      if (action && !task) {
        return respond(404, { message: 'Task not found' })
      }

      if (task && method === 'GET') {
        return respond(200, publicTask(task))
      }

      if (task && method === 'PATCH') {
        const invalid = validateTask(body, false)
        if (invalid) {
          return respond(422, { status: 422, message: invalid })
        }
        Object.assign(task, body)
        return respond(200, publicTask(task))
      }

      if (task && method === 'DELETE') {
        state.tasks = state.tasks.filter((item) => item._id !== task._id)
        return respond(200, { message: 'Task deleted' })
      }
    }

    if (resource === 'users' && id === user._id) {
      if (action === 'upload' && method === 'POST') {
        return respond(200, { avatar: '/uploads/avatars/new-avatar.png' })
      }

      if (action === 'update' && method === 'PATCH') {
        Object.assign(user, body)
        return respond(200, publicUser(user))
      }

      if (action === 'delete' && method === 'DELETE') {
        state.users = state.users.filter((item) => item._id !== user._id)
        state.tasks = state.tasks.filter((item) => item.userId !== user._id)
        state.sessionUserId = null
        return respond(200, { message: 'User has been deleted' })
      }
    }

    return respond(404, { message: 'Not found' })
  }

  return { state, handle }
}

export type FakeBackend = ReturnType<typeof createFakeBackend>
