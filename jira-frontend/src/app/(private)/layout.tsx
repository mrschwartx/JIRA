import type { ReactNode } from 'react'
import { PrivateRoute } from '@/features/auth'

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return <PrivateRoute>{children}</PrivateRoute>
}
