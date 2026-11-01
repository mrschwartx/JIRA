'use client'

import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { useServerInsertedHTML } from 'next/navigation'
import { useState, type ReactNode } from 'react'

type InsertedStyle = { name: string; isGlobal: boolean }

const createRegistry = () => {
  const cache = createCache({ key: 'css' })
  cache.compat = true

  const insert = cache.insert.bind(cache)
  let pending: InsertedStyle[] = []

  cache.insert = (...args) => {
    const serialized = args[1]
    if (cache.inserted[serialized.name] === undefined) {
      pending.push({ name: serialized.name, isGlobal: !args[0] })
    }
    return insert(...args)
  }

  const flush = () => {
    const flushed = pending
    pending = []
    return flushed
  }

  return { cache, flush }
}

export function EmotionRegistry({ children }: { children: ReactNode }) {
  const [{ cache, flush }] = useState(createRegistry)

  useServerInsertedHTML(() => {
    const inserted = flush()
    if (inserted.length === 0) {
      return null
    }

    let scopedStyles = ''
    let scopedAttribute = cache.key
    const globalStyles: { name: string; css: string }[] = []

    for (const { name, isGlobal } of inserted) {
      const css = cache.inserted[name]
      if (typeof css !== 'string') {
        continue
      }
      if (isGlobal) {
        globalStyles.push({ name, css })
      } else {
        scopedStyles += css
        scopedAttribute += ` ${name}`
      }
    }

    return (
      <>
        {globalStyles.map(({ name, css }) => (
          <style key={name} data-emotion={`${cache.key}-global ${name}`} dangerouslySetInnerHTML={{ __html: css }} />
        ))}
        {scopedStyles ? <style data-emotion={scopedAttribute} dangerouslySetInnerHTML={{ __html: scopedStyles }} /> : null}
      </>
    )
  })

  return <CacheProvider value={cache}>{children}</CacheProvider>
}
