import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createFakeUser } from '@/test/factories'
import { renderWithProviders, setupBackend } from '@/test/renderWithProviders'
import { MemoryRoutes } from '@/test/MemoryRoutes'
import { sessionStore } from '../store/sessionStore'
import { SignInPage } from './SignInPage'

const routes = (
  <MemoryRoutes
    routes={{
      '/signin': <SignInPage />,
      '/signup': <p>Sign up page</p>,
      '/profile': <p>Profile page</p>,
    }}
  />
)

describe('SignInPage', () => {
  it('validates required fields before calling the API', async () => {
    const { backend } = setupBackend({ signedIn: false })
    const { user } = renderWithProviders(routes, { route: '/signin' })

    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(backend.state.requests).toHaveLength(0)
  })

  it('signs in with valid credentials and redirects to the profile', async () => {
    const account = createFakeUser({ email: 'jane@example.com', password: 'secret123', username: 'jane' })
    setupBackend({ signedIn: false, currentUser: account })
    const { user } = renderWithProviders(routes, { route: '/signin' })

    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(await screen.findByText('Profile page')).toBeInTheDocument()
    expect(await screen.findByText('Sign In Successful')).toBeInTheDocument()
    expect(sessionStore.getSnapshot()).toMatchObject({ _id: account._id, username: 'jane' })
    expect(sessionStore.getSnapshot()).not.toHaveProperty('password')
  })

  it('shows the server message and stays on the page for wrong credentials', async () => {
    setupBackend({ signedIn: false })
    const { user } = renderWithProviders(routes, { route: '/signin' })

    await user.type(screen.getByLabelText('Email'), 'nobody@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(await screen.findByText('Wrong credentials')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/signin')
    expect(sessionStore.getSnapshot()).toBeNull()
  })

  it('links to the sign up page', async () => {
    setupBackend({ signedIn: false })
    const { user } = renderWithProviders(routes, { route: '/signin' })

    await user.click(screen.getByRole('link', { name: 'Sign up' }))

    expect(screen.getByText('Sign up page')).toBeInTheDocument()
  })
})
