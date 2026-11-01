'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { EmotionRegistry } from './EmotionRegistry'
import { system } from '@/shared/ui/theme'
import { createQueryClient } from './queryClient'

type AppProvidersProps = {
  queryClient?: QueryClient
  children: ReactNode
}

export function AppProviders({ queryClient, children }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient())

  return (
    <EmotionRegistry>
      <ChakraProvider value={system}>
        <QueryClientProvider client={client}>
          {children}
          <Toaster position="top-center" />
        </QueryClientProvider>
      </ChakraProvider>
    </EmotionRegistry>
  )
}
