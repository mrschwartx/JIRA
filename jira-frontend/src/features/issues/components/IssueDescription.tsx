import { Box, Button, HStack, Stack, Text, Textarea } from '@chakra-ui/react'
import { useState } from 'react'

type IssueDescriptionProps = {
  value: string
  onSave: (value: string) => void
}

export function IssueDescription({ value, onSave }: IssueDescriptionProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const startEditing = () => {
    setDraft(value)
    setEditing(true)
  }

  if (editing) {
    return (
      <Stack gap="2">
        <Textarea aria-label="Description" rows={6} autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} />
        <HStack gap="2">
          <Button
            size="sm"
            colorPalette="blue"
            onClick={() => {
              if (draft !== value) {
                onSave(draft)
              }
              setEditing(false)
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </HStack>
      </Stack>
    )
  }

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label="Edit description"
      cursor="text"
      rounded="md"
      p="2"
      mx="-2"
      _hover={{ bg: 'gray.100' }}
      onClick={startEditing}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          startEditing()
        }
      }}
    >
      {value ? (
        <Text whiteSpace="pre-wrap" wordBreak="break-word">
          {value}
        </Text>
      ) : (
        <Text color="gray.600">Add a description...</Text>
      )}
    </Box>
  )
}
