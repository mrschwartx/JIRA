const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const env = {
  apiBaseUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'),
  serverBaseUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'http://localhost:8080'),
}
