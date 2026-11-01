import { Button, Field, Input, NativeSelect, Stack, Textarea } from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { PROJECT_CATEGORIES, PROJECT_CATEGORY_LABELS } from '../constants'
import type { CreateProjectValues } from '../types'

type ProjectFormProps = {
  mode: 'create' | 'edit'
  defaultValues?: Partial<CreateProjectValues>
  isSubmitting: boolean
  submitLabel: string
  onSubmit: (values: CreateProjectValues) => void
}

const EMPTY: CreateProjectValues = { key: '', name: '', category: 'software', url: '', description: '' }

export function ProjectForm({ mode, defaultValues, isSubmitting, submitLabel, onSubmit }: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectValues>({ defaultValues: { ...EMPTY, ...defaultValues } })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="4">
        <Field.Root invalid={Boolean(errors.name)}>
          <Field.Label>Name</Field.Label>
          <Input {...register('name', { required: 'Name is required', maxLength: { value: 100, message: 'Use at most 100 characters' } })} />
          <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root invalid={Boolean(errors.key)}>
          <Field.Label>Key</Field.Label>
          <Input
            readOnly={mode === 'edit'}
            disabled={mode === 'edit'}
            {...register('key', {
              required: 'Key is required',
              setValueAs: (value: string) => value.toUpperCase(),
              pattern: { value: /^[A-Z][A-Z0-9]{1,9}$/, message: 'Use 2 to 10 letters or digits, starting with a letter' },
            })}
          />
          <Field.HelperText>Issues are numbered with this key, for example JIRA-12.</Field.HelperText>
          <Field.ErrorText>{errors.key?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root>
          <Field.Label>Category</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field {...register('category')}>
              {PROJECT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {PROJECT_CATEGORY_LABELS[category]}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root invalid={Boolean(errors.url)}>
          <Field.Label>URL</Field.Label>
          <Input
            type="url"
            placeholder="https://"
            {...register('url', { pattern: { value: /^$|^https?:\/\/\S+$/, message: 'Enter an http or https address' } })}
          />
          <Field.ErrorText>{errors.url?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root>
          <Field.Label>Description</Field.Label>
          <Textarea rows={4} {...register('description')} />
        </Field.Root>
        <Button type="submit" colorPalette="blue" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </Stack>
    </form>
  )
}
