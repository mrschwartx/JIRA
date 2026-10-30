import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SESSION_STORAGE_KEY, sessionStore } from './sessionStore'

const user = { _id: 'u1', username: 'jane', email: 'jane@example.com' }

describe('sessionStore', () => {
  beforeEach(() => {
    sessionStore.clear()
  })

  it('starts without a user', () => {
    expect(sessionStore.getSnapshot()).toBeNull()
  })

  it('stores the user and persists it', () => {
    sessionStore.setUser(user)

    expect(sessionStore.getSnapshot()).toEqual(user)
    expect(JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) ?? 'null')).toEqual(user)
  })

  it('clears the user and the persisted value', () => {
    sessionStore.setUser(user)
    sessionStore.clear()

    expect(sessionStore.getSnapshot()).toBeNull()
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('notifies subscribers until they unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = sessionStore.subscribe(listener)

    sessionStore.setUser(user)
    unsubscribe()
    sessionStore.clear()

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('syncs with storage events from other tabs', () => {
    const listener = vi.fn()
    const unsubscribe = sessionStore.subscribe(listener)

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
    window.dispatchEvent(new StorageEvent('storage', { key: SESSION_STORAGE_KEY }))

    expect(sessionStore.getSnapshot()).toEqual(user)
    expect(listener).toHaveBeenCalledTimes(1)

    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    window.dispatchEvent(new StorageEvent('storage', { key: SESSION_STORAGE_KEY }))
    expect(sessionStore.getSnapshot()).toBeNull()

    unsubscribe()
  })

  it('ignores storage events for unrelated keys', () => {
    sessionStore.setUser(user)
    window.dispatchEvent(new StorageEvent('storage', { key: 'other' }))

    expect(sessionStore.getSnapshot()).toEqual(user)
  })
})
