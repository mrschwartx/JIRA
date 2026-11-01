'use client'

import { Box, Breadcrumb, Button, Flex, Heading, HStack, Text, useDisclosure } from '@chakra-ui/react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { FiPlus, FiSearch } from 'react-icons/fi'
import { useSession } from '@/features/auth'
import { PageSpinner, QueryError, useMembers, useProject } from '@/features/projects'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config/paths'
import { BoardColumn } from '../components/BoardColumn'
import { BoardFilters } from '../components/BoardFilters'
import { CreateIssueModal } from '../components/CreateIssueModal'
import { IssueDetailsModal } from '../components/IssueDetailsModal'
import { SearchIssuesDrawer } from '../components/SearchIssuesDrawer'
import { ISSUE_STATUSES } from '../constants'
import { useUpdateIssue } from '../hooks/useIssueMutations'
import { useIssues } from '../hooks/useIssues'
import type { IssueFilters, IssueStatus } from '../types'
import { EMPTY_FILTERS, filterIssues } from '../utils/filters'
import { calculateListPosition, isPositionChanged, issuesInColumn } from '../utils/listPosition'

type BoardPageProps = {
  projectId: string
  issueId?: string
}

const isStatus = (value: string): value is IssueStatus => (ISSUE_STATUSES as readonly string[]).includes(value)

export function BoardPage({ projectId, issueId }: BoardPageProps) {
  const router = useRouter()
  const { user } = useSession()
  const project = useProject(projectId)
  const members = useMembers(projectId)
  const issues = useIssues(projectId)
  const { mutate: updateIssue } = useUpdateIssue(projectId)
  const [filters, setFilters] = useState<IssueFilters>(EMPTY_FILTERS)
  const createModal = useDisclosure()
  const searchDrawer = useDisclosure()

  const membersById = useMemo(() => new Map((members.data ?? []).map((member) => [member.id, member])), [members.data])
  const visibleIssues = useMemo(() => filterIssues(issues.data ?? [], filters, user?.id), [issues.data, filters, user?.id])

  if (issues.isPending || project.isPending || members.isPending) {
    return <PageSpinner label="Loading board" />
  }
  if (issues.isError || project.isError || members.isError) {
    const error = issues.error ?? project.error ?? members.error
    return (
      <QueryError
        message={getErrorMessage(error)}
        onRetry={() => {
          void issues.refetch()
          void project.refetch()
          void members.refetch()
        }}
      />
    )
  }

  const onDragEnd = ({ source, destination, draggableId }: DropResult) => {
    if (!destination || !isStatus(source.droppableId) || !isStatus(destination.droppableId)) {
      return
    }
    const from = { status: source.droppableId, index: source.index }
    const to = { status: destination.droppableId, index: destination.index }
    if (!isPositionChanged(from, to)) {
      return
    }
    const listPosition = calculateListPosition(issuesInColumn(visibleIssues, to.status), draggableId, to.index)
    updateIssue({ issueId: draggableId, changes: { status: to.status, listPosition } })
  }

  const closeDetails = () => {
    router.push(paths.board(projectId), { scroll: false })
  }

  return (
    <Box>
      <Breadcrumb.Root mb="2">
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link asChild>
              <NextLink href={paths.projects}>Projects</NextLink>
            </Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Link asChild>
              <NextLink href={paths.board(projectId)}>{project.data.name}</NextLink>
            </Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.CurrentLink>Board</Breadcrumb.CurrentLink>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
      <Flex justify="space-between" align="center" gap="3" wrap="wrap" mb="4">
        <Heading as="h1" fontSize="2xl">
          Board
        </Heading>
        <HStack gap="2">
          <Button variant="outline" onClick={searchDrawer.onOpen}>
            <FiSearch aria-hidden /> Search issues
          </Button>
          <Button colorPalette="blue" onClick={createModal.onOpen}>
            <FiPlus aria-hidden /> Create issue
          </Button>
        </HStack>
      </Flex>
      <BoardFilters filters={filters} members={members.data} onChange={setFilters} />
      {issues.data.length === 0 ? (
        <Text color="gray.600" mb="4">
          This project has no issues yet. Create the first one to get started.
        </Text>
      ) : null}
      <DragDropContext onDragEnd={onDragEnd}>
        <Flex gap="3" overflowX="auto" pb="4" align="stretch">
          {ISSUE_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              issues={issuesInColumn(visibleIssues, status)}
              projectKey={project.data.key}
              membersById={membersById}
            />
          ))}
        </Flex>
      </DragDropContext>
      <CreateIssueModal
        projectId={projectId}
        members={members.data}
        currentUserId={user?.id ?? ''}
        open={createModal.open}
        onClose={createModal.onClose}
      />
      <SearchIssuesDrawer projectId={projectId} projectKey={project.data.key} open={searchDrawer.open} onClose={searchDrawer.onClose} />
      {issueId ? (
        <IssueDetailsModal
          projectId={projectId}
          projectKey={project.data.key}
          issueId={issueId}
          members={members.data}
          currentUserId={user?.id ?? ''}
          isOwner={project.data.role === 'owner'}
          onClose={closeDetails}
        />
      ) : null}
    </Box>
  )
}
