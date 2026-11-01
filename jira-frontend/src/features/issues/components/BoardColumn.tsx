import { Box, Flex, Text } from '@chakra-ui/react'
import { Droppable } from '@hello-pangea/dnd'
import type { Member } from '@/features/projects'
import { ISSUE_STATUS_LABELS } from '../constants'
import type { Issue, IssueStatus } from '../types'
import { IssueCard } from './IssueCard'

type BoardColumnProps = {
  status: IssueStatus
  issues: Issue[]
  projectKey: string
  membersById: ReadonlyMap<string, Member>
}

export function BoardColumn({ status, issues, projectKey, membersById }: BoardColumnProps) {
  const label = ISSUE_STATUS_LABELS[status]

  return (
    <Flex direction="column" bg="#ebecf0" rounded="md" p="2" minW="240px" flex="1" role="group" aria-label={label}>
      <Flex align="baseline" gap="2" px="2" py="1.5">
        <Text as="h2" fontSize="xs" fontWeight="semibold" color="gray.600">
          {label}
        </Text>
        <Text fontSize="xs" color="gray.500" aria-label={`${issues.length} issues`}>
          {issues.length}
        </Text>
      </Flex>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            flex="1"
            minH="120px"
            rounded="sm"
            p="1"
            bg={snapshot.isDraggingOver ? 'blue.50' : 'transparent'}
            transition="background 120ms"
          >
            {issues.map((issue, index) => (
              <IssueCard key={issue.id} issue={issue} index={index} projectKey={projectKey} membersById={membersById} />
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Flex>
  )
}
