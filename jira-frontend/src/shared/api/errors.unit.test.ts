import { describe, expect, it } from 'vitest'
import { ApiError, getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('returns the message of an Error instance', () => {
    expect(getErrorMessage(new ApiError('Nope', 400))).toBe('Nope')
    expect(getErrorMessage(new Error('Boom'))).toBe('Boom')
  })

  it('returns the fallback for unknown values and empty messages', () => {
    expect(getErrorMessage('string')).toBe('Something went wrong')
    expect(getErrorMessage(new Error(''), 'Custom fallback')).toBe('Custom fallback')
  })
})
