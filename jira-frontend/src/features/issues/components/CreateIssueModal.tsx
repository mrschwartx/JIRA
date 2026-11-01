import { Box, Button, CloseButton, Dialog, Field, Input, NativeSelect, Portal, Stack, Text, Textarea } from '@chakra-ui/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Member } from '@/features/projects'
import { ISSUE_PRIORITIES, ISSUE_PRIORITY_LABELS, ISSUE_TYPE_LABELS, ISSUE_TYPES } from '../constants'
import { useCreateIssue } from '../hooks/useIssueMutations'
import type { IssuePriority, IssueType } from '../types'

type CreateIssueModalProps = {
  projectId: string
  members: readonly Member[]
  currentUserId: string
  open: boolean
  onClose: () => void
}

type FormValues = {
  title: string
  type: IssueType
  priority: IssuePriority
  description: string
  reporterId: string
}

function CreateIssueForm({ projectId, members, currentUserId, onClose }: Omit<CreateIssueModalProps, 'open'>) {
  const { mutate, isPending } = useCreateIssue(projectId)
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { title: '', type: 'task', priority: 'medium', description: '', reporterId: currentUserId },
  })

  const toggleAssignee = (id: string) =>
    setAssigneeIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]))

  const onSubmit = (values: FormValues) => {
    mutate({ ...values, assigneeIds }, { onSuccess: onClose })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Dialog.Body>
        <Stack gap="4">
          <Field.Root>
            <Field.Label>Issue type</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field {...register('type')}>
                {ISSUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ISSUE_TYPE_LABELS[type]}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          <Field.Root invalid={Boolean(errors.title)}>
            <Field.Label>Short summary</Field.Label>
            <Input {...register('title', { required: 'Summary is required', maxLength: { value: 200, message: 'Use at most 200 characters' } })} />
            <Field.HelperText>Concisely summarize the issue in one or two sentences.</Field.HelperText>
            <Field.ErrorText>{errors.title?.message}</Field.ErrorText>
          </Field.Root>
          <Field.Root>
            <Field.Label>Description</Field.Label>
            <Textarea rows={5} {...register('description')} />
          </Field.Root>
          <Field.Root>
            <Field.Label>Reporter</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field {...register('reporterId')}>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.username}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          <Box as="fieldset" borderWidth="0" p="0" m="0">
            <Text as="legend" fontSize="sm" fontWeight="medium" mb="2">
              Assignees
            </Text>
            <Stack gap="1">
              {members.map((member) => (
                <Box as="label" key={member.id} display="flex" alignItems="center" gap="2" cursor="pointer">
                  <input type="checkbox" checked={assigneeIds.includes(member.id)} onChange={() => toggleAssignee(member.id)} />
                  <span>{member.username}</span>
                </Box>
              ))}
            </Stack>
          </Box>
          <Field.Root>
            <Field.Label>Priority</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field {...register('priority')}>
                {ISSUE_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {ISSUE_PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
        </Stack>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" colorPalette="blue" loading={isPending}>
          Create issue
        </Button>
      </Dialog.Footer>
    </form>
  )
}

export function CreateIssueModal({ open, onClose, ...rest }: CreateIssueModalProps) {
  return (
    <Dialog.Root open={open} size="lg" scrollBehavior="inside" lazyMount unmountOnExit onOpenChange={(details) => !details.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Create issue</Dialog.Title>
            </Dialog.Header>
            <CreateIssueForm {...rest} onClose={onClose} />
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
