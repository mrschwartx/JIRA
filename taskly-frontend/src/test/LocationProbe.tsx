import { useSyncExternalStore } from 'react'
import { memoryNavigation } from './next/navigation'

export function LocationProbe() {
  const url = useSyncExternalStore(memoryNavigation.subscribe, memoryNavigation.getUrl, memoryNavigation.getUrl)
  return <output data-testid="location">{url}</output>
}
