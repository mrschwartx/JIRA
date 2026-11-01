import { Box, Button, HStack, Input } from '@chakra-ui/react'
import { FiSearch } from 'react-icons/fi'
import { UserAvatar } from '@/features/users'
import type { Member } from '@/features/projects'
import type { IssueFilters } from '../types'
import { EMPTY_FILTERS, hasActiveFilters } from '../utils/filters'

type BoardFiltersProps = {
  filters: IssueFilters
  members: readonly Member[]
  onChange: (filters: IssueFilters) => void
}

export function BoardFilters({ filters, members, onChange }: BoardFiltersProps) {
  const toggleAssignee = (id: string) => {
    const assigneeIds = filters.assigneeIds.includes(id) ? filters.assigneeIds.filter((entry) => entry !== id) : [...filters.assigneeIds, id]
    onChange({ ...filters, assigneeIds })
  }

  return (
    <HStack gap="3" wrap="wrap" mb="5" role="search" aria-label="Board filters">
      <Box position="relative" w={{ base: 'full', sm: '180px' }}>
        <Box position="absolute" left="2.5" top="50%" transform="translateY(-50%)" color="gray.500" pointerEvents="none">
          <FiSearch aria-hidden />
        </Box>
        <Input
          size="sm"
          pl="8"
          aria-label="Filter issues by title"
          placeholder="Filter by title"
          value={filters.text}
          onChange={(event) => onChange({ ...filters, text: event.target.value })}
        />
      </Box>
      <HStack gap="1" aria-label="Filter by assignee">
        {members.map((member) => {
          const active = filters.assigneeIds.includes(member.id)
          return (
            <Button
              key={member.id}
              variant="plain"
              p="0.5"
              h="auto"
              minW="0"
              rounded="full"
              aria-pressed={active}
              aria-label={`Show issues assigned to ${member.username}`}
              borderWidth="2px"
              borderColor={active ? 'blue.500' : 'transparent'}
              onClick={() => toggleAssignee(member.id)}
            >
              <UserAvatar username={member.username} avatar={member.avatar} size={30} />
            </Button>
          )
        })}
      </HStack>
      <Button size="sm" variant={filters.onlyMine ? 'solid' : 'outline'} colorPalette={filters.onlyMine ? 'blue' : 'gray'} aria-pressed={filters.onlyMine} onClick={() => onChange({ ...filters, onlyMine: !filters.onlyMine })}>
        Only my issues
      </Button>
      <Button size="sm" variant={filters.recentOnly ? 'solid' : 'outline'} colorPalette={filters.recentOnly ? 'blue' : 'gray'} aria-pressed={filters.recentOnly} onClick={() => onChange({ ...filters, recentOnly: !filters.recentOnly })}>
        Recently updated
      </Button>
      {hasActiveFilters(filters) ? (
        <Button size="sm" variant="plain" color="blue.700" onClick={() => onChange(EMPTY_FILTERS)}>
          Clear all
        </Button>
      ) : null}
    </HStack>
  )
}
