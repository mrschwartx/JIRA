import { describe, expect, it, vi } from 'vitest'
import { readJson, removeItem, writeJson } from './storage'

describe('storage helpers', () => {
  it('writes and reads JSON values', () => {
    writeJson('key', { a: 1 })

    expect(readJson('key', null)).toEqual({ a: 1 })
  })

  it('returns the fallback when the key is missing', () => {
    expect(readJson('missing', 'fallback')).toBe('fallback')
  })

  it('returns the fallback when the stored value is invalid JSON', () => {
    window.localStorage.setItem('broken', '{not json')

    expect(readJson('broken', 'fallback')).toBe('fallback')
  })

  it('removes stored values', () => {
    writeJson('key', 1)
    removeItem('key')

    expect(window.localStorage.getItem('key')).toBeNull()
  })

  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })

    expect(() => writeJson('key', 1)).not.toThrow()
    expect(() => removeItem('key')).not.toThrow()
    expect(readJson('key', 'fallback')).toBe('fallback')
  })
})
