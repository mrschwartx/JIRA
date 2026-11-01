import { describe, expect, it } from 'vitest'
import { makeIssue } from '@/test/fixtures'
import { EMPTY_FILTERS, filterIssues, hasActiveFilters } from './filters'

const NOW = new Date('2026-03-10T00:00:00.000Z').getTime()

const issues = [
  makeIssue({ id: 'a', title: 'Login bug', assigneeIds: ['u1'], updatedAt: '2026-03-09T00:00:00.000Z' }),
  makeIssue({ id: 'b', title: 'Dark mode', assigneeIds: ['u2'], updatedAt: '2026-01-01T00:00:00.000Z' }),
  makeIssue({ id: 'c', title: 'Docs', assigneeIds: [], updatedAt: '2026-03-08T00:00:00.000Z' }),
]

const ids = (filters = EMPTY_FILTERS, user = 'u1') => filterIssues(issues, filters, user, NOW).map((issue) => issue.id)

describe('filterIssues', () => {
  it('returns everything without filters', () => {
    expect(ids()).toEqual(['a', 'b', 'c'])
  })

  it('matches the title case insensitively', () => {
    expect(ids({ ...EMPTY_FILTERS, text: '  LOGIN ' })).toEqual(['a'])
  })

  it('filters by any selected assignee', () => {
    expect(ids({ ...EMPTY_FILTERS, assigneeIds: ['u2', 'u9'] })).toEqual(['b'])
  })

  it('shows only the issues of the current user', () => {
    expect(ids({ ...EMPTY_FILTERS, onlyMine: true })).toEqual(['a'])
    expect(filterIssues(issues, { ...EMPTY_FILTERS, onlyMine: true }, undefined, NOW)).toEqual([])
  })

  it('keeps recently updated issues only', () => {
    expect(ids({ ...EMPTY_FILTERS, recentOnly: true })).toEqual(['a', 'c'])
  })

  it('combines filters', () => {
    expect(ids({ text: 'o', assigneeIds: ['u1'], onlyMine: true, recentOnly: true })).toEqual(['a'])
  })
})

describe('hasActiveFilters', () => {
  it('detects any active filter', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, text: ' ' })).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, text: 'x' })).toBe(true)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, onlyMine: true })).toBe(true)
  })
})
