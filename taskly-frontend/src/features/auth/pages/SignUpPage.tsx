'use client'

import { Box, Flex, Heading, Link, Text } from '@chakra-ui/react'
import NextLink from 'next/link'
import { paths } from '@/shared/config/paths'
import { SignUpForm } from '../components/SignUpForm'

export function SignUpPage() {
  return (
    <Box p="3" maxW="lg" mx="auto">
      <Heading as="h1" textAlign="center" fontSize="3xl" fontWeight="semibold" my="7">
        Create an Account
      </Heading>
      <SignUpForm />
      <Flex gap="2" mt="5">
        <Text>Have an account?</Text>
        <Link asChild color="blue.400">
          <NextLink href={paths.signIn}>Sign in</NextLink>
        </Link>
      </Flex>
    </Box>
  )
}
