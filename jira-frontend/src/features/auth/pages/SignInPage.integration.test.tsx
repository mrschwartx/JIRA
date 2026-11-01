import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '@/test/api'
import { makeUser } from '@/test/fixtures'
import { MemoryRoutes } from '@/test/MemoryRoutes'
import { renderWithProviders } from '@/test/renderWithProviders'
import { sessionStore } from '../store/sessionStore'
import { SignInPage } from './SignInPage'

const routes = (
  <MemoryRoutes
    routes={{
      '/signin': <SignInPage />,
      '/projects': <p>Projects page</p>,
      '/signup': <p>Sign up page</p>,
    }}
  />
)

describe('SignInPage', () => {
  it('validates required fields before calling the API', async () => {
    const requests = mockApi([])
    const { user } = renderWithProviders(routes, { route: '/signin', session: null })

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('signs in and opens the projects page', async () => {
    const account = makeUser({ username: 'jane', email: 'jane@example.com' })
    const requests = mockApi([{ method: 'post', path: '/auth/signin', body: account }])
    const { user } = renderWithProviders(routes, { route: '/signin', session: null })

    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Projects page')).toBeInTheDocument()
    expect(requests[0]?.body).toEqual({ email: 'jane@example.com', password: 'secret123' })
    expect(sessionStore.getSnapshot()).toMatchObject({ id: account.id, username: 'jane' })
  })

  it('shows the server message and stays on the page for wrong credentials', async () => {
    mockApi([{ method: 'post', path: '/auth/signin', status: 401, body: { status: 401, message: 'Invalid email or password' } }])
    const { user } = renderWithProviders(routes, { route: '/signin', session: null })

    await user.type(screen.getByLabelText('Email'), 'nobody@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/signin')
    expect(sessionStore.getSnapshot()).toBeNull()
  })
})
