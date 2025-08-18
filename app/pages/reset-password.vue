<script setup lang="ts">
import * as z from 'zod'
import { useAuth } from '~/composables/auth/useAuth'

definePageMeta({
    layout: 'auth'
})

useHead({
    title: 'Réinitialiser le mot de passe - Tooka'
})

const { updatePassword, loading, error, resetError } = useAuth()

const resetPasswordSchema = z.object({
    password: z.string()
        .min(1, 'Le mot de passe est requis')
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z.string()
        .min(1, 'La confirmation du mot de passe est requise')
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"]
})

const formData = reactive({
    password: '',
    confirmPassword: ''
})

const passwordUpdated = ref(false)

const handleUpdatePassword = async () => {
    resetError()

    const { success } = await updatePassword(formData.password)

    if (success) {
        passwordUpdated.value = true
    }
}
</script>

<template>
    <div class="max-w-md mx-auto">
        <div class="mb-6 text-center">
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Réinitialiser le mot de passe</h1>
            <p class="text-neutral-500 dark:text-neutral-400">Choisissez un nouveau mot de passe pour votre compte</p>
        </div>

        <UCard class="shadow-lg">
            <div v-if="passwordUpdated" class="py-8 px-4 flex flex-col items-center">
                <UIcon name="lucide:check-circle" class="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h2 class="text-xl font-semibold text-center mb-2">Mot de passe mis à jour</h2>
                <p class="text-neutral-500 dark:text-neutral-400 text-center mb-4">
                    Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter avec votre
                    nouveau mot de passe.
                </p>
                <UButton to="/login" color="primary" block>
                    Se connecter
                </UButton>
            </div>

            <UForm v-else :schema="resetPasswordSchema" :state="formData" class="space-y-6"
                @submit="handleUpdatePassword">
                <UFormField label="Nouveau mot de passe" name="password" class="w-full">
                    <UInput v-model="formData.password" type="password" placeholder="••••••••"
                        autocomplete="new-password" leading-icon="lucide:lock" class="w-full" />
                    <template #hint>
                        <span class="text-xs text-neutral-500">Le mot de passe doit contenir au moins 6
                            caractères</span>
                    </template>
                </UFormField>

                <UFormField label="Confirmer le mot de passe" name="confirmPassword" class="w-full">
                    <UInput v-model="formData.confirmPassword" type="password" placeholder="••••••••"
                        autocomplete="new-password" leading-icon="lucide:lock" class="w-full" />
                </UFormField>

                <UAlert v-if="error" :description="error.message" color="error" variant="soft"
                    icon="lucide:alert-circle" />

                <UButton type="submit" color="primary" block :loading="loading" :disabled="loading">
                    Mettre à jour le mot de passe
                </UButton>

                <div class="text-center pt-2">
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        Vous vous souvenez de votre mot de passe ?
                        <NuxtLink to="/login" class="font-medium text-primary hover:text-primary">
                            Se connecter
                        </NuxtLink>
                    </p>
                </div>
            </UForm>
        </UCard>
    </div>
</template>