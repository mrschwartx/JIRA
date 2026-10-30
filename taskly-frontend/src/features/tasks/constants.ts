export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const
export const TASK_ORDER_BY = ['name', 'priority', 'status', 'due'] as const
export const TASKS_PAGE_SIZE = 4

export const TASK_STATUS_LABELS = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
} as const satisfies Record<(typeof TASK_STATUSES)[number], string>

export const TASK_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
} as const satisfies Record<(typeof TASK_PRIORITIES)[number], string>
