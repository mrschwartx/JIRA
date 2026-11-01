import { Box, Button, Flex, HStack, Stack, Text, Textarea } from '@chakra-ui/react'
import { useState } from 'react'
import { UserAvatar } from '@/features/users'
import { DeleteConfirmation } from '@/shared/components'
import { useCommentMutations, useComments } from '../hooks/useComments'
import type { Comment } from '../types'

type CommentsSectionProps = {
  projectId: string
  issueId: string
  currentUserId: string
  isOwner: boolean
}

type CommentItemProps = {
  comment: Comment
  canEdit: boolean
  canDelete: boolean
  isSaving: boolean
  onSave: (body: string, done: () => void) => void
  onDelete: () => void
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

function CommentItem({ comment, canEdit, canDelete, isSaving, onSave, onDelete }: CommentItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.body)
  const [confirming, setConfirming] = useState(false)
  const username = comment.author?.username ?? 'Former member'

  return (
    <Flex gap="3" as="li" listStyleType="none">
      <UserAvatar username={username} avatar={comment.author?.avatar} size={32} />
      <Box flex="1" minW="0">
        <HStack gap="2" mb="1" wrap="wrap">
          <Text fontWeight="semibold" fontSize="sm">
            {username}
          </Text>
          <Text fontSize="xs" color="gray.600">
            {formatDate(comment.createdAt)}
          </Text>
        </HStack>
        {editing ? (
          <Stack gap="2">
            <Textarea aria-label="Edit comment" rows={3} value={draft} onChange={(event) => setDraft(event.target.value)} />
            <HStack gap="2">
              <Button
                size="sm"
                colorPalette="blue"
                loading={isSaving}
                disabled={draft.trim() === ''}
                onClick={() =>
                  onSave(draft.trim(), () => {
                    setEditing(false)
                  })
                }
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(comment.body)
                  setEditing(false)
                }}
              >
                Cancel
              </Button>
            </HStack>
          </Stack>
        ) : (
          <>
            <Text whiteSpace="pre-wrap" wordBreak="break-word" fontSize="sm">
              {comment.body}
            </Text>
            {canEdit || canDelete ? (
              <HStack gap="3" mt="1">
                {canEdit ? (
                  <Button size="xs" variant="plain" color="gray.600" p="0" h="auto" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button size="xs" variant="plain" color="gray.600" p="0" h="auto" onClick={() => setConfirming(true)}>
                    Delete
                  </Button>
                ) : null}
              </HStack>
            ) : null}
          </>
        )}
      </Box>
      <DeleteConfirmation
        alertTitle="Delete comment"
        isOpen={confirming}
        isPending={false}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          onDelete()
        }}
      />
    </Flex>
  )
}

export function CommentsSection({ projectId, issueId, currentUserId, isOwner }: CommentsSectionProps) {
  const { data: comments, isPending, isError } = useComments(projectId, issueId)
  const { create, update, remove } = useCommentMutations(projectId, issueId)
  const [body, setBody] = useState('')

  const submit = () => {
    const text = body.trim()
    if (!text) {
      return
    }
    create.mutate(text, { onSuccess: () => setBody('') })
  }

  return (
    <Box as="section" aria-labelledby="comments-heading">
      <Text id="comments-heading" fontWeight="semibold" mb="3">
        Comments
      </Text>
      <Stack gap="3" mb="5">
        <Textarea aria-label="Add a comment" placeholder="Add a comment..." rows={2} value={body} onChange={(event) => setBody(event.target.value)} />
        {body.trim() !== '' ? (
          <HStack gap="2">
            <Button size="sm" colorPalette="blue" loading={create.isPending} onClick={submit}>
              Save comment
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setBody('')}>
              Cancel
            </Button>
          </HStack>
        ) : null}
      </Stack>
      {isPending ? (
        <Text color="gray.600" fontSize="sm">
          Loading comments...
        </Text>
      ) : isError ? (
        <Text color="red.600" fontSize="sm" role="alert">
          Comments could not be loaded.
        </Text>
      ) : comments.length === 0 ? (
        <Text color="gray.600" fontSize="sm">
          No comments yet.
        </Text>
      ) : (
        <Stack as="ul" gap="4" m="0" p="0">
          {comments.map((comment) => {
            const isAuthor = comment.author?.id === currentUserId
            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                canEdit={isAuthor}
                canDelete={isAuthor || isOwner}
                isSaving={update.isPending}
                onSave={(text, done) => update.mutate({ commentId: comment.id, body: text }, { onSuccess: done })}
                onDelete={() => remove.mutate(comment.id)}
              />
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
