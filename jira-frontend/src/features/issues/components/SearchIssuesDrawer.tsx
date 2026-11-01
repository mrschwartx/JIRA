import { Box, CloseButton, Drawer, HStack, Input, Portal, Stack, Text } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useState } from 'react'
import { paths } from '@/shared/config/paths'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { useIssueSearch, useIssues } from '../hooks/useIssues'
import type { Issue } from '../types'
import { formatIssueKey } from '../utils/issueKey'
import { IssueTypeIcon } from './IssueIcons'

type SearchIssuesDrawerProps = {
  projectId: string
  projectKey: string
  open: boolean
  onClose: () => void
}

const RECENT_COUNT = 10

function ResultItem({ issue, projectKey, onSelect }: { issue: Issue; projectKey: string; onSelect: () => void }) {
  return (
    <Box asChild p="2" rounded="md" _hover={{ bg: 'gray.100' }}>
      <NextLink href={paths.issue(issue.projectId, issue.id)} scroll={false} onClick={onSelect}>
        <HStack gap="3" align="start">
          <Box mt="0.5">
            <IssueTypeIcon type={issue.type} />
          </Box>
          <Box minW="0">
            <Text fontSize="sm" lineClamp="2">
              {issue.title}
            </Text>
            <Text fontSize="xs" color="gray.600">
              {formatIssueKey(projectKey, issue.number)}
            </Text>
          </Box>
        </HStack>
      </NextLink>
    </Box>
  )
}

export function SearchIssuesDrawer({ projectId, projectKey, open, onClose }: SearchIssuesDrawerProps) {
  const [term, setTerm] = useState('')
  const debounced = useDebouncedValue(term.trim(), 300)
  const all = useIssues(projectId)
  const search = useIssueSearch(projectId, debounced)

  const recent = [...(all.data ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, RECENT_COUNT)
  const searching = debounced.length > 0
  const results = searching ? (search.data ?? []) : recent

  const handleClose = () => {
    setTerm('')
    onClose()
  }

  return (
    <Drawer.Root open={open} placement="start" lazyMount unmountOnExit onOpenChange={(details) => !details.open && handleClose()}>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Search issues</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <Stack gap="4">
                <Input aria-label="Search issues" placeholder="Search issues by title or description" autoFocus value={term} onChange={(event) => setTerm(event.target.value)} />
                <Text fontSize="xs" fontWeight="semibold" color="gray.600">
                  {searching ? 'Matching issues' : 'Recent issues'}
                </Text>
                {searching && search.isFetching ? (
                  <Text color="gray.600" fontSize="sm">
                    Searching...
                  </Text>
                ) : results.length === 0 ? (
                  <Text color="gray.600" fontSize="sm">
                    {searching ? 'No issues match your search.' : 'There are no issues yet.'}
                  </Text>
                ) : (
                  <Stack gap="1" as="ul" m="0" p="0" listStyleType="none">
                    {results.map((issue) => (
                      <li key={issue.id}>
                        <ResultItem issue={issue} projectKey={projectKey} onSelect={handleClose} />
                      </li>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Drawer.Body>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
