import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import toast from 'react-hot-toast'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { memoryNavigation } from './next/navigation'
import { server } from './msw'

configure({ asyncUtilTimeout: 5000 })

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverStub

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})

Object.defineProperty(window, 'scrollTo', { writable: true, value: () => {} })
Element.prototype.scrollIntoView = () => {}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  cleanup()
  toast.remove()
  server.resetHandlers()
  memoryNavigation.reset()
  window.localStorage.clear()
  URL.createObjectURL = vi.fn(() => 'blob:taskly-preview')
  URL.revokeObjectURL = vi.fn()
})

afterAll(() => {
  server.close()
})
