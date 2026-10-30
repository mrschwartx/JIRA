import { TASK_ORDER_BY, TASK_STATUSES } from '../constants'
import type { TaskFilterPatch, TaskFilters, TaskOrderBy, TaskStatus } from '../types'

export const isTaskStatus = (value: string | null | undefined): value is TaskStatus =>
  TASK_STATUSES.some((status) => status === value)

export const isTaskOrderBy = (value: string | null | undefined): value is TaskOrderBy =>
  TASK_ORDER_BY.some((orderBy) => orderBy === value)

export const parseTaskFilters = (searchParams: URLSearchParams): TaskFilters => {
  const status = searchParams.get('status')
  const orderBy = searchParams.get('orderBy')
  const page = Number.parseInt(searchParams.get('page') ?? '', 10)

  return {
    status: isTaskStatus(status) ? status : undefined,
    orderBy: isTaskOrderBy(orderBy) ? orderBy : undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

export const buildTaskSearchParams = (filters: TaskFilters): URLSearchParams => {
  const params = new URLSearchParams()

  if (filters.status) {
    params.set('status', filters.status)
  }
  if (filters.orderBy) {
    params.set('orderBy', filters.orderBy)
  }
  if (filters.page > 1) {
    params.set('page', String(filters.page))
  }

  return params
}

export const applyTaskFilterPatch = (current: URLSearchParams, patch: TaskFilterPatch): URLSearchParams => {
  const next = new URLSearchParams(current)

  const apply = (key: string, value: string | number | undefined) => {
    if (value === undefined || value === '') {
      next.delete(key)
    } else {
      next.set(key, String(value))
    }
  }

  if ('status' in patch) {
    apply('status', patch.status)
  }
  if ('orderBy' in patch) {
    apply('orderBy', patch.orderBy)
  }
  if ('page' in patch) {
    apply('page', patch.page !== undefined && patch.page > 1 ? patch.page : undefined)
  }

  return next
}
