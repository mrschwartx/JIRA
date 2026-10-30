import { PNG_BUFFER } from './support/mockApi'
import { expect, test } from './support/fixtures'

test.describe('profile', () => {
  test.beforeEach(async ({ page, signIn }) => {
    await signIn()
    await page.goto('/profile')
  })

  test('shows the current user details', async ({ page, account }) => {
    await expect(page.getByLabel('Username')).toHaveValue(account.username)
    await expect(page.getByLabel('Email')).toHaveValue(account.email)
  })

  test('updates the username', async ({ page, backend }) => {
    await page.getByLabel('Username').fill('jane-doe')
    await page.getByRole('button', { name: 'Update Profile' }).click()

    await expect(page.getByText('Profile Updated')).toBeVisible()
    expect(backend.state.users[0]?.username).toBe('jane-doe')
  })

  test('uploads a new avatar', async ({ page, backend }) => {
    await page.locator('#avatar').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_BUFFER })
    await page.getByRole('button', { name: 'Update Profile' }).click()

    await expect(page.getByText('Profile Updated')).toBeVisible()
    await expect(page.getByRole('img', { name: 'profile' })).toHaveAttribute('src', /\/uploads\/avatars\/new-avatar\.png$/)
    expect(backend.state.users[0]?.avatar).toBe('/uploads/avatars/new-avatar.png')
  })

  test('deletes the account after confirmation', async ({ page, backend }) => {
    await page.getByRole('button', { name: 'Delete Account' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible()
    expect(backend.state.users).toHaveLength(0)
  })
})
