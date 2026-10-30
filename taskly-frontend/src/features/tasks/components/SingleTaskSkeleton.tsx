'use client'

import { Box, Skeleton, Stack } from '@chakra-ui/react'

export function SingleTaskSkeleton() {
  return (
    <Box p="3" maxW="lg" mx="auto" aria-busy="true" aria-label="Loading task">
      <Stack gap="4">
        <Skeleton height="20px" my="10" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
      </Stack>
    </Box>
  )
}
