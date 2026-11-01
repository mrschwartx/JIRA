import { Badge, Box, Button, Flex, HStack, Input, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserAvatar, usersApi } from '@/features/users'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { useAddMember, useRemoveMember } from '../hooks/useProjectMutations'
import { useMembers } from '../hooks/useProjects'
import type { Member } from '../types'
import { PageSpinner, QueryError } from './QueryState'

type MembersPanelProps = {
  projectId: string
  isOwner: boolean
  currentUserId: string
}

type MemberRowProps = {
  member: Member
  canRemove: boolean
  isRemoving: boolean
  onRemove: () => void
}

function MemberRow({ member, canRemove, onRemove, isRemoving }: MemberRowProps) {
  return (
    <Flex align="center" justify="space-between" gap="3" py="2">
      <HStack gap="3" minW="0">
        <UserAvatar username={member.username} avatar={member.avatar} size={32} />
        <Box minW="0">
          <Text fontWeight="medium" truncate>
            {member.username}
          </Text>
          <Text fontSize="sm" color="gray.600" truncate>
            {member.email}
          </Text>
        </Box>
      </HStack>
      <HStack gap="2">
        {member.role === 'owner' ? <Badge colorPalette="blue">Owner</Badge> : null}
        {canRemove ? (
          <Button size="xs" variant="outline" colorPalette="red" loading={isRemoving} onClick={onRemove}>
            Remove
          </Button>
        ) : null}
      </HStack>
    </Flex>
  )
}

function AddMember({ projectId, existingIds }: { projectId: string; existingIds: Set<string> }) {
  const [term, setTerm] = useState('')
  const debounced = useDebouncedValue(term.trim(), 300)
  const { mutate: addMember, isPending } = useAddMember(projectId)
  const enabled = debounced.length >= 2

  const { data = [], isFetching } = useQuery({
    queryKey: ['users', 'search', debounced],
    queryFn: ({ signal }) => usersApi.search(debounced, signal),
    enabled,
  })

  const candidates = data.filter((user) => !existingIds.has(user.id))

  return (
    <Stack gap="2">
      <Input
        aria-label="Find people to add"
        placeholder="Search by username or email"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      {enabled && !isFetching && candidates.length === 0 ? (
        <Text fontSize="sm" color="gray.600">
          No one to add for this search.
        </Text>
      ) : null}
      {candidates.map((user) => (
        <Flex key={user.id} align="center" justify="space-between" gap="3">
          <HStack gap="3" minW="0">
            <UserAvatar username={user.username} avatar={user.avatar} size={28} />
            <Text truncate>
              {user.username}{' '}
              <Text as="span" color="gray.600">
                {user.email}
              </Text>
            </Text>
          </HStack>
          <Button
            size="xs"
            colorPalette="blue"
            loading={isPending}
            aria-label={`Add ${user.username}`}
            onClick={() => {
              addMember(user.id, { onSuccess: () => setTerm('') })
            }}
          >
            Add
          </Button>
        </Flex>
      ))}
    </Stack>
  )
}

export function MembersPanel({ projectId, isOwner, currentUserId }: MembersPanelProps) {
  const { data: members, isPending, isError, refetch } = useMembers(projectId)
  const { mutate: removeMember, isPending: isRemoving, variables } = useRemoveMember(projectId)

  if (isPending) {
    return <PageSpinner label="Loading members" />
  }
  if (isError) {
    return <QueryError message="Members could not be loaded." onRetry={() => void refetch()} />
  }

  return (
    <Stack gap="4">
      <Stack gap="0" divideY="1px">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            canRemove={member.role !== 'owner' && (isOwner || member.id === currentUserId)}
            isRemoving={isRemoving && variables === member.id}
            onRemove={() => removeMember(member.id)}
          />
        ))}
      </Stack>
      {isOwner ? <AddMember projectId={projectId} existingIds={new Set(members.map((member) => member.id))} /> : null}
    </Stack>
  )
}
