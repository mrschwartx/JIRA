import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupServer } from 'msw/node'
import { env } from '@/shared/config/env'
import type { FakeBackend } from './fakeBackend'

export const server = setupServer()

export const createBackendHandlers = (backend: FakeBackend) => [
  http.all(`${env.apiBaseUrl}/*`, async ({ request }) => {
    const url = new URL(request.url)
    const basePath = new URL(env.apiBaseUrl).pathname
    const path = url.pathname.slice(basePath.length)
    const contentType = request.headers.get('content-type') ?? ''
    const body = contentType.includes('application/json') ? await request.json() : undefined
    const response = backend.handle({ method: request.method, path, searchParams: url.searchParams, body })
    return HttpResponse.json(response.body as JsonBodyType, { status: response.status })
  }),
]
