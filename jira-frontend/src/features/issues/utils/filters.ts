import { RECENT_WINDOW_MS } from '../constants'
import type { Issue, IssueFilters } from '../types'

export const EMPTY_FILTERS: IssueFilters = {
  text: '',
  assigneeIds: [],
  onlyMine: false,
  recentOnly: false,
}

export const hasActiveFilters = (filters: IssueFilters) =>
  filters.text.trim() !== '' || filters.assigneeIds.length > 0 || filters.onlyMine || filters.recentOnly

export const filterIssues = (
  issues: readonly Issue[],
  filters: IssueFilters,
  currentUserId: string | undefined,
  now: number = Date.now(),
): Issue[] => {
  const needle = filters.text.trim().toLowerCase()

  return issues.filter((issue) => {
    if (needle && !issue.title.toLowerCase().includes(needle)) {
      return false
    }
    if (filters.assigneeIds.length > 0 && !issue.assigneeIds.some((id) => filters.assigneeIds.includes(id))) {
      return false
    }
    if (filters.onlyMine && (!currentUserId || !issue.assigneeIds.includes(currentUserId))) {
      return false
    }
    if (filters.recentOnly && now - new Date(issue.updatedAt).getTime() > RECENT_WINDOW_MS) {
      return false
    }
    return true
  })
}
