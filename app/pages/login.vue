<script setup lang="ts">
import * as z from 'zod'
import type { ILoginCredentials } from '~/types/auth'

definePageMeta({
  layout: 'auth'
})

useHead({
  title: 'Login - Flow'
})

const { login, loading, error, resetError } = useAuth()
const router = useRouter()

const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
})

const credentials = reactive<ILoginCredentials>({
  email: '',
  password: ''
})

const handleLogin = async () => {
  resetError()

  const { success } = await login(credentials)

  if (success) {
    await router.push('/dashboard')
  }
}
</script>

<template>
  <div>
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
      <p class="text-gray-500 dark:text-gray-400">Sign in to your account to continue</p>
    </div>

    <UCard class="shadow-lg">
      <UForm :schema="loginSchema" :state="credentials" class="space-y-6" @submit="handleLogin">
        <UFormField label="Email" name="email" class="w-full">
          <UInput v-model="credentials.email" type="email" placeholder="you@example.com" autocomplete="email"
            trailing-icon="lucide:mail" class="w-full" />
        </UFormField>

        <UFormField label="Password" name="password" class="w-full">
          <UInput v-model="credentials.password" type="password" placeholder="••••••••" autocomplete="current-password"
            trailing-icon="lucide:lock" class="w-full" />
        </UFormField>

        <div class="flex justify-between items-center">
          <UCheckbox label="Remember me" name="remember" />
          <NuxtLink to="/reset-password" class="text-sm text-primary-600 hover:text-primary-500">
            Forgot password?
          </NuxtLink>
        </div>

        <UAlert v-if="error" :description="error.message" color="error" variant="soft" icon="lucide:alert-circle" />

        <UButton type="submit" color="primary" block :loading="loading" :disabled="loading">
          Sign in
        </UButton>

        <div class="text-center pt-2">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
            <NuxtLink to="/register" class="font-medium text-primary-600 hover:text-primary-500">
              Sign up
            </NuxtLink>
          </p>
        </div>
      </UForm>
    </UCard>
  </div>
</template>