<script setup lang="ts">
import * as z from 'zod'
import { useAuth } from '~/composables/auth/useAuth'
import type { IUpdatePasswordData } from '~/types/auth'

definePageMeta({
    layout: 'auth'
})

useHead({
    title: 'Nouveau mot de passe - Tooka'
})

const { updatePassword, loading, error, resetError } = useAuth()
const router = useRouter()
const route = useRoute()

const updatePasswordSchema = z.object({
    password: z.string()
        .min(1, 'Le mot de passe est requis')
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z.string()
        .min(1, 'La confirmation du mot de passe est requise')
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
})

const formData = reactive<IUpdatePasswordData>({
    password: '',
    confirmPassword: ''
})

const passwordUpdated = ref(false)
const isValidToken = ref(false)
const isLoading = ref(true)

// Vérifier le token de récupération au chargement de la page
onMounted(async () => {
    const supabase = useSupabaseClient()

    // Récupérer les paramètres de l'URL
    const { access_token, type } = route.query

    if (access_token && type === 'recovery') {
        try {
            // Échanger le token de récupération contre une session
            const { error } = await supabase.auth.verifyOtp({
                token_hash: access_token as string,
                type: 'recovery'
            })

            if (error) {
                console.error('Erreur de vérification du token:', error)
                await router.push('/reset-password')
                return
            }

            isValidToken.value = true
        } catch (err) {
            console.error('Erreur lors de la vérification:', err)
            await router.push('/reset-password')
            return
        }
    } else {
        // Pas de token valide, rediriger vers la page de demande
        await router.push('/reset-password')
        return
    }

    isLoading.value = false
})

const handleUpdatePassword = async () => {
    resetError()

    const { success } = await updatePassword(formData)

    if (success) {
        passwordUpdated.value = true
    }
}
</script>

<template>
    <div>
        <div class="mb-6 text-center">
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Nouveau mot de passe</h1>
            <p class="text-neutral-500 dark:text-neutral-400">Choisissez votre nouveau mot de passe</p>
        </div>

        <UCard class="shadow-lg">
            <!-- État de chargement -->
            <div v-if="isLoading" class="py-8 px-4 text-center">
                <UIcon name="lucide:loader-2" class="h-8 w-8 mx-auto text-primary-500 mb-4 animate-spin" />
                <p class="text-neutral-500 dark:text-neutral-400">Vérification du lien...</p>
            </div>

            <!-- Succès -->
            <div v-else-if="passwordUpdated" class="py-8 px-4">
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

            <!-- Formulaire -->
            <UForm v-else-if="isValidToken" :schema="updatePasswordSchema" :state="formData" class="space-y-6"
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
                        <NuxtLink to="/login" class="font-medium text-primary-600 hover:text-primary-500">
                            Retour à la connexion
                        </NuxtLink>
                    </p>
                </div>
            </UForm>

            <!-- Token invalide -->
            <div v-else class="py-8 px-4 text-center">
                <UIcon name="lucide:alert-circle" class="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h2 class="text-xl font-semibold text-center mb-2">Lien invalide</h2>
                <p class="text-neutral-500 dark:text-neutral-400 text-center mb-4">
                    Ce lien de réinitialisation n'est plus valide ou a expiré.
                </p>
                <UButton to="/reset-password" color="primary" block>
                    Demander un nouveau lien
                </UButton>
            </div>
        </UCard>
    </div>
</template>