'use client'

import { Box, Flex, Heading, Link, Text } from '@chakra-ui/react'
import NextLink from 'next/link'
import { paths } from '@/shared/config/paths'
import { SignInForm } from '../components/SignInForm'

export function SignInPage() {
  return (
    <Box p="3" maxW="lg" mx="auto">
      <Heading as="h1" textAlign="center" fontSize="3xl" fontWeight="semibold" my="7">
        Enter Your Credentials
      </Heading>
      <SignInForm />
      <Flex gap="2" mt="5">
        <Text>Don&apos;t have an account?</Text>
        <Link asChild color="blue.400">
          <NextLink href={paths.signUp}>Sign up</NextLink>
        </Link>
      </Flex>
    </Box>
  )
}
