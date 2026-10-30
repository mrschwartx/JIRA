import type { TASK_ORDER_BY, TASK_PRIORITIES, TASK_STATUSES } from './constants'

export type TaskStatus = (typeof TASK_STATUSES)[number]
export type TaskPriority = (typeof TASK_PRIORITIES)[number]
export type TaskOrderBy = (typeof TASK_ORDER_BY)[number]

export type Task = {
  _id: string
  name: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  due: string
}

export type TaskPayload = {
  name: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  due: string
}

export type TaskListResponse = {
  tasks: Task[]
  taskCount: number
}

export type TaskFilters = {
  status?: TaskStatus
  orderBy?: TaskOrderBy
  page: number
}

export type TaskFilterPatch = {
  status?: TaskStatus | undefined
  orderBy?: TaskOrderBy | undefined
  page?: number | undefined
}

export type TaskFormValues = {
  name: string
  description: string
  priority: TaskPriority | ''
  status: TaskStatus | ''
  due: Date | null
}
