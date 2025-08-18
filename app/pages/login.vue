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

const { login, signInWithGoogle, loading, error, resetError } = useAuth()
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

const handleGoogleLogin = async () => {
  resetError()
  await signInWithGoogle()
}
</script>

<template>
  <div class="max-w-md mx-auto">
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
          <NuxtLink to="/forgot-password" class="text-sm text-primary hover:text-primary">
            Mot de passe oublié ?
          </NuxtLink>
        </div>

        <UAlert v-if="error" :description="error.message" color="error" variant="soft" icon="lucide:alert-circle" />

        <UButton type="submit" color="primary" block :loading="loading" :disabled="loading">
          Se connecter
        </UButton>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t border-neutral-300 dark:border-neutral-600" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-white dark:bg-neutral-900 px-2 text-neutral-500">Ou continuer avec</span>
          </div>
        </div>

        <UButton type="button" color="neutral" variant="outline" block :loading="loading" :disabled="loading"
          @click="handleGoogleLogin">
          <UIcon name="lucide:chrome" class="w-4 h-4 mr-2" />
          Continuer avec Google
        </UButton>

        <div class="text-center pt-2">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Vous n'avez pas de compte ?
            <NuxtLink to="/register" class="font-medium text-primary hover:text-primary">
              Créer un compte
            </NuxtLink>
          </p>
        </div>
      </UForm>
    </UCard>
  </div>
</template>