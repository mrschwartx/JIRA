import { Badge } from '@chakra-ui/react'
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../constants'
import type { TaskPriority, TaskStatus } from '../types'

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'gray',
  medium: 'orange',
  high: 'red',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'orange',
  in_progress: 'blue',
  done: 'green',
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge colorPalette={PRIORITY_COLORS[priority] ?? 'gray'}>{TASK_PRIORITY_LABELS[priority] ?? priority}</Badge>
}

export function StatusBadge({ status, size }: { status: TaskStatus; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <Badge size={size} colorPalette={STATUS_COLORS[status] ?? 'gray'}>
      {TASK_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
