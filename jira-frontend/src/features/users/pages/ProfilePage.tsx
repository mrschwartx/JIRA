'use client'

import { Box, Button, Flex, Heading, Link, Stack, useDisclosure } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useSession, useSignOut } from '@/features/auth'
import { DeleteConfirmation } from '@/shared/components'
import { paths } from '@/shared/config/paths'
import { ProfileForm } from '../components/ProfileForm'
import { useDeleteAccount } from '../hooks/useDeleteAccount'

export function ProfilePage() {
  const { user } = useSession()
  const { open, onOpen, onClose } = useDisclosure()
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount()
  const { mutate: signOut } = useSignOut()

  if (!user) {
    return null
  }

  return (
    <Box p="3" maxW="lg" mx="auto">
      <DeleteConfirmation
        alertTitle="Delete your account"
        isOpen={open}
        isPending={isDeleting}
        onClose={onClose}
        onConfirm={() => deleteAccount(user.id)}
      />
      <Heading as="h1" fontSize="3xl" fontWeight="semibold" textAlign="center" my="7">
        Your profile
      </Heading>
      <ProfileForm user={user} />
      <Stack gap="4" mt="5">
        <Link
          asChild
          p="2"
          bg="blue.600"
          rounded="md"
          textAlign="center"
          color="white"
          fontWeight="semibold"
          _hover={{ bg: 'blue.700', textDecoration: 'none' }}
        >
          <NextLink href={paths.projects}>Go to your projects</NextLink>
        </Link>
        <Flex justify="space-between">
          <Button variant="plain" color="red.600" p="0" h="auto" minW="0" fontWeight="normal" onClick={onOpen}>
            Delete account
          </Button>
          <Button variant="plain" color="red.600" p="0" h="auto" minW="0" fontWeight="normal" onClick={() => signOut()}>
            Sign out
          </Button>
        </Flex>
      </Stack>
    </Box>
  )
}
