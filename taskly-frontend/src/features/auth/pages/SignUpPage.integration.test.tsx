import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createFakeUser } from '@/test/factories'
import { renderWithProviders, setupBackend } from '@/test/renderWithProviders'
import { MemoryRoutes } from '@/test/MemoryRoutes'
import { sessionStore } from '../store/sessionStore'
import { SignUpPage } from './SignUpPage'

const routes = (
  <MemoryRoutes
    routes={{
      '/signup': <SignUpPage />,
      '/signin': <p>Sign in page</p>,
      '/profile': <p>Profile page</p>,
    }}
  />
)

const fillForm = async (user: ReturnType<typeof renderWithProviders>['user'], email: string) => {
  await user.type(screen.getByLabelText('Username'), 'newbie')
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), 'secret123')
  await user.click(screen.getByRole('button', { name: 'Sign Up' }))
}

describe('SignUpPage', () => {
  it('validates required fields', async () => {
    const { backend } = setupBackend({ signedIn: false })
    const { user } = renderWithProviders(routes, { route: '/signup' })

    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    expect(await screen.findByText('Username is required')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(backend.state.requests).toHaveLength(0)
  })

  it('creates an account, signs in and redirects to the profile', async () => {
    const { backend } = setupBackend({ signedIn: false })
    const { user } = renderWithProviders(routes, { route: '/signup' })

    await fillForm(user, 'newbie@example.com')

    expect(await screen.findByText('Profile page')).toBeInTheDocument()
    expect(await screen.findByText('Sign Up Successful. You are now logged in')).toBeInTheDocument()
    expect(sessionStore.getSnapshot()).toMatchObject({ username: 'newbie', email: 'newbie@example.com' })
    expect(backend.state.users.some((account) => account.email === 'newbie@example.com')).toBe(true)
  })

  it('shows the server error when the email is already registered', async () => {
    setupBackend({ signedIn: false, users: [createFakeUser({ email: 'taken@example.com' })] })
    const { user } = renderWithProviders(routes, { route: '/signup' })

    await fillForm(user, 'taken@example.com')

    expect(await screen.findByText('Email already in use')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/signup')
    expect(sessionStore.getSnapshot()).toBeNull()
  })

  it('links to the sign in page', async () => {
    setupBackend({ signedIn: false })
    const { user } = renderWithProviders(routes, { route: '/signup' })

    await user.click(screen.getByRole('link', { name: 'Sign in' }))

    expect(screen.getByText('Sign in page')).toBeInTheDocument()
  })
})
