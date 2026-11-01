import type { IssuePriority, IssueStatus, IssueType } from './types'

export const ISSUE_TYPES: readonly IssueType[] = ['task', 'bug', 'story']
export const ISSUE_STATUSES: readonly IssueStatus[] = ['backlog', 'selected', 'inprogress', 'done']
export const ISSUE_PRIORITIES: readonly IssuePriority[] = ['highest', 'high', 'medium', 'low', 'lowest']

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  task: 'Task',
  bug: 'Bug',
  story: 'Story',
}

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  selected: 'Selected for development',
  inprogress: 'In progress',
  done: 'Done',
}

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  highest: 'Highest',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  lowest: 'Lowest',
}

export const RECENT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000
