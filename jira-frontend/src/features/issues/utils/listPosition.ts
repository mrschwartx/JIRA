import type { Issue, IssueStatus } from '../types'

export const sortByListPosition = (issues: readonly Issue[]) =>
  [...issues].sort((a, b) => a.listPosition - b.listPosition || a.createdAt.localeCompare(b.createdAt))

export const issuesInColumn = (issues: readonly Issue[], status: IssueStatus) =>
  sortByListPosition(issues.filter((issue) => issue.status === status))

type DropLocation = {
  status: IssueStatus
  index: number
}

export const isPositionChanged = (source: DropLocation, destination: DropLocation | null | undefined) => {
  if (!destination) {
    return false
  }
  return source.status !== destination.status || source.index !== destination.index
}

export const calculateListPosition = (
  visibleColumn: readonly Issue[],
  movedIssueId: string,
  destinationIndex: number,
): number => {
  const others = visibleColumn.filter((issue) => issue.id !== movedIssueId)
  const previous = others[destinationIndex - 1]
  const next = others[destinationIndex]

  if (!previous && !next) {
    return 1
  }
  if (!previous && next) {
    return next.listPosition - 1
  }
  if (previous && !next) {
    return previous.listPosition + 1
  }
  if (previous && next) {
    return previous.listPosition + (next.listPosition - previous.listPosition) / 2
  }
  return 1
}
