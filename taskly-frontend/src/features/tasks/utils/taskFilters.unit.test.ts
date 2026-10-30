import { describe, expect, it } from 'vitest'
import { applyTaskFilterPatch, buildTaskSearchParams, isTaskOrderBy, isTaskStatus, parseTaskFilters } from './taskFilters'

describe('type guards', () => {
  it('recognizes valid statuses and order keys', () => {
    expect(isTaskStatus('todo')).toBe(true)
    expect(isTaskStatus('in_progress')).toBe(true)
    expect(isTaskStatus('open')).toBe(false)
    expect(isTaskStatus('in-progress')).toBe(false)
    expect(isTaskStatus('archived')).toBe(false)
    expect(isTaskStatus(null)).toBe(false)
    expect(isTaskOrderBy('due')).toBe(true)
    expect(isTaskOrderBy('title')).toBe(false)
  })
})

describe('parseTaskFilters', () => {
  it('reads valid values from the query string', () => {
    const filters = parseTaskFilters(new URLSearchParams('status=done&orderBy=priority&page=3'))

    expect(filters).toEqual({ status: 'done', orderBy: 'priority', page: 3 })
  })

  it('defaults and sanitizes invalid values', () => {
    expect(parseTaskFilters(new URLSearchParams(''))).toEqual({ status: undefined, orderBy: undefined, page: 1 })
    expect(parseTaskFilters(new URLSearchParams('status=x&orderBy=y&page=-4'))).toEqual({
      status: undefined,
      orderBy: undefined,
      page: 1,
    })
    expect(parseTaskFilters(new URLSearchParams('page=abc')).page).toBe(1)
  })
})

describe('buildTaskSearchParams', () => {
  it('includes only meaningful filters', () => {
    expect(buildTaskSearchParams({ page: 1 }).toString()).toBe('')
    expect(buildTaskSearchParams({ status: 'todo', orderBy: 'name', page: 2 }).toString()).toBe(
      'status=todo&orderBy=name&page=2',
    )
  })
})

describe('applyTaskFilterPatch', () => {
  it('sets and removes keys without mutating the input', () => {
    const current = new URLSearchParams('status=todo&page=3')

    const next = applyTaskFilterPatch(current, { status: undefined, orderBy: 'due', page: undefined })

    expect(next.toString()).toBe('orderBy=due')
    expect(current.toString()).toBe('status=todo&page=3')
  })

  it('only touches keys present in the patch', () => {
    const next = applyTaskFilterPatch(new URLSearchParams('status=todo&orderBy=name'), { page: 2 })

    expect(next.toString()).toBe('status=todo&orderBy=name&page=2')
  })

  it('drops the page param for the first page', () => {
    expect(applyTaskFilterPatch(new URLSearchParams('page=4'), { page: 1 }).has('page')).toBe(false)
  })
})
