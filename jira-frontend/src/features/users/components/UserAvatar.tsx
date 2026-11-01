import { Image } from '@chakra-ui/react'
import { getAvatarUrl } from '../utils/avatar'

type UserAvatarProps = {
  username: string
  avatar?: string | null
  size?: number
  title?: string
}

export function UserAvatar({ username, avatar, size = 24, title }: UserAvatarProps) {
  return (
    <Image
      src={getAvatarUrl(avatar)}
      alt={username}
      title={title ?? username}
      boxSize={`${size}px`}
      minW={`${size}px`}
      borderRadius="full"
      objectFit="cover"
      bg="gray.200"
    />
  )
}
