import { describe, expect, it } from 'vitest'
import { makeIssue } from '@/test/fixtures'
import { calculateListPosition, isPositionChanged, issuesInColumn, sortByListPosition } from './listPosition'

const column = [
  makeIssue({ id: 'a', listPosition: 1 }),
  makeIssue({ id: 'b', listPosition: 2 }),
  makeIssue({ id: 'c', listPosition: 4 }),
]

describe('calculateListPosition', () => {
  it('returns 1 for an empty column', () => {
    expect(calculateListPosition([], 'x', 0)).toBe(1)
  })

  it('goes above the first issue', () => {
    expect(calculateListPosition(column, 'x', 0)).toBe(0)
  })

  it('goes below the last issue', () => {
    expect(calculateListPosition(column, 'x', 3)).toBe(5)
  })

  it('lands between two neighbours', () => {
    expect(calculateListPosition(column, 'x', 2)).toBe(3)
    expect(calculateListPosition(column, 'x', 1)).toBe(1.5)
  })

  it('ignores the dragged issue when it moves inside its own column', () => {
    expect(calculateListPosition(column, 'a', 2)).toBe(5)
    expect(calculateListPosition(column, 'c', 0)).toBe(0)
    expect(calculateListPosition(column, 'b', 1)).toBe(2.5)
  })

  it('keeps ordering stable after repeated insertions at the same spot', () => {
    let positions = [1, 2]
    for (let step = 0; step < 30; step += 1) {
      const items = positions.map((listPosition, index) => makeIssue({ id: `i${index}`, listPosition }))
      const next = calculateListPosition(items, 'new', 1)
      expect(next).toBeGreaterThan(positions[0] ?? 0)
      expect(next).toBeLessThan(positions[1] ?? 0)
      positions = [positions[0] ?? 0, next]
    }
  })
})

describe('isPositionChanged', () => {
  const source = { status: 'backlog' as const, index: 1 }

  it('is false when dropped outside any column', () => {
    expect(isPositionChanged(source, null)).toBe(false)
    expect(isPositionChanged(source, undefined)).toBe(false)
  })

  it('is false when dropped where it started', () => {
    expect(isPositionChanged(source, { status: 'backlog', index: 1 })).toBe(false)
  })

  it('is true when the index or the column changes', () => {
    expect(isPositionChanged(source, { status: 'backlog', index: 0 })).toBe(true)
    expect(isPositionChanged(source, { status: 'done', index: 1 })).toBe(true)
  })
})

describe('column helpers', () => {
  it('sorts by position and breaks ties by creation time', () => {
    const sorted = sortByListPosition([
      makeIssue({ id: 'late', listPosition: 1, createdAt: '2026-02-01T00:00:00.000Z' }),
      makeIssue({ id: 'early', listPosition: 1, createdAt: '2026-01-01T00:00:00.000Z' }),
      makeIssue({ id: 'first', listPosition: 0 }),
    ])
    expect(sorted.map((issue) => issue.id)).toEqual(['first', 'early', 'late'])
  })

  it('keeps only the issues of one status', () => {
    const issues = [makeIssue({ id: 'a', status: 'done' }), makeIssue({ id: 'b', status: 'backlog' })]
    expect(issuesInColumn(issues, 'done').map((issue) => issue.id)).toEqual(['a'])
  })
})
