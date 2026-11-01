import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config/paths'
import { projectsApi } from '../api/projectsApi'
import { projectKeys } from '../queryKeys'
import type { CreateProjectValues, UpdateProjectValues } from '../types'

export function useCreateProject() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (values: CreateProjectValues) => projectsApi.create(values),
    onSuccess: async (project) => {
      toast.success(`Project ${project.name} created`)
      await queryClient.invalidateQueries({ queryKey: projectKeys.list() })
      router.push(paths.board(project.id))
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not create the project'))
    },
  })
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: UpdateProjectValues) => projectsApi.update(projectId, values),
    onSuccess: async (project) => {
      toast.success('Project saved')
      queryClient.setQueryData(projectKeys.detail(projectId), project)
      await queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not save the project'))
    },
  })
}

export function useDeleteProject(projectId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => projectsApi.remove(projectId),
    onSuccess: async () => {
      toast.success('Project deleted')
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) })
      await queryClient.invalidateQueries({ queryKey: projectKeys.list() })
      router.push(paths.projects)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not delete the project'))
    },
  })
}

export function useAddMember(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => projectsApi.addMember(projectId, userId),
    onSuccess: async (member) => {
      toast.success(`${member.username} joined the project`)
      await queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not add the member'))
    },
  })
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(projectId, userId),
    onSuccess: async () => {
      toast.success('Member removed')
      await queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not remove the member'))
    },
  })
}
