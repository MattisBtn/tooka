<script setup lang="ts">
import * as z from 'zod'
import { useAuth } from '~/composables/auth/useAuth'
import type { IRegistrationData } from '~/types/auth'
definePageMeta({
    layout: 'auth'
})

useHead({
    title: 'Créer un compte - Tooka'
})

const { register, signInWithGoogle, loading, error, resetError } = useAuth()
const router = useRouter()

const registrationSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    email: z.string()
        .min(1, 'L\'email est requis')
        .email('Veuillez entrer une adresse email valide'),
    password: z.string()
        .min(1, 'Le mot de passe est requis')
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
})

const formData = reactive<IRegistrationData>({
    email: '',
    password: '',
    name: ''
})

const emailConfirmationRequired = ref(false)

const handleRegister = async () => {
    resetError()

    const { success, needsEmailConfirmation } = await register(formData)

    if (success) {
        if (needsEmailConfirmation) {
            emailConfirmationRequired.value = true
        } else {
            await router.push('/')
        }
    }
}

const handleGoogleLogin = async () => {
    resetError()
    await signInWithGoogle()
}
</script>

<template>
    <div>
        <div class="mb-6 text-center">
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Créer votre compte</h1>
            <p class="text-neutral-500 dark:text-neutral-400">Commencez votre voyage avec Tooka</p>
        </div>

        <UCard class="shadow-lg">
            <div v-if="emailConfirmationRequired" class="py-8 px-4">
                <UIcon name="lucide:mail-check" class="h-12 w-12 mx-auto text-primary-500 mb-4" />
                <h2 class="text-xl font-semibold text-center mb-2">Vérifiez votre email</h2>
                <p class="text-neutral-500 dark:text-neutral-400 text-center mb-4">
                    Nous avons envoyé un lien de confirmation à <span class="font-medium">{{ formData.email }}</span>.
                    Veuillez vérifier votre boîte de réception et cliquer sur le lien pour activer votre compte.
                </p>
                <UButton to="/login" color="primary" variant="outline" block>
                    Retour à la connexion
                </UButton>
            </div>

            <UForm v-else :schema="registrationSchema" :state="formData" class="space-y-6" @submit="handleRegister">
                <UFormField label="Nom complet" name="name" class="w-full">
                    <UInput v-model="formData.name" placeholder="John Doe" autocomplete="name"
                        leading-icon="lucide:user" class="w-full" />
                </UFormField>

                <UFormField label="Email" name="email" class="w-full">
                    <UInput v-model="formData.email" type="email" placeholder="you@example.com" autocomplete="email"
                        leading-icon="lucide:mail" class="w-full" />
                </UFormField>

                <UFormField label="Password" name="password" class="w-full">
                    <UInput v-model="formData.password" type="password" placeholder="••••••••"
                        autocomplete="new-password" leading-icon="lucide:lock" class="w-full" />
                    <template #hint>
                        <span class="text-xs text-neutral-500">Le mot de passe doit contenir au moins 6
                            caractères</span>
                    </template>
                </UFormField>

                <UAlert v-if="error" :description="error.message" color="error" variant="soft"
                    icon="lucide:alert-circle" />

                <div class="mt-2">
                    <UCheckbox label="J'accepte les Conditions d'utilisation et la Politique de confidentialité"
                        name="terms" required />
                </div>

                <UButton type="submit" color="primary" block :loading="loading" :disabled="loading">
                    Créer un compte
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
                        Vous avez déjà un compte ?
                        <NuxtLink to="/login" class="font-medium text-primary-600 hover:text-primary-500">
                            Se connecter
                        </NuxtLink>
                    </p>
                </div>
            </UForm>
        </UCard>
    </div>
</template>