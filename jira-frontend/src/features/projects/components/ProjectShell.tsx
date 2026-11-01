'use client'

import { Box, Flex, HStack, Link, Stack, Text } from '@chakra-ui/react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { FiColumns, FiSettings } from 'react-icons/fi'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config/paths'
import { PROJECT_CATEGORY_LABELS } from '../constants'
import { useProject } from '../hooks/useProjects'
import { PageSpinner, QueryError } from './QueryState'

type ProjectShellProps = {
  projectId: string
  children: ReactNode
}

type NavItemProps = {
  href: string
  active: boolean
  icon: ReactNode
  label: string
}

function NavItem({ href, active, icon, label }: NavItemProps) {
  return (
    <Link
      asChild
      px="3"
      py="2"
      rounded="md"
      color={active ? 'blue.700' : 'gray.700'}
      bg={active ? 'blue.50' : 'transparent'}
      fontWeight={active ? 'semibold' : 'normal'}
      _hover={{ bg: active ? 'blue.50' : 'gray.100', textDecoration: 'none' }}
      aria-current={active ? 'page' : undefined}
    >
      <NextLink href={href}>
        <HStack gap="3">
          {icon}
          <span>{label}</span>
        </HStack>
      </NextLink>
    </Link>
  )
}

export function ProjectShell({ projectId, children }: ProjectShellProps) {
  const pathname = usePathname()
  const { data: project, isPending, isError, error, refetch } = useProject(projectId)

  if (isPending) {
    return <PageSpinner label="Loading project" />
  }

  if (isError) {
    return (
      <Box maxW="lg" mx="auto">
        <QueryError message={getErrorMessage(error)} onRetry={() => void refetch()} />
        <Text textAlign="center">
          <Link asChild color="blue.600">
            <NextLink href={paths.projects}>Back to projects</NextLink>
          </Link>
        </Text>
      </Box>
    )
  }

  const boardHref = paths.board(project.id)
  const settingsHref = paths.settings(project.id)

  return (
    <Flex minH="calc(100vh - 48px)" direction={{ base: 'column', md: 'row' }}>
      <Stack
        as="aside"
        w={{ base: 'full', md: '240px' }}
        flexShrink="0"
        bg="white"
        borderRightWidth={{ md: '1px' }}
        borderBottomWidth={{ base: '1px', md: '0' }}
        p="4"
        gap="4"
      >
        <HStack gap="3">
          <Flex boxSize="40px" rounded="md" bg="#0747a6" color="white" align="center" justify="center" fontWeight="bold" fontSize="xs" flexShrink="0">
            {project.key}
          </Flex>
          <Box minW="0">
            <Text fontWeight="semibold" truncate>
              {project.name}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {PROJECT_CATEGORY_LABELS[project.category]} project
            </Text>
          </Box>
        </HStack>
        <Stack as="nav" aria-label="Project" gap="1" direction={{ base: 'row', md: 'column' }}>
          <NavItem href={boardHref} active={pathname.startsWith(boardHref)} icon={<FiColumns aria-hidden />} label="Board" />
          <NavItem href={settingsHref} active={pathname.startsWith(settingsHref)} icon={<FiSettings aria-hidden />} label="Project settings" />
        </Stack>
      </Stack>
      <Box flex="1" minW="0" p={{ base: '4', md: '6' }}>
        {children}
      </Box>
    </Flex>
  )
}
