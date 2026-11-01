export class ApiError extends Error {
  readonly status: number
  readonly data: unknown

  constructor(message: string, status: number, data: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export const getErrorMessage = (error: unknown, fallback = 'Something went wrong') =>
  error instanceof Error && error.message ? error.message : fallback
