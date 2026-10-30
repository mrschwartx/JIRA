import { createFakeTask, createFakeTasks } from '../src/test/factories'
import { expect, test } from './support/fixtures'

test.describe('tasks', () => {
  test.beforeEach(async ({ signIn }) => {
    await signIn()
  })

  test('paginates through the task list', async ({ page, backend, account }) => {
    backend.state.tasks.push(...createFakeTasks(account._id, 9))
    await page.goto('/tasks')

    await expect(page.getByRole('row')).toHaveCount(5)
    await expect(page.getByText('Page 1 of 3')).toBeVisible()

    await page.getByRole('button', { name: 'Next page' }).click()

    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByRole('link', { name: 'Task 05' })).toBeVisible()

    await page.getByRole('button', { name: 'Last page' }).click()

    await expect(page.getByRole('row')).toHaveCount(2)
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  test('filters by status and sorts by name', async ({ page, backend, account }) => {
    backend.state.tasks.push(
      createFakeTask(account._id, { name: 'Charlie', status: 'done' }),
      createFakeTask(account._id, { name: 'Alpha', status: 'done' }),
      createFakeTask(account._id, { name: 'Bravo', status: 'todo' }),
    )
    await page.goto('/tasks')

    await page.getByLabel('Filter by status').selectOption('done')

    await expect(page).toHaveURL(/status=done/)
    await expect(page.getByRole('row')).toHaveCount(3)
    await expect(page.getByRole('link', { name: 'Bravo' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Task' }).click()

    await expect(page).toHaveURL(/orderBy=name/)
    await expect(page.getByRole('row').nth(1)).toContainText('Alpha')
  })

  test('shows an empty state', async ({ page }) => {
    await page.goto('/tasks')

    await expect(page.getByText('No tasks found')).toBeVisible()
  })

  test('creates, edits and deletes a task', async ({ page }) => {
    await page.goto('/create-task')

    await page.getByLabel('Task Name').fill('Plan sprint')
    await page.getByLabel('Description').fill('Pick the stories')
    await page.getByLabel('Priority').selectOption('high')
    await page.getByLabel('Status').selectOption('todo')
    await page.getByLabel('Due Date').fill('03/01/2026 10:30 AM')
    await page.getByLabel('Due Date').press('Escape')
    await expect(page.locator('.react-datepicker')).toBeHidden()
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page).toHaveURL(/\/tasks\/task-\d+$/)
    await expect(page.getByText('New Task Created: Plan sprint')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Plan sprint' })).toBeVisible()

    await page.getByRole('link', { name: 'Edit Task' }).click()
    await expect(page.getByLabel('Task Name')).toHaveValue('Plan sprint')
    await page.getByLabel('Task Name').fill('Plan next sprint')
    await page.getByLabel('Status').selectOption('done')
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page.getByRole('heading', { name: 'Plan next sprint' })).toBeVisible()
    await expect(page.getByText('Done', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Delete Task' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()

    await expect(page).toHaveURL(/\/tasks$/)
    await expect(page.getByText('No tasks found')).toBeVisible()
  })

  test('validates the create form', async ({ page }) => {
    await page.goto('/create-task')

    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page.getByText('Task Name is required')).toBeVisible()
    await expect(page.getByText('Priority is required')).toBeVisible()
    await expect(page.getByText('Due Date is required')).toBeVisible()
  })
})
