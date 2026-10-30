import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { sessionStore } from '@/features/auth'
import { env } from '@/shared/config/env'
import { createFakeUser } from '@/test/factories'
import { renderWithProviders, setupBackend } from '@/test/renderWithProviders'
import { MemoryRoutes } from '@/test/MemoryRoutes'
import { ProfilePage } from './ProfilePage'

const routes = (
  <MemoryRoutes
    routes={{
      '/': <p>Home page</p>,
      '/profile': <ProfilePage />,
      '/tasks': <p>Tasks page</p>,
      '/create-task': <p>Create task page</p>,
    }}
  />
)

const setup = () => {
  const account = createFakeUser({ username: 'jane', email: 'jane@example.com' })
  const { backend, session } = setupBackend({ currentUser: account })
  const view = renderWithProviders(routes, { route: '/profile', session })
  return { account, backend, ...view }
}

describe('ProfilePage', () => {
  it('prefills the form with the current user', () => {
    setup()

    expect(screen.getByLabelText('Username')).toHaveValue('jane')
    expect(screen.getByLabelText('Email')).toHaveValue('jane@example.com')
    expect(screen.getByLabelText('New password')).toHaveValue('')
    expect(screen.getByRole('img', { name: 'profile' })).toHaveAttribute('src', '/images/users/default-avatar.svg')
  })

  it('validates required fields', async () => {
    const { user, backend } = setup()

    await user.clear(screen.getByLabelText('Username'))
    await user.click(screen.getByRole('button', { name: 'Update Profile' }))

    expect(await screen.findByText('Username is required')).toBeInTheDocument()
    expect(backend.state.requests).toHaveLength(0)
  })

  it('updates the profile without sending an empty password', async () => {
    const { user, backend, account } = setup()

    await user.clear(screen.getByLabelText('Username'))
    await user.type(screen.getByLabelText('Username'), 'jane-doe')
    await user.click(screen.getByRole('button', { name: 'Update Profile' }))

    expect(await screen.findByText('Profile Updated')).toBeInTheDocument()
    const patch = backend.state.requests.find((request) => request.method === 'PATCH')
    expect(patch?.path).toBe(`/users/update/${account._id}`)
    expect(patch?.body).toEqual({ username: 'jane-doe', email: 'jane@example.com' })
    expect(sessionStore.getSnapshot()?.username).toBe('jane-doe')
  })

  it('sends the new password when one is provided and clears the field afterwards', async () => {
    const { user, backend } = setup()

    await user.type(screen.getByLabelText('New password'), 'brand-new-secret')
    await user.click(screen.getByRole('button', { name: 'Update Profile' }))

    expect(await screen.findByText('Profile Updated')).toBeInTheDocument()
    expect(backend.state.requests.find((request) => request.method === 'PATCH')?.body).toMatchObject({
      password: 'brand-new-secret',
    })
    await waitFor(() => expect(screen.getByLabelText('New password')).toHaveValue(''))
  })

  it('uploads a new avatar before updating the profile', async () => {
    const { user, backend, account } = setup()
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    await user.upload(screen.getByLabelText('Avatar'), file)
    await waitFor(() => expect(screen.getByRole('img', { name: 'profile' })).toHaveAttribute('src', 'blob:taskly-preview'))
    await user.click(screen.getByRole('button', { name: 'Update Profile' }))

    expect(await screen.findByText('Profile Updated')).toBeInTheDocument()
    const calls = backend.state.requests.map((request) => `${request.method} ${request.path}`)
    expect(calls).toEqual([`POST /users/upload/${account._id}`, `PATCH /users/update/${account._id}`])
    expect(backend.state.requests[1]?.body).toMatchObject({ avatar: '/uploads/avatars/new-avatar.png' })
    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'profile' })).toHaveAttribute(
        'src',
        `${env.serverBaseUrl}/uploads/avatars/new-avatar.png`,
      ),
    )
  })

  it('deletes the account after confirmation', async () => {
    const { user, backend, account } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete Account' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Home page')).toBeInTheDocument()
    expect(await screen.findByText('User has been deleted')).toBeInTheDocument()
    expect(sessionStore.getSnapshot()).toBeNull()
    expect(backend.state.users.some((item) => item._id === account._id)).toBe(false)
  })

  it('keeps the account when the confirmation is cancelled', async () => {
    const { user, backend } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete Account' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(sessionStore.getSnapshot()).not.toBeNull()
    expect(backend.state.requests).toHaveLength(0)
  })

  it('signs out and returns to the home page', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Sign Out' }))

    expect(await screen.findByText('Home page')).toBeInTheDocument()
    expect(await screen.findByText('Signout success!')).toBeInTheDocument()
    expect(sessionStore.getSnapshot()).toBeNull()
  })

  it('links to the task pages', async () => {
    const { user } = setup()

    expect(screen.getByRole('link', { name: 'Create New Task' })).toHaveAttribute('href', '/create-task')
    await user.click(screen.getByRole('link', { name: 'Show Tasks' }))

    expect(screen.getByText('Tasks page')).toBeInTheDocument()
  })
})
