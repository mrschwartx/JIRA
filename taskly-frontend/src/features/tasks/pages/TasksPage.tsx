'use client'

import { Box, Button, Flex, Heading, NativeSelect } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { Pagination } from '@/shared/components'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config/paths'
import { QueryError } from '../components/QueryError'
import { TasksSkeleton } from '../components/TasksSkeleton'
import { TasksTable } from '../components/TasksTable'
import { TASK_STATUSES, TASK_STATUS_LABELS, TASKS_PAGE_SIZE } from '../constants'
import { useTasks } from '../hooks/useTasks'
import type { TaskFilterPatch } from '../types'
import { applyTaskFilterPatch, isTaskStatus, parseTaskFilters } from '../utils/taskFilters'

export function TasksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseTaskFilters(searchParams), [searchParams])
  const { data, isPending, isError, error, refetch } = useTasks(filters)

  const updateFilters = (patch: TaskFilterPatch) => {
    const query = applyTaskFilterPatch(searchParams, patch).toString()
    router.push(query ? `${paths.tasks}?${query}` : paths.tasks)
  }

  if (isPending) {
    return <TasksSkeleton />
  }

  if (isError) {
    return <QueryError message={getErrorMessage(error)} onRetry={() => void refetch()} />
  }

  return (
    <Box p="5" maxW="3xl" mx="auto">
      <Heading as="h1" fontSize="3xl" fontWeight="semibold" textAlign="center" my="7">
        MY TASKS
      </Heading>
      <Flex justify="space-between" mb="3">
        <Box w="140px">
          <NativeSelect.Root>
            <NativeSelect.Field
              aria-label="Filter by status"
              placeholder="All"
              value={filters.status ?? ''}
              onChange={(event) => {
                const value = event.target.value
                updateFilters({ status: isTaskStatus(value) ? value : undefined, page: undefined })
              }}
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {TASK_STATUS_LABELS[status]}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Box>
        <Button asChild colorPalette="green" textTransform="uppercase" fontWeight="semibold">
          <NextLink href={paths.createTask}>Create New Task</NextLink>
        </Button>
      </Flex>
      <TasksTable
        tasks={data.tasks}
        orderBy={filters.orderBy}
        onOrderByChange={(orderBy) => updateFilters({ orderBy, page: undefined })}
      />
      <Pagination
        itemCount={data.taskCount}
        pageSize={TASKS_PAGE_SIZE}
        currentPage={filters.page}
        onPageChange={(page) => updateFilters({ page })}
      />
    </Box>
  )
}
