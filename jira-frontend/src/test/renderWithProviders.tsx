import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { QueryClient } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import { AppProviders } from '@/app/AppProviders'
import { createQueryClient } from '@/app/queryClient'
import { sessionStore, type User } from '@/features/auth'
import { LocationProbe } from './LocationProbe'
import { memoryNavigation } from './next/navigation'

type RenderOptions = {
  route?: string
  session?: User | null
  queryClient?: QueryClient
}

export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  const { route = '/', session, queryClient = createQueryClient({ retry: false }) } = options

  if (session !== undefined) {
    sessionStore.setUser(session)
  }

  memoryNavigation.reset(route)

  const user = userEvent.setup()

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AppProviders queryClient={queryClient}>
      {children}
      <LocationProbe />
    </AppProviders>
  )

  const result = render(ui, { wrapper: Wrapper })

  return { user, queryClient, ...result }
}
