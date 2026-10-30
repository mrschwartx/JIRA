import type { Task, TaskFormValues, TaskPayload, TaskPriority, TaskStatus } from '../types'

export const emptyTaskFormValues: TaskFormValues = {
  name: '',
  description: '',
  priority: '',
  status: '',
  due: null,
}

export const toTaskFormValues = (task: Task): TaskFormValues => ({
  name: task.name,
  description: task.description,
  priority: task.priority,
  status: task.status,
  due: new Date(task.due),
})

export const toTaskPayload = (values: TaskFormValues): TaskPayload => ({
  name: values.name,
  description: values.description,
  priority: values.priority as TaskPriority,
  status: values.status as TaskStatus,
  due: (values.due as Date).toISOString(),
})
