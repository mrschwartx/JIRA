import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { Task } from '../types'
import { TasksTable } from './TasksTable'

const tasks: Task[] = [
  { _id: 't1', name: 'Urgent job', description: '', priority: 'high', status: 'todo', due: '2026-03-01T10:00:00.000Z' },
  { _id: 't2', name: 'Calm job', description: '', priority: 'low', status: 'done', due: '2026-04-01T10:00:00.000Z' },
]

describe('TasksTable', () => {
  it('renders a row per task with links, badges and formatted due dates', () => {
    renderWithProviders(<TasksTable tasks={tasks} onOrderByChange={vi.fn()} />)

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(3)
    expect(within(rows[1]!).getByRole('link', { name: 'Urgent job' })).toHaveAttribute('href', '/tasks/t1')
    expect(within(rows[1]!).getByText('High')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('To do')).toBeInTheDocument()
    expect(within(rows[1]!).getByText(new Date(tasks[0]!.due).toDateString())).toBeInTheDocument()
    expect(within(rows[2]!).getByText('Done')).toBeInTheDocument()
  })

  it('renders an empty state', () => {
    renderWithProviders(<TasksTable tasks={[]} onOrderByChange={vi.fn()} />)

    expect(screen.getByText('No tasks found')).toBeInTheDocument()
  })

  it('reports sort changes and marks the active column', async () => {
    const onOrderByChange = vi.fn()
    const { user } = renderWithProviders(<TasksTable tasks={tasks} orderBy="priority" onOrderByChange={onOrderByChange} />)

    await user.click(screen.getByRole('button', { name: 'Due Date' }))

    expect(onOrderByChange).toHaveBeenCalledWith('due')
    expect(screen.getByRole('columnheader', { name: 'Priority' })).toHaveAttribute('aria-sort', 'ascending')
    expect(screen.getByRole('columnheader', { name: 'Task' })).toHaveAttribute('aria-sort', 'none')
  })
})
