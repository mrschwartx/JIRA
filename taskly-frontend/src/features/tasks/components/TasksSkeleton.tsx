'use client'

import { Skeleton, Stack } from '@chakra-ui/react'

export function TasksSkeleton() {
  return (
    <Stack p="5" maxW="3xl" mx="auto" gap="4" aria-busy="true" aria-label="Loading tasks">
      <Skeleton height="20px" my="7" />
      <Skeleton height="20px" />
      <Skeleton height="100px" />
    </Stack>
  )
}
