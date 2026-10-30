import { act, renderHook } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { sessionStore } from '../store/sessionStore'
import { useSession } from './useSession'

const user = { _id: 'u1', username: 'jane', email: 'jane@example.com' }

describe('useSession', () => {
  beforeEach(() => {
    sessionStore.clear()
  })

  it('reflects the current session', () => {
    const { result } = renderHook(() => useSession())

    expect(result.current).toEqual({ user: null, isAuthenticated: false, isReady: true })
  })

  it('re-renders when the session changes', () => {
    const { result } = renderHook(() => useSession())

    act(() => sessionStore.setUser(user))
    expect(result.current).toEqual({ user, isAuthenticated: true, isReady: true })

    act(() => sessionStore.clear())
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('reports a signed-out, not ready state when rendered on the server', () => {
    sessionStore.setUser(user)

    function Probe() {
      const { isAuthenticated, isReady } = useSession()
      return <span>{`${isAuthenticated}-${isReady}`}</span>
    }

    expect(renderToString(<Probe />)).toContain('false-false')
  })
})
