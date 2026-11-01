import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../api/projectsApi'
import { projectKeys } from '../queryKeys'

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: ({ signal }) => projectsApi.list(signal),
  })
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: ({ signal }) => projectsApi.get(projectId, signal),
  })
}

export function useMembers(projectId: string) {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: ({ signal }) => projectsApi.listMembers(projectId, signal),
  })
}
