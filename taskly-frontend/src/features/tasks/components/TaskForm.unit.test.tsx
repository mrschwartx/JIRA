import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { TaskFormValues } from '../types'
import { TaskForm } from './TaskForm'

describe('TaskForm', () => {
  it('shows validation errors for required fields', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithProviders(<TaskForm isSubmitting={false} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('Task Name is required')).toBeInTheDocument()
    expect(screen.getByText('Description is required')).toBeInTheDocument()
    expect(screen.getByText('Priority is required')).toBeInTheDocument()
    expect(screen.getByText('Status is required')).toBeInTheDocument()
    expect(screen.getByText('Due Date is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the entered values', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithProviders(<TaskForm isSubmitting={false} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Task Name'), 'Write tests')
    await user.type(screen.getByLabelText('Description'), 'Cover the app')
    await user.selectOptions(screen.getByLabelText('Priority'), 'high')
    await user.selectOptions(screen.getByLabelText('Status'), 'todo')
    await user.type(screen.getByLabelText('Due Date'), '03/01/2026 10:30 AM')
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      name: 'Write tests',
      description: 'Cover the app',
      priority: 'high',
      status: 'todo',
      due: new Date(2026, 2, 1, 10, 30),
    })
  })

  it('prefills the form from default values', () => {
    const defaultValues: TaskFormValues = {
      name: 'Existing',
      description: 'Existing description',
      priority: 'low',
      status: 'done',
      due: new Date(2026, 2, 1, 10, 30),
    }

    renderWithProviders(<TaskForm defaultValues={defaultValues} isSubmitting={false} onSubmit={vi.fn()} />)

    expect(screen.getByLabelText('Task Name')).toHaveValue('Existing')
    expect(screen.getByLabelText('Description')).toHaveValue('Existing description')
    expect(screen.getByLabelText('Priority')).toHaveValue('low')
    expect(screen.getByLabelText('Status')).toHaveValue('done')
    expect(screen.getByLabelText('Due Date')).toHaveValue('03/01/2026 10:30 AM')
  })

  it('disables the submit button while submitting', () => {
    renderWithProviders(<TaskForm isSubmitting onSubmit={vi.fn()} />)

    expect(screen.getByText('Submit').closest('button')).toBeDisabled()
  })
})
