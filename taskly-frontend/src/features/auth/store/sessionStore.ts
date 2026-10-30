import { readJson, removeItem, writeJson } from '@/shared/lib/storage'
import type { User } from '../types'

export const SESSION_STORAGE_KEY = 'taskly_user'

type Listener = () => void

const listeners = new Set<Listener>()
let snapshot: User | null = readJson<User | null>(SESSION_STORAGE_KEY, null)

const emit = () => {
  listeners.forEach((listener) => listener())
}

const setUser = (user: User | null) => {
  snapshot = user
  if (user) {
    writeJson(SESSION_STORAGE_KEY, user)
  } else {
    removeItem(SESSION_STORAGE_KEY)
  }
  emit()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === SESSION_STORAGE_KEY || event.key === null) {
      snapshot = readJson<User | null>(SESSION_STORAGE_KEY, null)
      emit()
    }
  })
}

export const sessionStore = {
  getSnapshot: () => snapshot,
  getServerSnapshot: (): User | null => null,
  subscribe: (listener: Listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  setUser,
  clear: () => setUser(null),
}
