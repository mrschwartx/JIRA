import { screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MemoryRoutes } from '@/test/MemoryRoutes'
import { renderWithProviders } from '@/test/renderWithProviders'
import { sessionStore } from '../store/sessionStore'
import { PrivateRoute } from './PrivateRoute'

const routes = (
  <MemoryRoutes
    routes={{
      '/signin': <p>Sign in page</p>,
      '/secret': (
        <PrivateRoute>
          <p>Secret page</p>
        </PrivateRoute>
      ),
    }}
  />
)

describe('PrivateRoute', () => {
  it('renders its children for an authenticated user', () => {
    renderWithProviders(routes, {
      route: '/secret',
      session: { _id: 'u1', username: 'jane', email: 'jane@example.com' },
    })

    expect(screen.getByText('Secret page')).toBeInTheDocument()
  })

  it('redirects anonymous visitors to the sign in page', () => {
    renderWithProviders(routes, { route: '/secret', session: null })

    expect(screen.getByText('Sign in page')).toBeInTheDocument()
    expect(screen.queryByText('Secret page')).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/signin')
  })

  it('renders nothing on the server, even when a session exists on the client', () => {
    sessionStore.setUser({ _id: 'u1', username: 'jane', email: 'jane@example.com' })

    const html = renderToString(
      <PrivateRoute>
        <p>Secret page</p>
      </PrivateRoute>,
    )

    expect(html).toBe('')
  })
})
