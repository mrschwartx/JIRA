import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '@/test/api'
import { makeIssue, makeMember, makeProject, makeUser } from '@/test/fixtures'
import { MemoryRoutes } from '@/test/MemoryRoutes'
import { renderWithProviders } from '@/test/renderWithProviders'
import { BoardPage } from './BoardPage'

const alice = makeMember()
const bob = makeMember({ id: 'user-2', username: 'bob', email: 'bob@example.com', role: 'member' })

const issues = [
  makeIssue({ id: 'i1', number: 1, title: 'Fix login redirect', status: 'backlog', assigneeIds: ['user-1'] }),
  makeIssue({ id: 'i2', number: 2, title: 'Dark mode', type: 'story', status: 'backlog', listPosition: 2, assigneeIds: ['user-2'] }),
  makeIssue({ id: 'i3', number: 3, title: 'Set up CI', type: 'task', status: 'done' }),
]

const routes = (
  <MemoryRoutes
    routes={{
      '/projects/:projectId/board': <BoardPage projectId="project-1" />,
      '/projects/:projectId/board/issues/:issueId': <BoardPage projectId="project-1" issueId="i1" />,
    }}
  />
)

const baseApi = (extra: Parameters<typeof mockApi>[0] = []) =>
  mockApi([
    ...extra,
    { method: 'get', path: '/projects/project-1', body: makeProject() },
    { method: 'get', path: '/projects/project-1/members', body: [alice, bob] },
    { method: 'get', path: '/projects/project-1/issues', body: issues },
    { method: 'get', path: '/projects/project-1/issues/i1/comments', body: [] },
  ])

const column = (name: string) => screen.getByRole('group', { name })

