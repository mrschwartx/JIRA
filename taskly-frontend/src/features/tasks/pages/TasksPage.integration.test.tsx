import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/shared/config/env'
import { createFakeTask, createFakeTasks, createFakeUser } from '@/test/factories'
import { server } from '@/test/msw'
import { renderWithProviders, setupBackend } from '@/test/renderWithProviders'
import { MemoryRoutes } from '@/test/MemoryRoutes'
import { TasksPage } from './TasksPage'

const routes = (
  <MemoryRoutes
    routes={{
      '/tasks': <TasksPage />,
      '/create-task': <p>Create task page</p>,
      '/tasks/[taskId]': <p>Task detail page</p>,
    }}
  />
)

const bodyRows = () => screen.getAllByRole('row').slice(1)

const setup = (tasks = createFakeTasks('user-owner', 9), route = '/tasks') => {
  const currentUser = createFakeUser({ _id: 'user-owner' })
  const { backend, session } = setupBackend({ currentUser, tasks })
  const view = renderWithProviders(routes, { route, session })
  return { backend, ...view }
}

describe('TasksPage', () => {
  it('shows a skeleton while loading and then the first page of tasks', async () => {
    setup()

    expect(screen.getByLabelText('Loading tasks')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'MY TASKS' })).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(4)
    expect(screen.getByRole('link', { name: 'Task 01' })).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
  })

  it('paginates through the task list using the url', async () => {
    const { user } = setup()
    await screen.findByText('Page 1 of 3')

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    expect(await screen.findByRole('link', { name: 'Task 05' })).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/tasks?page=2')

    await user.click(screen.getByRole('button', { name: 'Last page' }))

    expect(await screen.findByRole('link', { name: 'Task 09' })).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('opens directly on the page given in the url', async () => {
    setup(createFakeTasks('user-owner', 9), '/tasks?page=3')

    expect(await screen.findByRole('link', { name: 'Task 09' })).toBeInTheDocument()
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
  })

  it('filters by status and resets to the first page', async () => {
    const tasks = [
      ...createFakeTasks('user-owner', 6, { status: 'todo' }),
      createFakeTask('user-owner', { name: 'Finished job', status: 'done' }),
    ]
    const { user, backend } = setup(tasks, '/tasks?page=2')
    await screen.findByText('Page 2 of 2')

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'done')

    expect(await screen.findByRole('link', { name: 'Finished job' })).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByTestId('location')).toHaveTextContent('/tasks?status=done')
    const lastRequest = backend.state.requests.at(-1)
    expect(lastRequest?.searchParams.get('status')).toBe('done')
    expect(lastRequest?.searchParams.has('page')).toBe(false)

    await user.selectOptions(screen.getByLabelText('Filter by status'), '')

    await waitFor(() => expect(bodyRows()).toHaveLength(4))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/tasks$/)
  })

  it('sorts by the clicked column', async () => {
    const tasks = [
      createFakeTask('user-owner', { name: 'Charlie' }),
      createFakeTask('user-owner', { name: 'Alpha' }),
      createFakeTask('user-owner', { name: 'Bravo' }),
    ]
    const { user } = setup(tasks)
    await screen.findByRole('link', { name: 'Charlie' })

    await user.click(screen.getByRole('button', { name: 'Task' }))

    await waitFor(() => {
      expect(within(bodyRows()[0]!).getByRole('link')).toHaveTextContent('Alpha')
    })
    expect(within(bodyRows()[2]!).getByRole('link')).toHaveTextContent('Charlie')
    expect(screen.getByRole('columnheader', { name: 'Task' })).toHaveAttribute('aria-sort', 'ascending')
    expect(screen.getByTestId('location')).toHaveTextContent('/tasks?orderBy=name')
  })

  it('renders priority, status and due date details', async () => {
    const due = '2026-03-01T10:00:00.000Z'
    setup([createFakeTask('user-owner', { name: 'Ship it', priority: 'high', status: 'done', due })])

    const row = (await screen.findByRole('link', { name: 'Ship it' })).closest('tr')!

    expect(within(row).getByText('High')).toBeInTheDocument()
    expect(within(row).getByText('Done')).toBeInTheDocument()
    expect(within(row).getByText(new Date(due).toDateString())).toBeInTheDocument()
  })

  it('shows an empty state when there are no tasks', async () => {
    setup([])

    expect(await screen.findByText('No tasks found')).toBeInTheDocument()
    expect(screen.queryByText(/page 1 of/i)).not.toBeInTheDocument()
  })

  it('navigates to the task detail and create pages', async () => {
    const { user } = setup([createFakeTask('user-owner', { _id: 'task-abc', name: 'Open me' })])

    await user.click(await screen.findByRole('link', { name: 'Open me' }))

    expect(screen.getByText('Task detail page')).toBeInTheDocument()
  })

  it('links to the create page', async () => {
    const { user } = setup([])

    await user.click(await screen.findByRole('link', { name: 'Create New Task' }))

    expect(screen.getByText('Create task page')).toBeInTheDocument()
  })

  it('shows an error and recovers when retrying', async () => {
    const currentUser = createFakeUser({ _id: 'user-owner' })
    const { session } = setupBackend({ currentUser, tasks: [] })
    let calls = 0
    server.use(
      http.get(`${env.apiBaseUrl}/tasks/user/:userId`, () => {
        calls += 1
        if (calls === 1) {
          return HttpResponse.json({ message: 'Database is down' }, { status: 500 })
        }
        return HttpResponse.json({ tasks: [{ _id: 't1', name: 'Recovered', description: '', priority: 'high', status: 'todo', due: '2026-03-01T10:00:00.000Z' }], taskCount: 1 })
      }),
    )
    const { user } = renderWithProviders(routes, { route: '/tasks', session })

    expect(await screen.findByRole('alert')).toHaveTextContent('Database is down')

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('link', { name: 'Recovered' })).toBeInTheDocument()
  })
})
