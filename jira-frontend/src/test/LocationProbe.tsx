'use client'

import { usePathname, useSearchParams } from 'next/navigation'

export function LocationProbe() {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  return <div data-testid="location">{search ? `${pathname}?${search}` : pathname}</div>
}
