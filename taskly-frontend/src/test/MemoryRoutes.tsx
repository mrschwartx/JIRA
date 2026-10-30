import { useSyncExternalStore, type ReactNode } from 'react'
import { memoryNavigation, ParamsContext } from './next/navigation'

type MemoryRoutesProps = {
  routes: Record<string, ReactNode>
}

const matchPattern = (pattern: string, pathname: string) => {
  const patternSegments = pattern.split('/').filter(Boolean)
  const pathSegments = pathname.split('/').filter(Boolean)

  if (patternSegments.length !== pathSegments.length) {
    return null
  }

  const params: Record<string, string> = {}
  for (const [position, segment] of patternSegments.entries()) {
    const actual = pathSegments[position] ?? ''
    const dynamic = /^\[(\w+)\]$/.exec(segment)
    if (dynamic?.[1]) {
      params[dynamic[1]] = decodeURIComponent(actual)
    } else if (segment !== actual) {
      return null
    }
  }
  return params
}

export function MemoryRoutes({ routes }: MemoryRoutesProps) {
  const url = useSyncExternalStore(memoryNavigation.subscribe, memoryNavigation.getUrl, memoryNavigation.getUrl)
  const pathname = new URL(url, 'http://localhost').pathname

  for (const [pattern, element] of Object.entries(routes)) {
    const params = matchPattern(pattern, pathname)
    if (params) {
      return (
        <ParamsContext.Provider key={pattern} value={params}>
          {element}
        </ParamsContext.Provider>
      )
    }
  }
  return null
}
