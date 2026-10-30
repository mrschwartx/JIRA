import { describe, expect, it } from 'vitest'
import type { Task, TaskFormValues } from '../types'
import { emptyTaskFormValues, toTaskFormValues, toTaskPayload } from './taskForm'

const values: TaskFormValues = {
  name: 'Write tests',
  description: 'Cover the app',
  priority: 'high',
  status: 'todo',
  due: new Date('2026-03-01T10:00:00.000Z'),
}

describe('toTaskPayload', () => {
  it('serializes the due date as an ISO string', () => {
    expect(toTaskPayload(values)).toEqual({
      name: 'Write tests',
      description: 'Cover the app',
      priority: 'high',
      status: 'todo',
      due: '2026-03-01T10:00:00.000Z',
    })
  })
})

describe('toTaskFormValues', () => {
  const task: Task = {
    _id: 't1',
    name: 'Write tests',
    description: 'Cover the app',
    priority: 'low',
    status: 'done',
    due: '2026-03-01T10:00:00.000Z',
  }

  it('maps a task to form values with a Date instance', () => {
    const result = toTaskFormValues(task)

    expect(result.due).toBeInstanceOf(Date)
    expect(result.due?.toISOString()).toBe('2026-03-01T10:00:00.000Z')
    expect(result).toMatchObject({ name: 'Write tests', priority: 'low', status: 'done' })
  })

  it('exposes empty defaults for the create form', () => {
    expect(emptyTaskFormValues).toEqual({ name: '', description: '', priority: '', status: '', due: null })
  })
})
