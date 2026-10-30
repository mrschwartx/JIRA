import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { DeleteConfirmation } from './DeleteConfirmation'

describe('DeleteConfirmation', () => {
  it('renders nothing while closed', () => {
    renderWithProviders(
      <DeleteConfirmation alertTitle="Delete Task" isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} />,
    )

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('shows the title and warning when open', async () => {
    renderWithProviders(
      <DeleteConfirmation alertTitle="Delete Task" isOpen onClose={vi.fn()} onConfirm={vi.fn()} />,
    )

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Delete Task')).toBeInTheDocument()
    expect(screen.getByText(/can't undo this action/i)).toBeInTheDocument()
  })

  it('confirms and cancels through the footer buttons', async () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    const { user } = renderWithProviders(
      <DeleteConfirmation alertTitle="Delete Task" isOpen onClose={onClose} onConfirm={onConfirm} />,
    )

    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when escape is pressed', async () => {
    const onClose = vi.fn()
    const { user } = renderWithProviders(
      <DeleteConfirmation alertTitle="Delete Task" isOpen onClose={onClose} onConfirm={vi.fn()} />,
    )

    await screen.findByRole('alertdialog')
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })
})
