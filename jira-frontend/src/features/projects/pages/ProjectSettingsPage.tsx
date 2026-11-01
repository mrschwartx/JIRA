'use client'

import { Box, Button, Heading, Stack, Text, useDisclosure } from '@chakra-ui/react'
import { useSession } from '@/features/auth'
import { getErrorMessage } from '@/shared/api'
import { DeleteConfirmation } from '@/shared/components'
import { MembersPanel } from '../components/MembersPanel'
import { ProjectForm } from '../components/ProjectForm'
import { PageSpinner, QueryError } from '../components/QueryState'
import { useDeleteProject, useUpdateProject } from '../hooks/useProjectMutations'
import { useProject } from '../hooks/useProjects'

type ProjectSettingsPageProps = {
  projectId: string
}

export function ProjectSettingsPage({ projectId }: ProjectSettingsPageProps) {
  const { user } = useSession()
  const { data: project, isPending, isError, error, refetch } = useProject(projectId)
  const { mutate: update, isPending: isSaving } = useUpdateProject(projectId)
  const { mutate: remove, isPending: isDeleting } = useDeleteProject(projectId)
  const { open, onOpen, onClose } = useDisclosure()

  if (isPending) {
    return <PageSpinner label="Loading project" />
  }
  if (isError) {
    return <QueryError message={getErrorMessage(error)} onRetry={() => void refetch()} />
  }

  const isOwner = project.role === 'owner'

  return (
    <Box maxW="2xl">
      <DeleteConfirmation alertTitle={`Delete ${project.name}`} isOpen={open} isPending={isDeleting} onClose={onClose} onConfirm={() => remove()} />
      <Heading as="h1" fontSize="2xl" mb="6">
        Project settings
      </Heading>
      <Stack gap="8">
        <Box bg="white" borderWidth="1px" rounded="md" p="5">
          <Heading as="h2" fontSize="lg" mb="4">
            Details
          </Heading>
          {isOwner ? (
            <ProjectForm
              key={project.updatedAt}
              mode="edit"
              isSubmitting={isSaving}
              submitLabel="Save changes"
              defaultValues={{
                key: project.key,
                name: project.name,
                category: project.category,
                url: project.url ?? '',
                description: project.description,
              }}
              onSubmit={({ name, category, url, description }) => update({ name, category, url, description })}
            />
          ) : (
            <Text color="gray.600">Only the project owner can change these details.</Text>
          )}
        </Box>
        <Box bg="white" borderWidth="1px" rounded="md" p="5">
          <Heading as="h2" fontSize="lg" mb="4">
            Members
          </Heading>
          <MembersPanel projectId={projectId} isOwner={isOwner} currentUserId={user?.id ?? ''} />
        </Box>
        {isOwner ? (
          <Box bg="white" borderWidth="1px" borderColor="red.200" rounded="md" p="5">
            <Heading as="h2" fontSize="lg" mb="2">
              Delete project
            </Heading>
            <Text color="gray.600" mb="4">
              Deleting a project removes its issues, comments and memberships for everyone.
            </Text>
            <Button colorPalette="red" variant="outline" onClick={onOpen}>
              Delete project
            </Button>
          </Box>
        ) : null}
      </Stack>
    </Box>
  )
}
