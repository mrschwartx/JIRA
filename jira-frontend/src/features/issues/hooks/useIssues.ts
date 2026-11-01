import { useQuery } from '@tanstack/react-query'
import { issuesApi } from '../api/issuesApi'
import { issueKeys } from '../queryKeys'

export function useIssues(projectId: string) {
  return useQuery({
    queryKey: issueKeys.list(projectId),
    queryFn: ({ signal }) => issuesApi.list(projectId, signal),
  })
}

export function useIssueSearch(projectId: string, term: string) {
  return useQuery({
    queryKey: issueKeys.search(projectId, term),
    queryFn: ({ signal }) => issuesApi.search(projectId, term, signal),
    enabled: term.length > 0,
  })
}
