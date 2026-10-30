import { Button, Field, Input, Stack } from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { useSignUp } from '../hooks/useSignUp'
import type { SignUpValues } from '../types'

export function SignUpForm() {
  const { mutate, isPending } = useSignUp()
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<SignUpValues>({ defaultValues: { username: '', email: '', password: '' } })

  return (
    <form onSubmit={handleSubmit((values) => mutate(values))}>
      <Stack gap="4">
        <Field.Root invalid={Boolean(errors.username)}>
          <Input
            id="username"
            type="text"
            aria-label="Username"
            placeholder="Your username"
            {...register('username', { required: 'Username is required' })}
          />
          <Field.ErrorText>{errors.username?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root invalid={Boolean(errors.email)}>
          <Input
            id="email"
            type="email"
            aria-label="Email"
            placeholder="Your email"
            {...register('email', { required: 'Email is required' })}
          />
          <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root invalid={Boolean(errors.password)}>
          <Input
            id="password"
            type="password"
            aria-label="Password"
            placeholder="Your password"
            {...register('password', { required: 'Password is required' })}
          />
          <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
        </Field.Root>
        <Button type="submit" loading={isPending} colorPalette="teal" textTransform="uppercase">
          Sign Up
        </Button>
      </Stack>
    </form>
  )
}
