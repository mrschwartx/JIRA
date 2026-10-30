import { Button, Field, Flex, Input, NativeSelect, Stack, Textarea } from '@chakra-ui/react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Controller, useForm } from 'react-hook-form'
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from '../constants'
import type { TaskFormValues } from '../types'
import { emptyTaskFormValues } from '../utils/taskForm'

type TaskFormProps = {
  defaultValues?: TaskFormValues
  isSubmitting: boolean
  onSubmit: (values: TaskFormValues) => void
}

export function TaskForm({ defaultValues = emptyTaskFormValues, isSubmitting, onSubmit }: TaskFormProps) {
  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({ defaultValues })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack direction={{ base: 'column', md: 'row' }} gap="4">
        <Flex direction="column" flex="1" gap="4">
          <Field.Root invalid={Boolean(errors.name)}>
            <Input
              id="name"
              type="text"
              aria-label="Task Name"
              placeholder="Task Name"
              {...register('name', { required: 'Task Name is required' })}
            />
            <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
          </Field.Root>
          <Field.Root invalid={Boolean(errors.description)}>
            <Textarea
              id="description"
              aria-label="Description"
              placeholder="Description"
              rows={4}
              {...register('description', { required: 'Description is required' })}
            />
            <Field.ErrorText>{errors.description?.message}</Field.ErrorText>
          </Field.Root>
        </Flex>
        <Flex direction="column" flex="1" gap="4">
          <Field.Root invalid={Boolean(errors.priority)}>
            <NativeSelect.Root>
              <NativeSelect.Field
                aria-label="Priority"
                placeholder="Priority"
                {...register('priority', { required: 'Priority is required' })}
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {TASK_PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <Field.ErrorText>{errors.priority?.message}</Field.ErrorText>
          </Field.Root>
          <Field.Root invalid={Boolean(errors.status)}>
            <NativeSelect.Root>
              <NativeSelect.Field
                aria-label="Status"
                placeholder="Status"
                {...register('status', { required: 'Status is required' })}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {TASK_STATUS_LABELS[status]}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <Field.ErrorText>{errors.status?.message}</Field.ErrorText>
          </Field.Root>
          <Field.Root invalid={Boolean(errors.due)} css={{ '& .react-datepicker-wrapper': { width: '100%' } }}>
            <Controller
              control={control}
              name="due"
              rules={{ required: 'Due Date is required' }}
              render={({ field }) => (
                <DatePicker
                  id="due"
                  selected={field.value}
                  onChange={(date: Date | null) => field.onChange(date)}
                  onBlur={field.onBlur}
                  showTimeSelect
                  timeInputLabel="Time:"
                  dateFormat="MM/dd/yyyy h:mm aa"
                  placeholderText="Due Date"
                  customInput={<Input aria-label="Due Date" />}
                />
              )}
            />
            <Field.ErrorText>{errors.due?.message}</Field.ErrorText>
          </Field.Root>
          <Button type="submit" loading={isSubmitting} colorPalette="teal" textTransform="uppercase">
            Submit
          </Button>
        </Flex>
      </Stack>
    </form>
  )
}
