import { describe, expect, it } from 'vitest'
import { env } from '@/shared/config/env'
import { DEFAULT_AVATAR_URL, getAvatarUrl } from './avatar'

describe('getAvatarUrl', () => {
  it('prefixes uploaded avatars with the server url', () => {
    expect(getAvatarUrl('/uploads/me.png')).toBe(`${env.serverBaseUrl}/uploads/me.png`)
  })

  it('falls back to the default avatar', () => {
    expect(getAvatarUrl()).toBe(DEFAULT_AVATAR_URL)
    expect(getAvatarUrl(null)).toBe(DEFAULT_AVATAR_URL)
    expect(getAvatarUrl('')).toBe(DEFAULT_AVATAR_URL)
  })
})
