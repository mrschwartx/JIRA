import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { sessionStore } from '@/features/auth'
import { createFakeTask, createFakeUser } from '@/test/factories'
import { renderWithProviders, setupBackend } from '@/test/renderWithProviders'
import { TestApp } from '@/test/TestApp'

const chooseMenuItem = async (
  user: ReturnType<typeof renderWithProviders>['user'],
  arrowPresses: number,
) => {
  await user.click(screen.getByRole('button', { name: 'Open user menu' }))
  const menu = await screen.findByRole('menu')
  await waitFor(() => expect(menu).toHaveFocus())
  await user.keyboard(`${'{ArrowDown}'.repeat(arrowPresses)}{Enter}`)
}

describe('App', () => {
  it('renders the landing page for anonymous visitors', () => {
    setupBackend({ signedIn: false })
    renderWithProviders(<TestApp />, { route: '/' })

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/make your\s*perfect\s*day/i)
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/signin')
    expect(screen.getByRole('img', { name: 'Productive Illustration' })).toBeInTheDocument()
  })

  it.each(['/profile', '/tasks', '/create-task', '/tasks/abc', '/update-task/abc'])(
    'redirects anonymous visitors from %s to the sign in page',
    (route) => {
      setupBackend({ signedIn: false })
      renderWithProviders(<TestApp />, { route })

      expect(screen.getByRole('heading', { name: 'Enter Your Credentials' })).toBeInTheDocument()
      expect(screen.getByTestId('location')).toHaveTextContent('/signin')
    },
  )

  it('sends the visitor from the landing page call to action to the profile once signed in', async () => {
    const { session } = setupBackend()
    const { user } = renderWithProviders(<TestApp />, { route: '/', session })

    await user.click(screen.getByRole('link', { name: /let's get started/i }))

    expect(await screen.findByRole('heading', { name: 'Your Profile' })).toBeInTheDocument()
  })

  it('lets a user sign in, create a task and find it in the list', async () => {
    const account = createFakeUser({ email: 'jane@example.com', password: 'secret123' })
    setupBackend({ signedIn: false, currentUser: account })
    const { user } = renderWithProviders(<TestApp />, { route: '/signin' })

    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(await screen.findByRole('heading', { name: 'Your Profile' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Create New Task' }))
    await user.type(await screen.findByLabelText('Task Name'), 'Ship the release')
    await user.type(screen.getByLabelText('Description'), 'Tag and publish')
    await user.selectOptions(screen.getByLabelText('Priority'), 'high')
    await user.selectOptions(screen.getByLabelText('Status'), 'todo')
    await user.type(screen.getByLabelText('Due Date'), '03/01/2026 10:30 AM')
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByRole('heading', { name: 'Ship the release' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /all tasks/i }))

    expect(await screen.findByRole('link', { name: 'Ship the release' })).toBeInTheDocument()
  })

  it('opens the user menu to visit the profile and sign out', async () => {
    const account = createFakeUser({ username: 'jane' })
    const { session } = setupBackend({ currentUser: account, tasks: [createFakeTask(account._id)] })
    const { user } = renderWithProviders(<TestApp />, { route: '/tasks', session })
    await screen.findByRole('heading', { name: 'MY TASKS' })

    expect(screen.getByRole('img', { name: 'jane' })).toBeInTheDocument()

    await chooseMenuItem(user, 1)
    expect(await screen.findByRole('heading', { name: 'Your Profile' })).toBeInTheDocument()

    await chooseMenuItem(user, 2)

    expect(await screen.findByText('Signout success!')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Sign In' })).toBeInTheDocument()
    expect(sessionStore.getSnapshot()).toBeNull()
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/)
  })

  it('signs the user out locally when the server session has expired', async () => {
    const account = createFakeUser()
    const { session, backend } = setupBackend({ currentUser: account })
    backend.state.sessionUserId = null

    renderWithProviders(<TestApp />, { route: '/tasks', session })

    expect(await screen.findByRole('heading', { name: 'Enter Your Credentials' })).toBeInTheDocument()
    expect(sessionStore.getSnapshot()).toBeNull()
    expect(screen.getByTestId('location')).toHaveTextContent('/signin')
  })

  it('deletes the account from the profile and lands on the landing page', async () => {
    const account = createFakeUser()
    const { session, backend } = setupBackend({ currentUser: account })
    const { user } = renderWithProviders(<TestApp />, { route: '/profile', session })

    await user.click(await screen.findByRole('button', { name: 'Delete Account' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByRole('link', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/)
    expect(sessionStore.getSnapshot()).toBeNull()
    expect(backend.state.users).toHaveLength(0)
  })
})
