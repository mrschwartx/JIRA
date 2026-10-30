import { beforeEach, describe, expect, it } from 'vitest'
import { sessionStore } from '@/features/auth'
import { ApiError } from '@/shared/api'
import { createQueryClient, handleUnauthorized, shouldRetry } from './queryClient'

const user = { _id: 'u1', username: 'jane', email: 'jane@example.com' }

describe('shouldRetry', () => {
  it('never retries client errors', () => {
    expect(shouldRetry(0, new ApiError('Bad request', 400))).toBe(false)
    expect(shouldRetry(0, new ApiError('Unauthorized', 401))).toBe(false)
    expect(shouldRetry(0, new ApiError('Not found', 404))).toBe(false)
  })

  it('retries server and network errors up to the limit', () => {
    expect(shouldRetry(0, new ApiError('Server', 500))).toBe(true)
    expect(shouldRetry(1, new ApiError('Network', 0))).toBe(true)
    expect(shouldRetry(2, new ApiError('Server', 500))).toBe(false)
  })
})

describe('handleUnauthorized', () => {
  beforeEach(() => {
    sessionStore.setUser(user)
  })

  it('clears the session on 401 responses', () => {
    handleUnauthorized(new ApiError('Unauthorized', 401))

    expect(sessionStore.getSnapshot()).toBeNull()
  })

  it('keeps the session for other errors', () => {
    handleUnauthorized(new ApiError('Forbidden', 403))
    handleUnauthorized(new Error('Boom'))

    expect(sessionStore.getSnapshot()).toEqual(user)
  })
})

describe('createQueryClient', () => {
  it('disables retries on demand', () => {
    const client = createQueryClient({ retry: false })

    expect(client.getDefaultOptions().queries?.retry).toBe(false)
  })

  it('uses the retry policy by default', () => {
    const client = createQueryClient()

    expect(client.getDefaultOptions().queries?.retry).toBe(shouldRetry)
  })
})
