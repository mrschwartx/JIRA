import { Button, Dialog, Portal, Text } from '@chakra-ui/react'

type DeleteConfirmationProps = {
  alertTitle: string
  isOpen: boolean
  isPending?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmation({ alertTitle, isOpen, isPending = false, onClose, onConfirm }: DeleteConfirmationProps) {
  return (
    <Dialog.Root
      role="alertdialog"
      open={isOpen}
      placement="center"
      lazyMount
      unmountOnExit
      onOpenChange={(details) => {
        if (!details.open) {
          onClose()
        }
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title fontSize="lg" fontWeight="bold">
                {alertTitle}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>Are you sure? You can&apos;t undo this action.</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button colorPalette="red" loading={isPending} onClick={onConfirm}>
                Delete
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
