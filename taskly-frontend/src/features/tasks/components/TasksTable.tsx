import { Flex, Table } from '@chakra-ui/react'
import NextLink from 'next/link'
import { BsArrowUp } from 'react-icons/bs'
import { Link } from '@chakra-ui/react'
import { paths } from '@/shared/config/paths'
import type { Task, TaskOrderBy } from '../types'
import { PriorityBadge, StatusBadge } from './TaskBadges'

type TasksTableProps = {
  tasks: Task[]
  orderBy?: TaskOrderBy
  onOrderByChange: (orderBy: TaskOrderBy) => void
}

const columns: { key: TaskOrderBy; label: string }[] = [
  { key: 'name', label: 'Task' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'due', label: 'Due Date' },
]

export function TasksTable({ tasks, orderBy, onOrderByChange }: TasksTableProps) {
  return (
    <Table.ScrollArea borderWidth="2px" borderColor="gray.100">
      <Table.Root>
        <Table.Header>
          <Table.Row bg="gray.100">
            {columns.map((column) => (
              <Table.ColumnHeader key={column.key} bg="gray.100" aria-sort={orderBy === column.key ? 'ascending' : 'none'}>
                <Flex as="button" cursor="pointer" alignItems="center" gap="1" onClick={() => onOrderByChange(column.key)}>
                  {column.label}
                  {orderBy === column.key && <BsArrowUp aria-hidden="true" />}
                </Flex>
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {tasks.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={columns.length} textAlign="center">
                No tasks found
              </Table.Cell>
            </Table.Row>
          ) : (
            tasks.map((task) => (
              <Table.Row key={task._id}>
                <Table.Cell>
                  <Link asChild>
                    <NextLink href={paths.task(task._id)}>{task.name}</NextLink>
                  </Link>
                </Table.Cell>
                <Table.Cell>
                  <PriorityBadge priority={task.priority} />
                </Table.Cell>
                <Table.Cell>
                  <StatusBadge status={task.status} />
                </Table.Cell>
                <Table.Cell>{new Date(task.due).toDateString()}</Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  )
}
