'use client'

import { Box, Button, Flex, Link, Menu, Portal, Spacer } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, useSignOut } from '@/features/auth'
import { UserAvatar } from '@/features/users'
import { paths } from '@/shared/config/paths'

export function NavBar() {
  const { user, isReady } = useSession()
  const router = useRouter()
  const { mutate: signOut } = useSignOut()

  return (
    <Box as="nav" bg="#0747a6" color="white">
      <Flex alignItems="center" gap="6" px="4" h="48px">
        <Link asChild fontSize="lg" fontWeight="bold" color="white" _hover={{ textDecoration: 'none' }}>
          <NextLink href={user ? paths.projects : paths.home}>Jira</NextLink>
        </Link>
        {user ? (
          <Link asChild color="whiteAlpha.900" _hover={{ color: 'white' }}>
            <NextLink href={paths.projects}>Projects</NextLink>
          </Link>
        ) : null}
        <Spacer />
        <Box minH="32px" minW="64px" display="flex" alignItems="center" justifyContent="flex-end" gap="3">
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
                  <UserAvatar username={user.username} avatar={user.avatar} size={32} />
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value="profile">Profile</Menu.Item>
                    <Menu.Item value="signout">Sign out</Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          ) : (
            <>
              <Link asChild color="white">
                <NextLink href={paths.signIn}>Sign in</NextLink>
              </Link>
              <Button asChild size="sm" bg="white" color="#0747a6" _hover={{ bg: 'gray.100' }}>
                <NextLink href={paths.signUp}>Create account</NextLink>
              </Button>
            </>
          )}
        </Box>
      </Flex>
    </Box>
  )
}
