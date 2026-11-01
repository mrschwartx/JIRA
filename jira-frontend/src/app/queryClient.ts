import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { sessionStore } from '@/features/auth'
import { ApiError } from '@/shared/api'

const MAX_RETRIES = 2

export const shouldRetry = (failureCount: number, error: unknown) => {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false
  }
  return failureCount < MAX_RETRIES
}

export const handleUnauthorized = (error: unknown) => {
  if (error instanceof ApiError && error.status === 401) {
    sessionStore.clear()
  }
}

type CreateQueryClientOptions = {
  retry?: boolean
}

export function createQueryClient({ retry = true }: CreateQueryClientOptions = {}) {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleUnauthorized }),
    mutationCache: new MutationCache({ onError: handleUnauthorized }),
    defaultOptions: {
      queries: {
        retry: retry ? shouldRetry : false,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  })
}
