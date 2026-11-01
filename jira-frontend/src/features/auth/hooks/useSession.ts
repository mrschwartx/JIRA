'use client'

import { useSyncExternalStore } from 'react'
import { sessionStore } from '../store/sessionStore'

const subscribeToNothing = () => () => {}
const getClientReady = () => true
const getServerReady = () => false

export function useSession() {
  const user = useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot, sessionStore.getServerSnapshot)
  const isReady = useSyncExternalStore(subscribeToNothing, getClientReady, getServerReady)
  return { user, isAuthenticated: user !== null, isReady }
}
