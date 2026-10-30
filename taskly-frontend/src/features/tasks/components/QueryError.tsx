import { Box, Button, Text } from '@chakra-ui/react'

type QueryErrorProps = {
  message: string
  onRetry: () => void
}

export function QueryError({ message, onRetry }: QueryErrorProps) {
  return (
    <Box p="5" maxW="lg" mx="auto" textAlign="center" role="alert">
      <Text color="red.600" mb="3">
        {message}
      </Text>
      <Button onClick={onRetry}>Try again</Button>
    </Box>
  )
}
