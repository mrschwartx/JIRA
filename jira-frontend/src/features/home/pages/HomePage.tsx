'use client'

import { Box, Button, Flex, Heading, HStack, Stack, Text } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useSession } from '@/features/auth'
import { paths } from '@/shared/config/paths'

const COLUMNS = [
  { title: 'Backlog', cards: ['Dark mode', 'Search relevance'] },
  { title: 'In progress', cards: ['Login redirect bug', 'Drag and drop'] },
  { title: 'Done', cards: ['Set up CI'] },
]

function BoardPreview() {
  return (
    <HStack align="start" gap="3" aria-hidden>
      {COLUMNS.map((column) => (
        <Stack key={column.title} gap="2" bg="#ebecf0" p="2" rounded="md" w="150px">
          <Text fontSize="xs" fontWeight="semibold" color="gray.600">
            {column.title}
          </Text>
          {column.cards.map((card) => (
            <Box key={card} bg="white" p="2" rounded="sm" shadow="xs" fontSize="sm">
              {card}
            </Box>
          ))}
        </Stack>
      ))}
    </HStack>
  )
}

export function HomePage() {
  const { isAuthenticated, isReady } = useSession()

  return (
    <Flex
      direction={{ base: 'column', lg: 'row' }}
      align="center"
      gap={{ base: '10', lg: '14' }}
      px={{ base: '5', md: '10', lg: '14' }}
      py={{ base: '10', md: '16' }}
      maxW="6xl"
      mx="auto"
    >
      <Stack flex="1" gap="5">
        <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }} lineHeight="1.1">
          Move work from backlog to done
        </Heading>
        <Text color="gray.600" fontSize={{ base: 'md', md: 'lg' }} maxW="lg">
          Create projects, invite your team, and drag issues across a shared board. Every issue keeps its
          assignees, estimates and conversation in one place.
        </Text>
        <HStack gap="3" minH="10">
          {!isReady ? null : isAuthenticated ? (
            <Button asChild colorPalette="blue">
              <NextLink href={paths.projects}>Open your projects</NextLink>
            </Button>
          ) : (
            <>
              <Button asChild colorPalette="blue">
                <NextLink href={paths.signUp}>Create account</NextLink>
              </Button>
              <Button asChild variant="outline">
                <NextLink href={paths.signIn}>Sign in</NextLink>
              </Button>
            </>
          )}
        </HStack>
      </Stack>
      <Box flex="1" overflowX="auto" maxW="full">
        <BoardPreview />
      </Box>
    </Flex>
  )
}
