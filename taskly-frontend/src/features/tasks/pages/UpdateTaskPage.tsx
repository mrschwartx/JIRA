'use client'

import { Box, Heading } from '@chakra-ui/react'
import { useParams, useRouter } from 'next/navigation'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config/paths'
import { QueryError } from '../components/QueryError'
import { TaskForm } from '../components/TaskForm'
import { UpdateTaskSkeleton } from '../components/UpdateTaskSkeleton'
import { useTask } from '../hooks/useTask'
import { useUpdateTask } from '../hooks/useUpdateTask'
import { toTaskFormValues, toTaskPayload } from '../utils/taskForm'

export function UpdateTaskPage() {
  const { taskId = '' } = useParams<{ taskId?: string }>()
  const router = useRouter()
  const { data: task, isPending, isError, error, refetch } = useTask(taskId)
  const { mutate, isPending: isSaving } = useUpdateTask(taskId)

  if (isPending) {
    return <UpdateTaskSkeleton />
  }

  if (isError) {
    return <QueryError message={getErrorMessage(error)} onRetry={() => void refetch()} />
  }

  return (
    <Box p="3" maxW="4xl" mx="auto">
      <Heading as="h1" fontSize="3xl" fontWeight="semibold" textAlign="center" my="7">
        Update Task
      </Heading>
      <TaskForm
        key={task._id}
        defaultValues={toTaskFormValues(task)}
        isSubmitting={isSaving}
        onSubmit={(values) =>
          mutate(toTaskPayload(values), {
            onSuccess: () => router.push(paths.task(taskId)),
          })
        }
      />
    </Box>
  )
}
