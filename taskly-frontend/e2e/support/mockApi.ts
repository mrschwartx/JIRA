import type { Page } from '@playwright/test'
import type { FakeBackend } from '../../src/test/fakeBackend'

const API_PATTERN = '**/api/v1/**'
const API_PREFIX = '/api/v1'

export const PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
)

const corsHeaders = (origin: string | undefined) => ({
  'access-control-allow-origin': origin ?? '*',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type',
})

export async function installMockApi(page: Page, backend: FakeBackend) {
  await page.route('**/uploads/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG_BUFFER }),
  )

  await page.route(API_PATTERN, async (route) => {
    const request = route.request()
    const headers = corsHeaders(request.headers()['origin'])

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers })
      return
    }

    const url = new URL(request.url())
    const contentType = request.headers()['content-type'] ?? ''
    const body = contentType.includes('application/json') ? (request.postDataJSON() as unknown) : undefined
    const response = backend.handle({
      method: request.method(),
      path: url.pathname.slice(API_PREFIX.length),
      searchParams: url.searchParams,
      body,
    })

    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      headers,
      body: JSON.stringify(response.body),
    })
  })
}
