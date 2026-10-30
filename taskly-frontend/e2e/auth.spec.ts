import { expect, test } from './support/fixtures'

test.describe('authentication', () => {
  test('redirects anonymous visitors away from private pages', async ({ page }) => {
    await page.goto('/tasks')

    await expect(page).toHaveURL(/\/signin$/)
    await expect(page.getByRole('heading', { name: 'Enter Your Credentials' })).toBeVisible()
  })

  test('shows the landing page with a sign in link', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Make your')
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible()
  })

  test('signs up a new account', async ({ page, backend }) => {
    await page.goto('/signup')

    await page.getByLabel('Username').fill('newbie')
    await page.getByLabel('Email').fill('newbie@example.com')
    await page.getByLabel('Password').fill('secret123')
    await page.getByRole('button', { name: 'Sign Up' }).click()

    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.getByText('Sign Up Successful. You are now logged in')).toBeVisible()
    await expect(page.getByLabel('Username')).toHaveValue('newbie')
    expect(backend.state.users.some((user) => user.email === 'newbie@example.com')).toBe(true)
  })

  test('signs in with valid credentials', async ({ page, account }) => {
    await page.goto('/signin')

    await page.getByLabel('Email').fill(account.email)
    await page.getByLabel('Password').fill(account.password)
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.getByRole('heading', { name: 'Your Profile' })).toBeVisible()
  })

  test('shows an error for wrong credentials', async ({ page, account }) => {
    await page.goto('/signin')

    await page.getByLabel('Email').fill(account.email)
    await page.getByLabel('Password').fill('not-the-password')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByText('Wrong credentials')).toBeVisible()
    await expect(page).toHaveURL(/\/signin$/)
  })

  test('signs out from the user menu and protects private pages again', async ({ page, signIn }) => {
    await signIn()
    await page.goto('/profile')

    await page.getByRole('button', { name: 'Open user menu' }).click()
    await page.getByRole('menuitem', { name: 'Sign Out' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible()

    await page.goto('/profile')
    await expect(page).toHaveURL(/\/signin$/)
  })

  test('returns to the sign in page when the server session expires', async ({ page, backend, signIn }) => {
    await signIn()
    backend.state.sessionUserId = null

    await page.goto('/tasks')

    await expect(page).toHaveURL(/\/signin$/)
  })
})
