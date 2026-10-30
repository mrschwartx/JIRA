import { describe, expect, it, vi } from 'vitest'
import { env } from '@/shared/config/env'
import { ApiError } from './errors'
import { http } from './httpClient'

const mockResponse = (body: BodyInit | null, init: ResponseInit = { status: 200 }) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, init))

describe('http client', () => {
  it('sends GET requests with credentials and search params', async () => {
    const fetchSpy = mockResponse(JSON.stringify({ ok: true }))

    const result = await http.get<{ ok: boolean }>('/tasks', { searchParams: { status: 'open', page: 2, skip: undefined } })

    expect(result).toEqual({ ok: true })
    expect(fetchSpy).toHaveBeenCalledWith(
      `${env.apiBaseUrl}/tasks?status=open&page=2`,
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    )
  })

  it('accepts URLSearchParams instances', async () => {
    const fetchSpy = mockResponse(JSON.stringify({}))

    await http.get('/tasks', { searchParams: new URLSearchParams({ orderBy: 'name' }) })

    expect(fetchSpy.mock.calls[0]?.[0]).toBe(`${env.apiBaseUrl}/tasks?orderBy=name`)
  })

  it('serializes JSON bodies with a content type header', async () => {
    const fetchSpy = mockResponse(JSON.stringify({ id: 1 }))

    await http.post('/tasks/create', { name: 'Write tests' })

    const init = fetchSpy.mock.calls[0]?.[1]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ name: 'Write tests' }))
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json')
  })

  it('sends form data without forcing a content type', async () => {
    const fetchSpy = mockResponse(JSON.stringify({ avatar: '/a.png' }))
    const formData = new FormData()
    formData.append('avatar', new File(['x'], 'a.png', { type: 'image/png' }))

    await http.upload('/users/upload/1', formData)

    const init = fetchSpy.mock.calls[0]?.[1]
    expect(init?.body).toBe(formData)
    expect(new Headers(init?.headers).has('Content-Type')).toBe(false)
  })

  it('supports PATCH and DELETE methods', async () => {
    const fetchSpy = mockResponse(JSON.stringify({}))

    await http.patch('/tasks/1', { name: 'Updated' })
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({})))
    await http.delete('/tasks/1')

    expect(fetchSpy.mock.calls.map((call) => call[1]?.method)).toEqual(['PATCH', 'DELETE'])
  })

  it('throws an ApiError carrying the server message and status', async () => {
    mockResponse(JSON.stringify({ message: 'Wrong credentials' }), { status: 401 })

    const error = await http.post('/auth/signin', {}).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ message: 'Wrong credentials', status: 401, data: { message: 'Wrong credentials' } })
  })

  it('falls back to the status text when the error body is not JSON', async () => {
    mockResponse('<html>bad gateway</html>', { status: 502, statusText: 'Bad Gateway' })

    await expect(http.get('/tasks')).rejects.toMatchObject({ message: 'Bad Gateway', status: 502 })
  })

  it('returns null for empty successful responses', async () => {
    mockResponse(null, { status: 204 })

    await expect(http.delete('/tasks/1')).resolves.toBeNull()
  })

  it('maps network failures to an ApiError with status 0', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(http.get('/tasks')).rejects.toMatchObject({ message: 'Something went wrong', status: 0 })
  })

  it('rethrows aborted requests untouched', async () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(abortError)

    await expect(http.get('/tasks')).rejects.toBe(abortError)
  })
})
