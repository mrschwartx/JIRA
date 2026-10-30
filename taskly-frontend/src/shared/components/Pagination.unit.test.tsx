import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders nothing when there is a single page', () => {
    renderWithProviders(<Pagination itemCount={4} pageSize={4} currentPage={1} onPageChange={vi.fn()} />)

    expect(screen.queryByText(/page 1 of/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the current page and disables backward controls on the first page', () => {
    renderWithProviders(<Pagination itemCount={10} pageSize={4} currentPage={1} onPageChange={vi.fn()} />)

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled()
  })

  it('disables forward controls on the last page', () => {
    renderWithProviders(<Pagination itemCount={10} pageSize={4} currentPage={3} onPageChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled()
  })

  it('reports page changes', async () => {
    const onPageChange = vi.fn()
    const { user } = renderWithProviders(
      <Pagination itemCount={12} pageSize={4} currentPage={2} onPageChange={onPageChange} />,
    )

    await user.click(screen.getByRole('button', { name: 'First page' }))
    await user.click(screen.getByRole('button', { name: 'Previous page' }))
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    await user.click(screen.getByRole('button', { name: 'Last page' }))

    expect(onPageChange.mock.calls.map((call) => call[0])).toEqual([1, 1, 3, 3])
  })
})
