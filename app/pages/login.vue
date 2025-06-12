<script setup lang="ts">
import * as z from 'zod'
import { useAuth } from '~/composables/auth/useAuth'
import type { ILoginCredentials } from '~/types/auth'

definePageMeta({
  layout: 'auth'
})

useHead({
  title: 'Connexion - Tooka'
})

const { login, loading, error, resetError } = useAuth()
const router = useRouter()

const loginSchema = z.object({
  email: z.string()
    .min(1, 'L\'email est requis')
    .email('Veuillez entrer une adresse email valide'),
  password: z.string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
})

const credentials = reactive<ILoginCredentials>({
  email: '',
  password: ''
})

const handleLogin = async () => {
  resetError()

  const { success } = await login(credentials)

  if (success) {
    await router.push('/')
  }
}
</script>

<template>
  <div>
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Bienvenue</h1>
      <p class="text-neutral-500 dark:text-neutral-400">Connectez-vous à votre compte pour continuer</p>
    </div>

    <UCard class="shadow-lg">
      <UForm :schema="loginSchema" :state="credentials" class="space-y-6" @submit="handleLogin">
        <UFormField label="Email" name="email" class="w-full">
          <UInput v-model="credentials.email" type="email" placeholder="you@example.com" autocomplete="email"
            leading-icon="lucide:mail" class="w-full" />
        </UFormField>

        <UFormField label="Password" name="password" class="w-full">
          <UInput v-model="credentials.password" type="password" placeholder="••••••••" autocomplete="current-password"
            leading-icon="lucide:lock" class="w-full" />
        </UFormField>

        <div class="flex justify-between items-center">
          <UCheckbox label="Se souvenir de moi" name="remember" />
          <NuxtLink to="/reset-password" class="text-sm text-primary-600 hover:text-primary-500">
            Mot de passe oublié ?
          </NuxtLink>
        </div>

        <UAlert v-if="error" :description="error.message" color="error" variant="soft" icon="lucide:alert-circle" />

        <UButton type="submit" color="primary" block :loading="loading" :disabled="loading">
          Se connecter
        </UButton>

        <div class="text-center pt-2">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Vous n'avez pas de compte ?
            <NuxtLink to="/register" class="font-medium text-primary-600 hover:text-primary-500">
              Créer un compte
            </NuxtLink>
          </p>
        </div>
      </UForm>
    </UCard>
  </div>
</template>