export type IssueType = 'task' | 'bug' | 'story'
export type IssueStatus = 'backlog' | 'selected' | 'inprogress' | 'done'
export type IssuePriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest'

export type Issue = {
  id: string
  projectId: string
  number: number
  title: string
  type: IssueType
  status: IssueStatus
  priority: IssuePriority
  listPosition: number
  description: string
  estimate: number | null
  timeSpent: number | null
  timeRemaining: number | null
  reporterId: string | null
  assigneeIds: string[]
  createdAt: string
  updatedAt: string
}

export type CreateIssueValues = {
  title: string
  type: IssueType
  status?: IssueStatus
  priority: IssuePriority
  description: string
  reporterId: string
  assigneeIds: string[]
}

export type UpdateIssueChanges = Partial<
  Pick<
    Issue,
    | 'title'
    | 'type'
    | 'status'
    | 'priority'
    | 'listPosition'
    | 'description'
    | 'estimate'
    | 'timeSpent'
    | 'timeRemaining'
    | 'reporterId'
    | 'assigneeIds'
  >
>

export type IssueFilters = {
  text: string
  assigneeIds: string[]
  onlyMine: boolean
  recentOnly: boolean
}
