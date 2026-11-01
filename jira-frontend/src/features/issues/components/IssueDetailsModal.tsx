import { Box, Button, CloseButton, Dialog, Flex, Grid, HStack, Input, NativeSelect, Portal, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { FiLink, FiTrash2 } from 'react-icons/fi'
import { CommentsSection } from '@/features/comments'
import type { Member } from '@/features/projects'
import { DeleteConfirmation } from '@/shared/components'
import { ISSUE_TYPE_LABELS, ISSUE_TYPES } from '../constants'
import { useDeleteIssue, useUpdateIssue } from '../hooks/useIssueMutations'
import { useIssues } from '../hooks/useIssues'
import type { Issue, IssueType, UpdateIssueChanges } from '../types'
import { formatIssueKey } from '../utils/issueKey'
import { IssueDescription } from './IssueDescription'
import { IssueSidebar } from './IssueSidebar'
import { IssueTypeIcon } from './IssueIcons'

type IssueDetailsModalProps = {
  projectId: string
  projectKey: string
  issueId: string
  members: readonly Member[]
  currentUserId: string
  isOwner: boolean
  onClose: () => void
}

function TitleField({ issue, onSave }: { issue: Issue; onSave: (title: string) => void }) {
  const [draft, setDraft] = useState(issue.title)
  const [invalid, setInvalid] = useState(false)

  const commit = () => {
    const title = draft.trim()
    if (title === '') {
      setInvalid(true)
      setDraft(issue.title)
      return
    }
    setInvalid(false)
    if (title !== issue.title) {
      onSave(title)
    }
  }

  return (
    <Input
      aria-label="Title"
      aria-invalid={invalid}
      fontSize="xl"
      fontWeight="semibold"
      variant="subtle"
      maxLength={200}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur()
        }
      }}
    />
  )
}

function Details({ issue, projectId, projectKey, members, currentUserId, isOwner, onClose }: Omit<IssueDetailsModalProps, 'issueId'> & { issue: Issue }) {
  const { mutate: updateIssue } = useUpdateIssue(projectId)
  const { mutate: deleteIssue, isPending: isDeleting } = useDeleteIssue(projectId)
  const [confirming, setConfirming] = useState(false)

  const change = (changes: UpdateIssueChanges) => updateIssue({ issueId: issue.id, changes })

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  return (
    <>
      <DeleteConfirmation
        alertTitle="Delete issue"
        isOpen={confirming}
        isPending={isDeleting}
        onClose={() => setConfirming(false)}
        onConfirm={() => deleteIssue(issue.id, { onSuccess: onClose })}
      />
      <Dialog.Header>
        <Flex justify="space-between" align="center" w="full" pr="8" gap="3" wrap="wrap">
          <HStack gap="2">
            <IssueTypeIcon type={issue.type} />
            <NativeSelect.Root size="sm" w="auto">
              <NativeSelect.Field aria-label="Issue type" value={issue.type} onChange={(event) => change({ type: event.target.value as IssueType })}>
                {ISSUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ISSUE_TYPE_LABELS[type]}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <Dialog.Title fontSize="sm" color="gray.600" fontWeight="normal">
              {formatIssueKey(projectKey, issue.number)}
            </Dialog.Title>
          </HStack>
          <HStack gap="1">
            <Button size="sm" variant="ghost" onClick={() => void copyLink()}>
              <FiLink aria-hidden /> Copy link
            </Button>
            <Button size="sm" variant="ghost" colorPalette="red" onClick={() => setConfirming(true)}>
              <FiTrash2 aria-hidden /> Delete
            </Button>
          </HStack>
        </Flex>
      </Dialog.Header>
      <Dialog.Body pb="6">
        <Grid templateColumns={{ base: '1fr', md: 'minmax(0, 1fr) 260px' }} gap="8">
          <Stack gap="6" minW="0">
            <TitleField key={issue.title} issue={issue} onSave={(title) => change({ title })} />
            <Box>
              <Text fontWeight="semibold" mb="2">
                Description
              </Text>
              <IssueDescription key={issue.updatedAt} value={issue.description} onSave={(description) => change({ description })} />
            </Box>
            <CommentsSection projectId={projectId} issueId={issue.id} currentUserId={currentUserId} isOwner={isOwner} />
          </Stack>
          <IssueSidebar issue={issue} members={members} onChange={change} />
        </Grid>
      </Dialog.Body>
    </>
  )
}

export function IssueDetailsModal({ issueId, onClose, ...rest }: IssueDetailsModalProps) {
  const { data: issues } = useIssues(rest.projectId)
  const issue = issues?.find((entry) => entry.id === issueId)

  return (
    <Dialog.Root open size="xl" scrollBehavior="inside" lazyMount unmountOnExit onOpenChange={(details) => !details.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {issue ? (
              <Details issue={issue} onClose={onClose} {...rest} />
            ) : (
              <>
                <Dialog.Header>
                  <Dialog.Title>Issue not found</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body pb="6">
                  <Text color="gray.600" mb="4">
                    This issue does not exist or was deleted.
                  </Text>
                  <Button onClick={onClose}>Back to the board</Button>
                </Dialog.Body>
              </>
            )}
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
