'use client'

import { Box, Button, Flex, Heading, Link, Stack, Text, useDisclosure } from '@chakra-ui/react'
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
        alertTitle="Delete Account"
        isOpen={open}
        isPending={isDeleting}
        onClose={onClose}
        onConfirm={() => deleteAccount(user._id)}
      />
      <Heading as="h1" fontSize="3xl" fontWeight="semibold" textAlign="center" my="7">
        Your Profile
      </Heading>
      <ProfileForm user={user} />
      <Stack gap="4" mt="5">
        <Link
          asChild
          p="2"
          bg="green.500"
          rounded="lg"
          textTransform="uppercase"
          textAlign="center"
          color="white"
          fontWeight="semibold"
          _hover={{ bg: 'green.600', textDecoration: 'none' }}
        >
          <NextLink href={paths.createTask}>Create New Task</NextLink>
        </Link>
        <Flex justify="space-between">
          <Button variant="plain" color="red.600" p="0" h="auto" minW="0" fontWeight="normal" onClick={onOpen}>
            Delete Account
          </Button>
          <Button variant="plain" color="red.600" p="0" h="auto" minW="0" fontWeight="normal" onClick={() => signOut()}>
            Sign Out
          </Button>
        </Flex>
        <Text textAlign="center">
          <Link asChild color="teal" _hover={{ textDecoration: 'none' }}>
            <NextLink href={paths.tasks}>Show Tasks</NextLink>
          </Link>
        </Text>
      </Stack>
    </Box>
  )
}
