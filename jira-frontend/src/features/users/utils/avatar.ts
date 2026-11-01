import { env } from '@/shared/config/env'

export const DEFAULT_AVATAR_URL = '/images/users/default-avatar.svg'

export const getAvatarUrl = (avatar?: string | null) => (avatar ? `${env.serverBaseUrl}${avatar}` : DEFAULT_AVATAR_URL)
