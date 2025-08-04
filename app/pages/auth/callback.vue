<script setup lang="ts">
definePageMeta({
    layout: 'auth'
})

useHead({
    title: 'Authentification - Tooka'
})

const router = useRouter()
const route = useRoute()
const supabase = useSupabaseClient()
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
    try {
        // Traiter les paramètres d'URL pour l'authentification OAuth
        const { data, error: authError } = await supabase.auth.getSession()

        if (authError) {
            error.value = authError.message
            return
        }

        // Vérifier si nous avons une session après l'authentification OAuth
        if (data.session) {
            // Redirection vers la page d'accueil après connexion réussie
            await router.push('/')
        } else {
            // Si pas de session, essayer de récupérer les paramètres d'URL
            const { access_token, refresh_token, error: oauthError } = route.query

            if (oauthError) {
                error.value = 'Erreur lors de l\'authentification OAuth'
                return
            }

            if (access_token) {
                // Établir la session avec le token d'accès
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: access_token as string,
                    refresh_token: refresh_token as string
                })

                if (sessionError) {
                    error.value = sessionError.message
                    return
                }

                await router.push('/')
            } else {
                // Redirection vers la page de connexion si pas de session
                await router.push('/login')
            }
        }
    } catch {
        error.value = 'Une erreur est survenue lors de l\'authentification'
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
            <div v-if="loading" class="space-y-4">
                <UIcon name="lucide:loader-2" class="h-8 w-8 mx-auto animate-spin text-primary-500" />
                <p class="text-neutral-600 dark:text-neutral-400">Authentification en cours...</p>
            </div>

            <div v-else-if="error" class="space-y-4">
                <UIcon name="lucide:alert-circle" class="h-8 w-8 mx-auto text-red-500" />
                <p class="text-red-600">{{ error }}</p>
                <UButton to="/login" color="primary" variant="outline">
                    Retour à la connexion
                </UButton>
            </div>
        </div>
    </div>
</template>