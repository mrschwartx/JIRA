'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { flushSync } from 'react-dom'
import { paths } from '@/shared/config/paths'
import { sessionStore } from '../store/sessionStore'

export function useEndSession() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return () => {
    flushSync(() => {
      sessionStore.clear()
    })
    queryClient.clear()
    router.push(paths.home)
  }
}
