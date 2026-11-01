import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '@/test/api'
import { makeUser } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { Comment } from '../types'
import { CommentsSection } from './CommentsSection'

const author = { id: 'user-1', username: 'alice', avatar: '/a.jpg' }
const other = { id: 'user-2', username: 'bob', avatar: '/b.jpg' }

const comment = (id: string, body: string, by: Comment['author']): Comment => ({
  id,
  issueId: 'i1',
  body,
  author: by,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const base = '/projects/project-1/issues/i1/comments'

const renderSection = (isOwner = false) =>
  renderWithProviders(<CommentsSection projectId="project-1" issueId="i1" currentUserId="user-1" isOwner={isOwner} />, {
    session: makeUser(),
  })

describe('CommentsSection', () => {
  it('lists comments and lets the author edit and delete only their own', async () => {
    mockApi([{ method: 'get', path: base, body: [comment('c1', 'mine', author), comment('c2', 'theirs', other), comment('c3', 'former', null)] }])
    renderSection()

    expect(await screen.findByText('mine')).toBeInTheDocument()
    expect(screen.getByText('Former member')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1)
  })

  it('lets the project owner delete comments of others but not edit them', async () => {
    mockApi([{ method: 'get', path: base, body: [comment('c2', 'theirs', other)] }])
    renderSection(true)

    await screen.findByText('theirs')
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('posts a new comment and clears the field', async () => {
    const requests = mockApi([
      { method: 'get', path: base, body: [] },
      { method: 'post', path: base, status: 201, body: comment('c9', 'hello team', author) },
    ])
    const { user } = renderSection()

    expect(await screen.findByText('No comments yet.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Add a comment'), 'hello team')
    await user.click(screen.getByRole('button', { name: 'Save comment' }))

    await screen.findByLabelText('Add a comment')
    expect(requests.find((request) => request.method === 'POST')?.body).toEqual({ body: 'hello team' })
    expect(screen.getByLabelText('Add a comment')).toHaveValue('')
  })

  it('edits a comment', async () => {
    const requests = mockApi([
      { method: 'get', path: base, body: [comment('c1', 'mine', author)] },
      { method: 'patch', path: `${base}/c1`, body: comment('c1', 'edited', author) },
    ])
    const { user } = renderSection()

    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    const field = screen.getByLabelText('Edit comment')
    await user.clear(field)
    await user.type(field, 'edited')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await screen.findByRole('button', { name: 'Edit' })
    expect(requests.find((request) => request.method === 'PATCH')?.body).toEqual({ body: 'edited' })
  })

  it('deletes a comment after confirmation', async () => {
    const requests = mockApi([
      { method: 'get', path: base, body: [comment('c1', 'mine', author)] },
      { method: 'delete', path: `${base}/c1`, status: 204 },
    ])
    const { user } = renderSection()

    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    const confirm = await screen.findByRole('alertdialog')
    await user.click(within(confirm).getByRole('button', { name: /Delete/ }))

    await screen.findByText('mine')
    expect(requests.some((request) => request.method === 'DELETE')).toBe(true)
  })
})
