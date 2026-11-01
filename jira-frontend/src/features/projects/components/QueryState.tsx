import { Box, Button, Spinner, Text } from '@chakra-ui/react'

type QueryErrorProps = {
  message: string
  onRetry?: () => void
}

export function QueryError({ message, onRetry }: QueryErrorProps) {
  return (
    <Box role="alert" textAlign="center" py="16" px="4">
      <Text fontSize="lg" fontWeight="semibold" mb="2">
        Something went wrong
      </Text>
      <Text color="gray.600" mb="4">
        {message}
      </Text>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Box>
  )
}

export function PageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <Box textAlign="center" py="16" role="status" aria-label={label}>
      <Spinner size="lg" color="blue.600" />
    </Box>
  )
}
