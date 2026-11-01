import { Box, Button, Field, HStack, Input, NativeSelect, Progress, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { FiX } from 'react-icons/fi'
import type { Member } from '@/features/projects'
import { UserAvatar } from '@/features/users'
import { ISSUE_PRIORITIES, ISSUE_PRIORITY_LABELS, ISSUE_STATUS_LABELS, ISSUE_STATUSES } from '../constants'
import type { Issue, IssuePriority, IssueStatus, UpdateIssueChanges } from '../types'

type IssueSidebarProps = {
  issue: Issue
  members: readonly Member[]
  onChange: (changes: UpdateIssueChanges) => void
}

const MAX_HOURS = 10000

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

type HoursFieldProps = {
  label: string
  value: number | null
  onCommit: (value: number | null) => void
}

function HoursField({ label, value, onCommit }: HoursFieldProps) {
  const [draft, setDraft] = useState(value === null ? '' : String(value))
  const [invalid, setInvalid] = useState(false)

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed === '') {
      setInvalid(false)
      if (value !== null) {
        onCommit(null)
      }
      return
    }
    const parsed = Number(trimmed)
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_HOURS) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    if (parsed !== value) {
      onCommit(parsed)
    }
  }

  return (
    <Field.Root invalid={invalid}>
      <Field.Label fontSize="xs" color="gray.600">
        {label}
      </Field.Label>
      <Input
        size="sm"
        inputMode="numeric"
        aria-label={label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }
        }}
      />
      <Field.ErrorText>Enter whole hours from 0 to {MAX_HOURS}</Field.ErrorText>
    </Field.Root>
  )
}

function TrackingBar({ issue }: { issue: Issue }) {
  const spent = issue.timeSpent ?? 0
  const remaining = issue.timeRemaining
  const total = remaining !== null ? spent + remaining : (issue.estimate ?? 0)
  const percent = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0

  return (
    <Stack gap="1">
      <Progress.Root value={percent} max={100} size="sm" aria-label="Time tracking progress">
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
      <HStack justify="space-between" fontSize="xs" color="gray.600">
        <span>{spent ? `${spent}h logged` : 'No time logged'}</span>
        <span>
          {remaining !== null
            ? `${remaining}h remaining`
            : issue.estimate !== null
              ? `${issue.estimate}h estimated`
              : ''}
        </span>
      </HStack>
    </Stack>
  )
}

export function IssueSidebar({ issue, members, onChange }: IssueSidebarProps) {
  const assignees = issue.assigneeIds.flatMap((id) => members.find((member) => member.id === id) ?? [])
  const unassigned = members.filter((member) => !issue.assigneeIds.includes(member.id))
  const reporterKnown = issue.reporterId !== null && members.some((member) => member.id === issue.reporterId)

  return (
    <Stack gap="5">
      <Field.Root>
        <Field.Label fontSize="xs" color="gray.600">
          Status
        </Field.Label>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            aria-label="Status"
            value={issue.status}
            onChange={(event) => onChange({ status: event.target.value as IssueStatus })}
          >
            {ISSUE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ISSUE_STATUS_LABELS[status]}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>

      <Box>
        <Text fontSize="xs" color="gray.600" mb="1">
          Assignees
        </Text>
        <Stack gap="1" mb="2">
          {assignees.length === 0 ? (
            <Text fontSize="sm" color="gray.600">
              Unassigned
            </Text>
          ) : (
            assignees.map((member) => (
              <HStack key={member.id} justify="space-between">
                <HStack gap="2">
                  <UserAvatar username={member.username} avatar={member.avatar} size={24} />
                  <Text fontSize="sm">{member.username}</Text>
                </HStack>
                <Button
                  size="xs"
                  variant="ghost"
                  aria-label={`Unassign ${member.username}`}
                  onClick={() => onChange({ assigneeIds: issue.assigneeIds.filter((id) => id !== member.id) })}
                >
                  <FiX aria-hidden />
                </Button>
              </HStack>
            ))
          )}
        </Stack>
        {unassigned.length > 0 ? (
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              aria-label="Add assignee"
              value=""
              onChange={(event) => {
                if (event.target.value) {
                  onChange({ assigneeIds: [...issue.assigneeIds, event.target.value] })
                }
              }}
            >
              <option value="">Add assignee</option>
              {unassigned.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.username}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        ) : null}
      </Box>

      <Field.Root>
        <Field.Label fontSize="xs" color="gray.600">
          Reporter
        </Field.Label>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            aria-label="Reporter"
            value={reporterKnown ? (issue.reporterId ?? '') : ''}
            onChange={(event) => {
              if (event.target.value) {
                onChange({ reporterId: event.target.value })
              }
            }}
          >
            {!reporterKnown ? (
              <option value="" disabled>
                Former member
              </option>
            ) : null}
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.username}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>

      <Field.Root>
        <Field.Label fontSize="xs" color="gray.600">
          Priority
        </Field.Label>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            aria-label="Priority"
            value={issue.priority}
            onChange={(event) => onChange({ priority: event.target.value as IssuePriority })}
          >
            {ISSUE_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {ISSUE_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>

      <Stack gap="3">
        <Text fontSize="xs" color="gray.600">
          Time tracking
        </Text>
        <TrackingBar issue={issue} />
        <HoursField key={`estimate-${issue.estimate}`} label="Original estimate (hours)" value={issue.estimate} onCommit={(value) => onChange({ estimate: value })} />
        <HoursField key={`spent-${issue.timeSpent}`} label="Time spent (hours)" value={issue.timeSpent} onCommit={(value) => onChange({ timeSpent: value })} />
        <HoursField key={`remaining-${issue.timeRemaining}`} label="Time remaining (hours)" value={issue.timeRemaining} onCommit={(value) => onChange({ timeRemaining: value })} />
      </Stack>

      <Box fontSize="xs" color="gray.600">
        <Text>Created {formatDate(issue.createdAt)}</Text>
        <Text>Updated {formatDate(issue.updatedAt)}</Text>
      </Box>
    </Stack>
  )
}
