import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createFakeTask, createFakeUser } from '@/test/factories'
import { renderWithProviders, setupBackend } from '@/test/renderWithProviders'
import { MemoryRoutes } from '@/test/MemoryRoutes'
import { UpdateTaskPage } from './UpdateTaskPage'

const routes = (
  <MemoryRoutes
    routes={{
      '/update-task/[taskId]': <UpdateTaskPage />,
      '/tasks/[taskId]': <p>Task detail page</p>,
    }}
  />
)

const setup = () => {
  const currentUser = createFakeUser()
  const task = createFakeTask(currentUser._id, {
    _id: 'task-edit',
    name: 'Old name',
    description: 'Old description',
    priority: 'low',
    status: 'todo',
    due: '2026-03-01T10:00:00.000Z',
  })
  const { backend, session } = setupBackend({ currentUser, tasks: [task] })
  const view = renderWithProviders(routes, { route: `/update-task/${task._id}`, session })
  return { task, backend, ...view }
}

describe('UpdateTaskPage', () => {
  it('shows a skeleton and then the prefilled form', async () => {
    setup()

    expect(screen.getByLabelText('Loading task form')).toBeInTheDocument()
    expect(await screen.findByLabelText('Task Name')).toHaveValue('Old name')
    expect(screen.getByLabelText('Description')).toHaveValue('Old description')
    expect(screen.getByLabelText('Priority')).toHaveValue('low')
    expect(screen.getByLabelText('Status')).toHaveValue('todo')
    expect(screen.getByRole('heading', { name: 'Update Task' })).toBeInTheDocument()
  })

  it('saves the changes and returns to the task detail page', async () => {
    const { user, backend, task } = setup()

    const nameInput = await screen.findByLabelText('Task Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'New name')
    await user.selectOptions(screen.getByLabelText('Status'), 'done')
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('Task detail page')).toBeInTheDocument()
    expect(await screen.findByText('Task Updated: New name')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(`/tasks/${task._id}`)
    expect(backend.state.tasks[0]).toMatchObject({ name: 'New name', status: 'done', due: task.due })
  })

  it('requires a due date before saving', async () => {
    const { user, backend } = setup()

    const dueInput = await screen.findByLabelText('Due Date')
    await user.clear(dueInput)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('Due Date is required')).toBeInTheDocument()
    expect(backend.state.requests.filter((request) => request.method === 'PATCH')).toHaveLength(0)
  })

  it('validates required fields before saving', async () => {
    const { user, backend } = setup()

    await user.clear(await screen.findByLabelText('Description'))
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('Description is required')).toBeInTheDocument()
    expect(backend.state.requests.filter((request) => request.method === 'PATCH')).toHaveLength(0)
  })

  it('shows an error when the task cannot be loaded', async () => {
    const currentUser = createFakeUser()
    const { session } = setupBackend({ currentUser })
    renderWithProviders(routes, { route: '/update-task/missing', session })

    expect(await screen.findByRole('alert')).toHaveTextContent('Task not found')
  })
})
