'use client'

import { Box, Flex, Heading, Image, Link, Stack, Text } from '@chakra-ui/react'
import NextLink from 'next/link'
import { paths } from '@/shared/config/paths'

export function HomePage() {
  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      align="center"
      gap={{ base: '8', md: '6' }}
      px={{ base: '5', md: '10', lg: '14' }}
      py={{ base: '8', md: '14' }}
      maxW="6xl"
      mx="auto"
      w="full"
    >
      <Stack flex="1" minW="0" gap="4">
        <Heading
          as="h1"
          fontSize={{ base: '3xl', sm: '4xl', md: '5xl', lg: '6xl' }}
          fontWeight="bold"
          color="gray.700"
          lineHeight="1"
        >
          Make your{' '}
          <Text as="span" color="gray.500">
            perfect
          </Text>
          <br />
          day
        </Heading>

        <Box color="gray.500" pt={{ base: '4', md: '8' }} fontSize={{ base: 'md', md: 'lg' }}>
          Taskly will help you manage your day and to-do list.
          <br />
          We have a wide range of features to help you get things done.
        </Box>

        <Link asChild fontWeight="bold" color="blue.400">
          <NextLink href={paths.profile}>Let&apos;s get started...</NextLink>
        </Link>
      </Stack>

      <Box flex="1" minW="0" display="flex" justifyContent="center">
        <Image
          src="/productive.svg"
          alt="Productive Illustration"
          w="full"
          maxW={{ base: '280px', sm: '340px', md: '400px' }}
          h="auto"
        />
      </Box>
    </Flex>
  )
}