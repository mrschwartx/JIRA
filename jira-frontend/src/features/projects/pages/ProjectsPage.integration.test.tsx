import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '@/test/api'
import { makeProject, makeUser } from '@/test/fixtures'
import { MemoryRoutes } from '@/test/MemoryRoutes'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ProjectsPage } from './ProjectsPage'

const routes = (
  <MemoryRoutes
    routes={{
      '/projects': <ProjectsPage />,
      '/projects/:projectId/board': <p>Board page</p>,
    }}
  />
)

describe('ProjectsPage', () => {
  it('lists the projects with their role', async () => {
    mockApi([
      {
        method: 'get',
        path: '/projects',
        body: [makeProject(), makeProject({ id: 'project-2', key: 'OPS', name: 'Operations', role: 'member' })],
      },
    ])
    renderWithProviders(routes, { route: '/projects', session: makeUser() })

    const first = await screen.findByRole('link', { name: /Jira Demo/ })
    expect(first).toHaveAttribute('href', '/projects/project-1/board')
    expect(within(first).getByText('Owner')).toBeInTheDocument()
    expect(within(screen.getByRole('link', { name: /Operations/ })).getByText('Member')).toBeInTheDocument()
  })

  it('invites the user to create a first project', async () => {
    mockApi([{ method: 'get', path: '/projects', body: [] }])
    renderWithProviders(routes, { route: '/projects', session: makeUser() })

    expect(await screen.findByText('You have no projects yet')).toBeInTheDocument()
  })

  it('shows an error with a retry button when loading fails', async () => {
    mockApi([{ method: 'get', path: '/projects', status: 500, body: { status: 500, message: 'Database is down' } }])
    renderWithProviders(routes, { route: '/projects', session: makeUser() })

    expect(await screen.findByRole('alert')).toHaveTextContent('Database is down')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('validates and creates a project, then opens its board', async () => {
    const created = makeProject({ id: 'project-9', key: 'NEW', name: 'Brand new' })
    const requests = mockApi([
      { method: 'get', path: '/projects', body: [] },
      { method: 'post', path: '/projects', status: 201, body: created },
    ])
    const { user } = renderWithProviders(routes, { route: '/projects', session: makeUser() })

    await user.click(await screen.findByRole('button', { name: 'Create your first project' }))
    await user.click(await screen.findByRole('button', { name: 'Create project' }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Key is required')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Name'), 'Brand new')
    await user.type(screen.getByLabelText('Key'), 'new')
    await user.click(screen.getByRole('button', { name: 'Create project' }))

    expect(await screen.findByText('Board page')).toBeInTheDocument()
    const post = requests.find((request) => request.method === 'POST')
    expect(post?.body).toMatchObject({ key: 'NEW', name: 'Brand new', category: 'software', url: null })
  })
})
