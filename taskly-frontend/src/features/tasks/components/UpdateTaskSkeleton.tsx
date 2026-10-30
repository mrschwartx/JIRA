'use client'

import { Box, Flex, Skeleton, Stack } from '@chakra-ui/react'

export function UpdateTaskSkeleton() {
  return (
    <Box p="3" maxW="4xl" mx="auto" aria-busy="true" aria-label="Loading task form">
      <Flex direction="row" gap="4" mt="7">
        {[0, 1].map((column) => (
          <Box key={column} width="50%">
            <Stack gap="4">
              <Skeleton height="20px" />
              <Skeleton height="20px" />
              <Skeleton height="20px" />
              <Skeleton height="20px" />
            </Stack>
          </Box>
        ))}
      </Flex>
    </Box>
  )
}
