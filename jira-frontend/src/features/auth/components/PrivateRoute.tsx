'use client'

import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { paths } from '@/shared/config/paths'
import { useSession } from '../hooks/useSession'

type PrivateRouteProps = {
  children: ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isReady } = useSession()

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace(paths.signIn)
    }
  }, [isReady, isAuthenticated, router])

  return isReady && isAuthenticated ? <>{children}</> : null
}
