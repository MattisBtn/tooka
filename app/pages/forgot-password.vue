<script setup lang="ts">
import * as z from 'zod'
import { useAuth } from '~/composables/auth/useAuth'

definePageMeta({
    layout: 'auth'
})

useHead({
    title: 'Mot de passe oublié - Tooka'
})

const { resetPasswordForEmail, loading, error, resetError } = useAuth()

const forgotPasswordSchema = z.object({
    email: z.string()
        .min(1, 'L\'email est requis')
        .email('Veuillez entrer une adresse email valide')
})

const formData = reactive({
    email: ''
})

const emailSent = ref(false)

const handleResetPassword = async () => {
    resetError()

    const { success } = await resetPasswordForEmail(formData.email)

    if (success) {
        emailSent.value = true
    }
}
</script>

<template>
    <div class="max-w-md mx-auto">
        <div class="mb-6 text-center">
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Mot de passe oublié</h1>
            <p class="text-neutral-500 dark:text-neutral-400">Entrez votre email pour recevoir un lien de
                réinitialisation</p>
        </div>

        <UCard class="shadow-lg">
            <div v-if="emailSent" class="py-8 px-4 flex flex-col items-center">
                <UIcon name="lucide:mail-check" class="h-12 w-12 mx-auto text-primary-500 mb-4" />
                <h2 class="text-xl font-semibold text-center mb-2">Email envoyé</h2>
                <p class="text-neutral-500 dark:text-neutral-400 text-center mb-4">
                    Nous avons envoyé un lien de réinitialisation à <span class="font-medium">{{ formData.email
                    }}</span>.
                    Veuillez vérifier votre boîte de réception et cliquer sur le lien pour réinitialiser votre mot de
                    passe.
                </p>
                <UButton to="/login" color="primary" variant="outline" block>
                    Retour à la connexion
                </UButton>
            </div>

            <UForm v-else :schema="forgotPasswordSchema" :state="formData" class="space-y-6"
                @submit="handleResetPassword">
                <UFormField label="Email" name="email" class="w-full">
                    <UInput v-model="formData.email" type="email" placeholder="you@example.com" autocomplete="email"
                        leading-icon="lucide:mail" class="w-full" />
                </UFormField>

                <UAlert v-if="error" :description="error.message" color="error" variant="soft"
                    icon="lucide:alert-circle" />

                <UButton type="submit" color="primary" block :loading="loading" :disabled="loading">
                    Envoyer le lien de réinitialisation
                </UButton>

                <div class="text-center pt-2">
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        Vous vous souvenez de votre mot de passe ?
                        <NuxtLink to="/login" class="font-medium text-primary-600 hover:text-primary-500">
                            Se connecter
                        </NuxtLink>
                    </p>
                </div>
            </UForm>
        </UCard>
    </div>
</template>