import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/shared/api'
import { issuesApi } from '../api/issuesApi'
import { issueKeys } from '../queryKeys'
import type { CreateIssueValues, Issue, UpdateIssueChanges } from '../types'

type UpdateVariables = {
  issueId: string
  changes: UpdateIssueChanges
}

export function useCreateIssue(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: CreateIssueValues) => issuesApi.create(projectId, values),
    onSuccess: async (issue) => {
      toast.success('Issue created')
      queryClient.setQueryData<Issue[]>(issueKeys.list(projectId), (current) => (current ? [...current, issue] : [issue]))
      await queryClient.invalidateQueries({ queryKey: issueKeys.all })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not create the issue'))
    },
  })
}

export function useUpdateIssue(projectId: string) {
  const queryClient = useQueryClient()
  const key = issueKeys.list(projectId)
  const mutationKey = [...issueKeys.all, 'update', projectId] as const

  return useMutation({
    mutationKey,
    mutationFn: ({ issueId, changes }: UpdateVariables) => issuesApi.update(projectId, issueId, changes),
    onMutate: async ({ issueId, changes }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Issue[]>(key)
      queryClient.setQueryData<Issue[]>(key, (current) =>
        current?.map((issue) =>
          issue.id === issueId ? { ...issue, ...changes, updatedAt: new Date().toISOString() } : issue,
        ),
      )
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous)
      }
      toast.error(getErrorMessage(error, 'Could not update the issue'))
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey }) <= 1) {
        void queryClient.invalidateQueries({ queryKey: issueKeys.all })
      }
    },
  })
}

export function useDeleteIssue(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (issueId: string) => issuesApi.remove(projectId, issueId),
    onSuccess: async (_result, issueId) => {
      toast.success('Issue deleted')
      queryClient.setQueryData<Issue[]>(issueKeys.list(projectId), (current) =>
        current?.filter((issue) => issue.id !== issueId),
      )
      await queryClient.invalidateQueries({ queryKey: issueKeys.all })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not delete the issue'))
    },
  })
}
