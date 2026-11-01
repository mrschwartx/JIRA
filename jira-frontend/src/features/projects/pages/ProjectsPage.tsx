'use client'

import { Badge, Box, Button, CloseButton, Dialog, Flex, Grid, Heading, HStack, Portal, Text, useDisclosure } from '@chakra-ui/react'
import NextLink from 'next/link'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config/paths'
import { ProjectForm } from '../components/ProjectForm'
import { PageSpinner, QueryError } from '../components/QueryState'
import { PROJECT_CATEGORY_LABELS } from '../constants'
import { useCreateProject } from '../hooks/useProjectMutations'
import { useProjects } from '../hooks/useProjects'

function CreateProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate, isPending } = useCreateProject()

  return (
    <Dialog.Root open={open} placement="center" lazyMount unmountOnExit onOpenChange={(details) => !details.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Create project</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body pb="6">
              <ProjectForm mode="create" isSubmitting={isPending} submitLabel="Create project" onSubmit={(values) => mutate(values)} />
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

export function ProjectsPage() {
  const { data, isPending, isError, error, refetch } = useProjects()
  const { open, onOpen, onClose } = useDisclosure()

  return (
    <Box maxW="5xl" mx="auto" p={{ base: '4', md: '8' }}>
      <CreateProjectDialog open={open} onClose={onClose} />
      <Flex justify="space-between" align="center" mb="6" gap="3" wrap="wrap">
        <Heading as="h1" fontSize="2xl">
          Projects
        </Heading>
        <Button colorPalette="blue" onClick={onOpen}>
          Create project
        </Button>
      </Flex>
      {isPending ? (
        <PageSpinner label="Loading projects" />
      ) : isError ? (
        <QueryError message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : data.length === 0 ? (
        <Box bg="white" borderWidth="1px" rounded="md" p="10" textAlign="center">
          <Text fontWeight="semibold" mb="1">
            You have no projects yet
          </Text>
          <Text color="gray.600" mb="4">
            Create a project to start tracking issues on a board.
          </Text>
          <Button colorPalette="blue" onClick={onOpen}>
            Create your first project
          </Button>
        </Box>
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(260px, 1fr))" gap="4">
          {data.map((project) => (
            <Box
              key={project.id}
              asChild
              bg="white"
              borderWidth="1px"
              rounded="md"
              p="4"
              _hover={{ borderColor: 'blue.400', shadow: 'sm' }}
              _focusVisible={{ outline: '2px solid', outlineColor: 'blue.500' }}
            >
              <NextLink href={paths.board(project.id)}>
                <HStack gap="3" mb="3">
                  <Flex boxSize="36px" rounded="md" bg="#0747a6" color="white" align="center" justify="center" fontWeight="bold" fontSize="xs">
                    {project.key}
                  </Flex>
                  <Text fontWeight="semibold" truncate>
                    {project.name}
                  </Text>
                </HStack>
                <HStack gap="2">
                  <Badge>{PROJECT_CATEGORY_LABELS[project.category]}</Badge>
                  {project.role === 'owner' ? <Badge colorPalette="blue">Owner</Badge> : <Badge colorPalette="gray">Member</Badge>}
                </HStack>
              </NextLink>
            </Box>
          ))}
        </Grid>
      )}
    </Box>
  )
}
