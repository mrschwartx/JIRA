import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/shared/config/env'
import { createFakeUser } from '@/test/factories'
import { server } from '@/test/msw'
import { renderWithProviders, setupBackend } from '@/test/renderWithProviders'
import { MemoryRoutes } from '@/test/MemoryRoutes'
import { CreateTaskPage } from './CreateTaskPage'

const routes = (
  <MemoryRoutes
    routes={{
      '/create-task': <CreateTaskPage />,
      '/tasks/[taskId]': <p>Task detail page</p>,
    }}
  />
)

const fillForm = async (user: ReturnType<typeof renderWithProviders>['user']) => {
  await user.type(screen.getByLabelText('Task Name'), 'Plan sprint')
  await user.type(screen.getByLabelText('Description'), 'Pick the stories')
  await user.selectOptions(screen.getByLabelText('Priority'), 'high')
  await user.selectOptions(screen.getByLabelText('Status'), 'todo')
  await user.type(screen.getByLabelText('Due Date'), '03/01/2026 10:30 AM')
  await user.click(screen.getByRole('button', { name: 'Submit' }))
}

describe('CreateTaskPage', () => {
  it('validates required fields', async () => {
    const currentUser = createFakeUser()
    const { backend, session } = setupBackend({ currentUser })
    const { user } = renderWithProviders(routes, { route: '/create-task', session })

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('Task Name is required')).toBeInTheDocument()
    expect(screen.getByText('Due Date is required')).toBeInTheDocument()
    expect(backend.state.requests).toHaveLength(0)
  })

  it('creates a task and opens its detail page', async () => {
    const currentUser = createFakeUser()
    const { backend, session } = setupBackend({ currentUser })
    const { user } = renderWithProviders(routes, { route: '/create-task', session })

    await fillForm(user)

    expect(await screen.findByText('Task detail page')).toBeInTheDocument()
    expect(await screen.findByText('New Task Created: Plan sprint')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/tasks\/task-\d+$/)
    expect(backend.state.tasks).toHaveLength(1)
    expect(backend.state.tasks[0]).toMatchObject({
      userId: currentUser._id,
      name: 'Plan sprint',
      description: 'Pick the stories',
      priority: 'high',
      status: 'todo',
      due: new Date(2026, 2, 1, 10, 30).toISOString(),
    })
  })

  it('shows the server error and stays on the form', async () => {
    const currentUser = createFakeUser()
    const { session } = setupBackend({ currentUser })
    server.use(
      http.post(`${env.apiBaseUrl}/tasks/create`, () => HttpResponse.json({ message: 'Invalid task' }, { status: 400 })),
    )
    const { user } = renderWithProviders(routes, { route: '/create-task', session })

    await fillForm(user)

    expect(await screen.findByText('Invalid task')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/create-task')
  })
})
