import { Center, Image, Portal, Tooltip } from '@chakra-ui/react'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

type AvatarUploaderProps = {
  imageUrl: string
  onFileSelect: (file: File) => void
}

export function AvatarUploader({ imageUrl, onFileSelect }: AvatarUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const [file] = acceptedFiles
      if (file) {
        onFileSelect(file)
      }
    },
    [onFileSelect],
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/jpeg': [],
      'image/png': [],
    },
  })

  return (
    <Center {...getRootProps()}>
      <input {...getInputProps()} id="avatar" aria-label="Avatar" />
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Image alt="profile" rounded="full" h="24" w="24" objectFit="cover" cursor="pointer" mt="2" src={imageUrl} />
        </Tooltip.Trigger>
        <Portal>
          <Tooltip.Positioner>
            <Tooltip.Content>Change your avatar</Tooltip.Content>
          </Tooltip.Positioner>
        </Portal>
      </Tooltip.Root>
    </Center>
  )
}
