import { Button, Field, Input, Stack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { User } from '@/features/auth'
import { useUpdateProfile } from '../hooks/useUpdateProfile'
import type { ProfileFormValues } from '../types'
import { getAvatarUrl } from '../utils/avatar'
import { AvatarUploader } from './AvatarUploader'

type ProfileFormProps = {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { mutate, isPending } = useUpdateProfile()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      username: user.username,
      email: user.email,
      password: '',
    },
  })

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileSelect = (file: File) => {
    setAvatarFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const onSubmit = (values: ProfileFormValues) => {
    mutate(
      { userId: user._id, values, avatarFile },
      {
        onSuccess: () => {
          reset({ username: values.username, email: values.email, password: '' })
          setAvatarFile(null)
          setPreviewUrl(null)
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="4">
        <AvatarUploader imageUrl={previewUrl ?? getAvatarUrl(user.avatar)} onFileSelect={handleFileSelect} />
        <Field.Root invalid={Boolean(errors.username)}>
          <Input
            id="username"
            type="text"
            aria-label="Username"
            placeholder="username"
            {...register('username', { required: 'Username is required' })}
          />
          <Field.ErrorText>{errors.username?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root invalid={Boolean(errors.email)}>
          <Input
            id="email"
            type="email"
            aria-label="Email"
            placeholder="email"
            {...register('email', { required: 'Email is required' })}
          />
          <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root>
          <Input id="password" type="password" aria-label="New password" placeholder="New password" {...register('password')} />
        </Field.Root>
        <Button type="submit" loading={isPending} colorPalette="teal" textTransform="uppercase">
          Update Profile
        </Button>
      </Stack>
    </form>
  )
}