describe('BoardPage', () => {
  it('places every issue in the column of its status', async () => {
    baseApi()
    renderWithProviders(routes, { route: '/projects/project-1/board', session: makeUser() })

    expect(await within(await screen.findByRole('group', { name: 'Backlog' })).findByText('Fix login redirect')).toBeInTheDocument()
    expect(within(column('Backlog')).getByText('Dark mode')).toBeInTheDocument()
    expect(within(column('Done')).getByText('Set up CI')).toBeInTheDocument()
    expect(within(column('In progress')).queryByRole('link')).not.toBeInTheDocument()
    expect(within(column('Backlog')).getByLabelText('2 issues')).toBeInTheDocument()
  })

  it('shows issue keys and assignees on the cards', async () => {
    baseApi()
    renderWithProviders(routes, { route: '/projects/project-1/board', session: makeUser() })

    const card = await screen.findByRole('link', { name: 'JIRA-1 Fix login redirect' })
    expect(within(card).getByLabelText('Assigned to alice')).toBeInTheDocument()
    expect(card).toHaveAttribute('href', '/projects/project-1/board/issues/i1')
  })

  it('filters by title, assignee and only my issues, and clears the filters', async () => {
    baseApi()
    const { user } = renderWithProviders(routes, { route: '/projects/project-1/board', session: makeUser() })
    await screen.findByText('Fix login redirect')

    await user.type(screen.getByLabelText('Filter issues by title'), 'dark')
    expect(screen.queryByText('Fix login redirect')).not.toBeInTheDocument()
    expect(screen.getByText('Dark mode')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.getByText('Fix login redirect')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show issues assigned to bob' }))
    expect(screen.queryByText('Fix login redirect')).not.toBeInTheDocument()
    expect(screen.getByText('Dark mode')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    await user.click(screen.getByRole('button', { name: 'Only my issues' }))
    expect(screen.getByText('Fix login redirect')).toBeInTheDocument()
    expect(screen.queryByText('Dark mode')).not.toBeInTheDocument()
    expect(screen.queryByText('Set up CI')).not.toBeInTheDocument()
  })

  it('shows an error when the board cannot be loaded', async () => {
    mockApi([
      { method: 'get', path: '/projects/project-1', body: makeProject() },
      { method: 'get', path: '/projects/project-1/members', body: [alice] },
      { method: 'get', path: '/projects/project-1/issues', status: 500, body: { status: 500, message: 'Boom' } },
    ])
    renderWithProviders(routes, { route: '/projects/project-1/board', session: makeUser() })

    expect(await screen.findByRole('alert')).toHaveTextContent('Boom')
  })

  it('creates an issue from the create dialog', async () => {
    const created = makeIssue({ id: 'i9', number: 4, title: 'Brand new bug' })
    const requests = baseApi([{ method: 'post', path: '/projects/project-1/issues', status: 201, body: created }])
    const { user } = renderWithProviders(routes, { route: '/projects/project-1/board', session: makeUser() })

    await user.click(await screen.findByRole('button', { name: /Create issue/ }))
    await user.click(await screen.findByRole('button', { name: 'Create issue', hidden: false }))
    expect(await screen.findByText('Summary is required')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Short summary'), 'Brand new bug')
    await user.click(screen.getByLabelText('bob'))
    await user.click(screen.getByRole('button', { name: 'Create issue' }))

    expect(await screen.findByText('Issue created')).toBeInTheDocument()
    const post = requests.find((request) => request.method === 'POST')
    expect(post?.body).toMatchObject({ title: 'Brand new bug', type: 'task', priority: 'medium', reporterId: 'user-1', assigneeIds: ['user-2'] })
  })

  it('opens the details of an issue from its route', async () => {
    baseApi()
    renderWithProviders(routes, { route: '/projects/project-1/board/issues/i1', session: makeUser() })

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Title')).toHaveValue('Fix login redirect')
    expect(within(dialog).getByText('JIRA-1')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Status')).toHaveValue('backlog')
  })

  it('saves every change made in the details, even when they overlap', async () => {
    let current = { ...issues[0] }
    const requests = baseApi([
      { method: 'get', path: '/projects/project-1/issues', body: () => [current, ...issues.slice(1)] },
      { method: 'patch', path: '/projects/project-1/issues/i1', body: (request) => (current = { ...current, ...(request.body as object) } as typeof current) },
    ])
    const { user } = renderWithProviders(routes, { route: '/projects/project-1/board/issues/i1', session: makeUser() })
    const dialog = await screen.findByRole('dialog')

    await user.selectOptions(within(dialog).getByLabelText('Status'), 'done')
    await user.selectOptions(within(dialog).getByLabelText('Priority'), 'lowest')
    await user.selectOptions(within(dialog).getByLabelText('Add assignee'), 'user-2')
    await user.type(within(dialog).getByLabelText('Time spent (hours)'), '3')
    await user.tab()

    const patches = () => requests.filter((request) => request.method === 'PATCH').map((request) => request.body)
    await waitFor(() => expect(patches()).toHaveLength(4))
    expect(patches()).toEqual([
      { status: 'done' },
      { priority: 'lowest' },
      { assigneeIds: ['user-1', 'user-2'] },
      { timeSpent: 3 },
    ])
    await waitFor(() => {
      expect(within(dialog).getByLabelText('Time spent (hours)')).toHaveValue('3')
      expect(within(dialog).getByLabelText('Status')).toHaveValue('done')
      expect(within(dialog).getByLabelText('Priority')).toHaveValue('lowest')
    })
  })

  it('rejects invalid hours without calling the API', async () => {
    const requests = baseApi()
    const { user } = renderWithProviders(routes, { route: '/projects/project-1/board/issues/i1', session: makeUser() })
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText('Original estimate (hours)'), '-4')
    await user.tab()

    expect(await within(dialog).findByText(/Enter whole hours/)).toBeInTheDocument()
    expect(requests.some((request) => request.method === 'PATCH')).toBe(false)
  })

  it('deletes an issue after confirmation and returns to the board', async () => {
    const requests = baseApi([{ method: 'delete', path: '/projects/project-1/issues/i1', status: 204 }])
    const { user } = renderWithProviders(routes, { route: '/projects/project-1/board/issues/i1', session: makeUser() })

    await user.click(await screen.findByRole('button', { name: /Delete/ }))
    const confirm = await screen.findByRole('alertdialog')
    await user.click(within(confirm).getByRole('button', { name: /Delete/ }))

    expect(await screen.findByText('Issue deleted')).toBeInTheDocument()
    expect(requests.some((request) => request.method === 'DELETE' && request.path === '/projects/project-1/issues/i1')).toBe(true)
    expect(screen.getByTestId('location')).toHaveTextContent('/projects/project-1/board')
  })

  it('says so when the issue does not exist', async () => {
    baseApi()
    renderWithProviders(<BoardPage projectId="project-1" issueId="missing" />, { route: '/projects/project-1/board/issues/missing', session: makeUser() })

    expect(await screen.findByText('Issue not found')).toBeInTheDocument()
  })
})
