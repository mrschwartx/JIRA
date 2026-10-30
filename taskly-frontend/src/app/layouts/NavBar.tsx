'use client'

import { Box, Button, Flex, Image, Link, Menu, Portal, Spacer } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, useSignOut } from '@/features/auth'
import { getAvatarUrl } from '@/features/users'
import { paths } from '@/shared/config/paths'

export function NavBar() {
  const { user, isReady } = useSession()
  const router = useRouter()
  const { mutate: signOut } = useSignOut()

  return (
    <Box as="nav" bg="red.50">
      <Flex minWidth="max-content" alignItems="center" p="12px" maxW="7xl" m="0 auto">
        <Box p="2">
          <Link asChild fontSize="lg" fontWeight="bold">
            <NextLink href={paths.home}>Taskly</NextLink>
          </Link>
        </Box>
        <Spacer />
        <Box minH="40px" minW="64px" display="flex" alignItems="center" justifyContent="flex-end">
          {!isReady ? null : user ? (
            <Menu.Root
              onSelect={(details) => {
                if (details.value === 'profile') {
                  router.push(paths.profile)
                }
                if (details.value === 'signout') {
                  signOut()
                }
              }}
            >
              <Menu.Trigger asChild>
                <Button variant="plain" p="0" h="auto" minW="0" borderRadius="full" aria-label="Open user menu">
                  <Image boxSize="40px" borderRadius="full" objectFit="cover" src={getAvatarUrl(user.avatar)} alt={user.username} />
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value="profile">Profile</Menu.Item>
                    <Menu.Item value="signout">Sign Out</Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          ) : (
            <Link asChild>
              <NextLink href={paths.signIn}>Sign In</NextLink>
            </Link>
          )}
        </Box>
      </Flex>
    </Box>
  )
}
