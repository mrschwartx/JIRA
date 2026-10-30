import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createFakeTask, createFakeUser } from '@/test/factories'
import { renderWithProviders, setupBackend } from '@/test/renderWithProviders'
import { MemoryRoutes } from '@/test/MemoryRoutes'
import { TaskDetailPage } from './TaskDetailPage'

const routes = (
  <MemoryRoutes
    routes={{
      '/tasks': <p>Tasks list page</p>,
      '/tasks/[taskId]': <TaskDetailPage />,
      '/update-task/[taskId]': <p>Update task page</p>,
    }}
  />
)

const setup = () => {
  const currentUser = createFakeUser()
  const task = createFakeTask(currentUser._id, {
    _id: 'task-detail',
    name: 'Prepare launch',
    description: 'Write the announcement post',
    status: 'todo',
    due: '2026-03-01T10:00:00.000Z',
  })
  const { backend, session } = setupBackend({ currentUser, tasks: [task] })
  const view = renderWithProviders(routes, { route: `/tasks/${task._id}`, session })
  return { task, backend, ...view }
}

describe('TaskDetailPage', () => {
  it('shows a skeleton and then the task details', async () => {
    const { task } = setup()

    expect(screen.getByLabelText('Loading task')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Prepare launch' })).toBeInTheDocument()
    expect(screen.getByText('Write the announcement post')).toBeInTheDocument()
    expect(screen.getByText('To do')).toBeInTheDocument()
    expect(screen.getByText(new Date(task.due).toLocaleDateString())).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit Task' })).toHaveAttribute('href', `/update-task/${task._id}`)
  })

  it('navigates back to the list', async () => {
    const { user } = setup()

    await user.click(await screen.findByRole('link', { name: /all tasks/i }))

    expect(screen.getByText('Tasks list page')).toBeInTheDocument()
  })

  it('deletes the task after confirmation and returns to the list', async () => {
    const { user, backend, task } = setup()

    await user.click(await screen.findByRole('button', { name: 'Delete Task' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Tasks list page')).toBeInTheDocument()
    expect(await screen.findByText('Task deleted')).toBeInTheDocument()
    expect(backend.state.tasks.some((item) => item._id === task._id)).toBe(false)
  })

  it('keeps the task when the deletion is cancelled', async () => {
    const { user, backend } = setup()

    await user.click(await screen.findByRole('button', { name: 'Delete Task' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(backend.state.tasks).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Prepare launch' })).toBeInTheDocument()
  })

  it('shows an error when the task does not exist', async () => {
    const currentUser = createFakeUser()
    const { session } = setupBackend({ currentUser, tasks: [] })
    renderWithProviders(routes, { route: '/tasks/missing', session })

    expect(await screen.findByRole('alert')).toHaveTextContent('Task not found')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
