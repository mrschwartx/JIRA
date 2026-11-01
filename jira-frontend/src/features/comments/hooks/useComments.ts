import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/shared/api'
import { commentsApi } from '../api/commentsApi'

const commentKeys = {
  list: (projectId: string, issueId: string) => ['comments', projectId, issueId] as const,
}

export function useComments(projectId: string, issueId: string) {
  return useQuery({
    queryKey: commentKeys.list(projectId, issueId),
    queryFn: ({ signal }) => commentsApi.list(projectId, issueId, signal),
  })
}

export function useCommentMutations(projectId: string, issueId: string) {
  const queryClient = useQueryClient()
  const key = commentKeys.list(projectId, issueId)
  const refresh = () => queryClient.invalidateQueries({ queryKey: key })

  const create = useMutation({
    mutationFn: (body: string) => commentsApi.create(projectId, issueId, body),
    onSuccess: refresh,
    onError: (error) => toast.error(getErrorMessage(error, 'Could not add the comment')),
  })

  const update = useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      commentsApi.update(projectId, issueId, commentId, body),
    onSuccess: refresh,
    onError: (error) => toast.error(getErrorMessage(error, 'Could not save the comment')),
  })

  const remove = useMutation({
    mutationFn: (commentId: string) => commentsApi.remove(projectId, issueId, commentId),
    onSuccess: refresh,
    onError: (error) => toast.error(getErrorMessage(error, 'Could not delete the comment')),
  })

  return { create, update, remove }
}
