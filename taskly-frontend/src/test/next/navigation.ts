import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'

type Listener = () => void
type Params = Record<string, string>

const BASE = 'http://localhost'
const listeners = new Set<Listener>()
const stack: string[] = ['/']
let index = 0

const emit = () => {
  listeners.forEach((listener) => listener())
}

const normalize = (url: string) => {
  const parsed = new URL(url, BASE)
  return `${parsed.pathname}${parsed.search}`
}

const visit = (url: string, mode: 'push' | 'replace') => {
  const next = normalize(url)
  if (mode === 'push') {
    stack.splice(index + 1)
    stack.push(next)
    index = stack.length - 1
  } else {
    stack[index] = next
  }
  emit()
}

const go = (delta: number) => {
  const target = index + delta
  if (target >= 0 && target < stack.length) {
    index = target
    emit()
  }
}

export const memoryNavigation = {
  getUrl: () => stack[index] ?? '/',
  subscribe: (listener: Listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  reset: (url = '/') => {
    stack.splice(0, stack.length, normalize(url))
    index = 0
    emit()
  },
  push: (url: string) => visit(url, 'push'),
  replace: (url: string) => visit(url, 'replace'),
  back: () => go(-1),
  forward: () => go(1),
}

export const ParamsContext = createContext<Params>({})

const router = {
  push: memoryNavigation.push,
  replace: memoryNavigation.replace,
  back: memoryNavigation.back,
  forward: memoryNavigation.forward,
  refresh: () => {},
  prefetch: () => {},
}

const useUrl = () => useSyncExternalStore(memoryNavigation.subscribe, memoryNavigation.getUrl, memoryNavigation.getUrl)

export const useRouter = () => router

export const usePathname = () => new URL(useUrl(), BASE).pathname

export const useSearchParams = () => {
  const search = new URL(useUrl(), BASE).search
  return useMemo(() => new URLSearchParams(search), [search])
}

export const useParams = () => useContext(ParamsContext)

export const useServerInsertedHTML = () => {}
