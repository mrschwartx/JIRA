import { Box, Flex, HStack, Link, Text } from '@chakra-ui/react'
import { Draggable } from '@hello-pangea/dnd'
import NextLink from 'next/link'
import { UserAvatar } from '@/features/users'
import { paths } from '@/shared/config/paths'
import type { Member } from '@/features/projects'
import type { Issue } from '../types'
import { formatIssueKey } from '../utils/issueKey'
import { IssueTypeIcon, PriorityIcon } from './IssueIcons'

type IssueCardProps = {
  issue: Issue
  index: number
  projectKey: string
  membersById: ReadonlyMap<string, Member>
}

export function IssueCard({ issue, index, projectKey, membersById }: IssueCardProps) {
  const key = formatIssueKey(projectKey, issue.number)
  const assignees = issue.assigneeIds.flatMap((id) => membersById.get(id) ?? [])

  return (
    <Draggable draggableId={issue.id} index={index}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          mb="2"
          bg="white"
          rounded="sm"
          p="2.5"
          shadow={snapshot.isDragging ? 'md' : 'xs'}
          borderWidth="1px"
          borderColor={snapshot.isDragging ? 'blue.300' : 'transparent'}
          _hover={{ bg: 'gray.50' }}
        >
          <Link
            asChild
            display="block"
            color="inherit"
            _hover={{ textDecoration: 'none' }}
            aria-label={`${key} ${issue.title}`}
            draggable={false}
          >
            <NextLink href={paths.issue(issue.projectId, issue.id)} scroll={false} draggable={false}>
              <Text lineClamp="3" mb="3" fontSize="sm">
                {issue.title}
              </Text>
              <Flex justify="space-between" align="center" gap="2">
                <HStack gap="2" minW="0">
                  <IssueTypeIcon type={issue.type} />
                  <Text fontSize="xs" color="gray.600" truncate>
                    {key}
                  </Text>
                  <PriorityIcon priority={issue.priority} />
                </HStack>
                <HStack gap="0" aria-label={assignees.length ? `Assigned to ${assignees.map((a) => a.username).join(', ')}` : 'Unassigned'}>
                  {assignees.map((member, position) => (
                    <Box key={member.id} ml={position === 0 ? '0' : '-6px'} rounded="full" borderWidth="2px" borderColor="white">
                      <UserAvatar username={member.username} avatar={member.avatar} size={22} />
                    </Box>
                  ))}
                </HStack>
              </Flex>
            </NextLink>
          </Link>
        </Box>
      )}
    </Draggable>
  )
}
