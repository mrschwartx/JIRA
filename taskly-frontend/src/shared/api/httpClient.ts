import { env } from '@/shared/config/env'
import { ApiError } from './errors'

type QueryValue = string | number | boolean | null | undefined
type SearchParamsInput = URLSearchParams | Record<string, QueryValue>
type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export type RequestOptions = {
  searchParams?: SearchParamsInput
  body?: unknown
  formData?: FormData
  signal?: AbortSignal
}

const toQueryString = (searchParams?: SearchParamsInput) => {
  if (!searchParams) {
    return ''
  }

  if (searchParams instanceof URLSearchParams) {
    return searchParams.toString()
  }

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value))
    }
  }
  return params.toString()
}

const buildUrl = (path: string, searchParams?: SearchParamsInput) => {
  const query = toQueryString(searchParams)
  const url = `${env.apiBaseUrl}${path}`
  return query ? `${url}?${query}` : url
}

const isAbortError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'

const parseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const extractMessage = (payload: unknown, fallback: string) => {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof payload.message === 'string' &&
    payload.message
  ) {
    return payload.message
  }
  return fallback
}

async function request<T>(method: Method, path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers()
  let body: BodyInit | undefined

  if (options.formData) {
    body = options.formData
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.searchParams), {
      method,
      headers,
      body,
      credentials: 'include',
      signal: options.signal,
    })
  } catch (error) {
    if (isAbortError(error)) {
      throw error
    }
    throw new ApiError('Something went wrong', 0)
  }

  const payload = await parseBody(response)

  if (!response.ok) {
    throw new ApiError(extractMessage(payload, response.statusText || 'Request failed'), response.status, payload)
  }

  return payload as T
}

export const http = {
  get: <T>(path: string, options?: Pick<RequestOptions, 'searchParams' | 'signal'>) =>
    request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: Pick<RequestOptions, 'signal'>) =>
    request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Pick<RequestOptions, 'signal'>) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: Pick<RequestOptions, 'signal'>) => request<T>('DELETE', path, options),
  upload: <T>(path: string, formData: FormData, options?: Pick<RequestOptions, 'signal'>) =>
    request<T>('POST', path, { ...options, formData }),
}
