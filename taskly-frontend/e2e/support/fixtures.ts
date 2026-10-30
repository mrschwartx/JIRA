import { test as base, expect } from '@playwright/test'
import { toSessionUser, type FakeUser } from '../../src/test/factories'
import { createFakeBackend, type FakeBackend } from '../../src/test/fakeBackend'
import { installMockApi } from './mockApi'

const SESSION_STORAGE_KEY = 'taskly_user'
const SEEDED_STORAGE_KEY = 'e2e_session_seeded'

const baseAccount: FakeUser = {
  _id: 'user-e2e',
  username: 'jane',
  email: 'jane@example.com',
  password: 'secret123',
}

type Fixtures = {
  backend: FakeBackend
  account: FakeUser
  signIn: () => Promise<void>
}

export const test = base.extend<Fixtures>({
  backend: async ({ page }, use) => {
    const backend = createFakeBackend({ users: [{ ...baseAccount }] })
    await installMockApi(page, backend)
    await use(backend)
  },
  account: async ({ backend }, use) => {
    await use(backend.state.users[0] as FakeUser)
  },
  signIn: async ({ page, backend, account }, use) => {
    await use(async () => {
      backend.state.sessionUserId = account._id
      await page.addInitScript(
        ([key, value, seededKey]) => {
          if (window.sessionStorage.getItem(seededKey as string)) return
          window.sessionStorage.setItem(seededKey as string, '1')
          window.localStorage.setItem(key as string, value as string)
        },
        [SESSION_STORAGE_KEY, JSON.stringify(toSessionUser(account)), SEEDED_STORAGE_KEY],
      )
    })
  },
})

export { expect }
