import { http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import { server } from './msw'

export const url = (path: string) => `${env.apiBaseUrl}${path}`

export type RecordedRequest = {
  method: string
  path: string
  body: unknown
}

export const mockApi = (routes: Array<{ method: 'get' | 'post' | 'patch' | 'put' | 'delete'; path: string; status?: number; body?: object | null | ((request: RecordedRequest) => unknown) }>) => {
  const requests: RecordedRequest[] = []

  server.use(
    ...routes.map((route) =>
      http[route.method](url(route.path), async ({ request }) => {
        const text = await request.text()
        const recorded: RecordedRequest = {
          method: request.method,
          path: new URL(request.url).pathname.slice(new URL(env.apiBaseUrl).pathname.length),
          body: text ? JSON.parse(text) : undefined,
        }
        requests.push(recorded)
        const payload = typeof route.body === 'function' ? route.body(recorded) : route.body
        const status = route.status ?? 200
        if (status === 204) {
          return new HttpResponse(null, { status })
        }
        return HttpResponse.json((payload ?? null) as never, { status })
      }),
    ),
  )

  return requests
}
