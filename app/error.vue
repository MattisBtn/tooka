<template>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
        <!-- Header -->
        <header
            class="h-16 border-b border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 flex-shrink-0">
            <div class="h-full flex items-center justify-between px-6">
                <div class="flex items-center gap-4 min-w-0">
                    <ClientOnly>
                        <NuxtImg :src="logoSrc" alt="Tooka" class="w-24 h-auto" />
                        <template #fallback>
                            <div class="w-24 h-8 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                        </template>
                    </ClientOnly>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 flex items-center justify-center p-6">
            <div class="w-full max-w-lg">
                <!-- Error Card -->
                <UCard class="text-center shadow-xl border-0">
                    <div class="space-y-8 p-8">
                        <!-- Icon -->
                        <div
                            class="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                            <UIcon :name="errorIcon" class="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>

                        <!-- Content -->
                        <div class="space-y-4">
                            <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                {{ errorTitle }}
                            </h1>
                            <p class="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {{ errorDescription }}
                            </p>
                            <p class="text-sm text-neutral-500 dark:text-neutral-500">
                                {{ errorHelpText }}
                            </p>
                        </div>

                        <!-- Actions -->
                        <div class="space-y-3">
                            <UButton variant="outline" icon="i-heroicons-home" :to="homeUrl" class="w-full">
                                {{ homeButtonText }}
                            </UButton>

                            <UButton variant="solid" color="primary" icon="i-heroicons-envelope" class="w-full"
                                @click="contactSupport">
                                Contacter le support
                            </UButton>
                        </div>

                        <!-- Error details (only in development) -->
                        <div v-if="isDev && error" class="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <details class="text-left">
                                <summary class="text-xs text-neutral-500 dark:text-neutral-500 cursor-pointer">
                                    Détails techniques (développement)
                                </summary>
                                <div
                                    class="mt-2 p-3 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-mono text-neutral-700 dark:text-neutral-300">
                                    <div><strong>Status:</strong> {{ error.statusCode }}</div>
                                    <div><strong>Message:</strong> {{ error.message }}</div>
                                    <div v-if="error.url"><strong>URL:</strong> {{ error.url }}</div>
                                </div>
                            </details>
                        </div>

                        <!-- Contact info -->
                        <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <p class="text-xs text-neutral-500 dark:text-neutral-500">
                                Besoin d'aide ? Contactez-nous à contact@tooka.io
                            </p>
                        </div>
                    </div>
                </UCard>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/auth/useAuth';
import { useLogo } from '~/composables/shared/useLogo';

interface Props {
    error: {
        statusCode: number;
        message: string;
        url?: string;
    };
}

const props = defineProps<Props>();

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

// Get logo
const { logoSrc } = useLogo();

// Check authentication status
const { user } = useAuth();

// Computed properties for error display
const errorIcon = computed(() => {
    const status = props.error.statusCode;
    if (status === 404) return 'i-heroicons-magnifying-glass';
    if (status >= 500) return 'i-heroicons-exclamation-triangle';
    if (status >= 400) return 'i-heroicons-exclamation-circle';
    return 'i-heroicons-exclamation-triangle';
});

const errorTitle = computed(() => {
    const status = props.error.statusCode;
    if (status === 404) return 'Oups ! Page introuvable';
    if (status === 403) return 'Accès refusé';
    if (status === 401) return 'Authentification requise';
    if (status >= 500) return 'Erreur technique';
    if (status >= 400) return 'Erreur de requête';
    return 'Erreur inattendue';
});

const errorDescription = computed(() => {
    const status = props.error.statusCode;
    if (status === 404) {
        return "La page que vous recherchez semble avoir disparu dans le cyberespace. Pas de panique, nous sommes là pour vous aider !";
    }
    if (status === 403) {
        return "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource. Contactez-nous si vous pensez qu'il s'agit d'une erreur.";
    }
    if (status === 401) {
        return "Vous devez être connecté pour accéder à cette page. Connectez-vous et réessayez !";
    }
    if (status >= 500) {
        return "Nos serveurs rencontrent quelques difficultés techniques. Nos équipes travaillent activement à résoudre le problème.";
    }
    if (status >= 400) {
        return "Il y a eu un petit problème avec votre demande. Vérifiez les informations et réessayez.";
    }
    return "Une erreur inattendue s'est produite. Ne vous inquiétez pas, nous sommes là pour vous aider !";
});

const errorHelpText = computed(() => {
    const status = props.error.statusCode;
    if (status === 404) {
        return "Vérifiez l'URL ou utilisez la navigation pour retrouver votre chemin. Notre équipe est là pour vous accompagner !";
    }
    if (status >= 500) {
        return "Veuillez réessayer dans quelques minutes. Si le problème persiste, notre équipe technique est là pour vous aider.";
    }
    return "Veuillez réessayer ou contactez-nous si le problème persiste. Nous sommes là pour vous !";
});

// Home URL based on authentication
const homeUrl = computed(() => {
    return user.value ? '/' : 'https://tooka.io';
});

const homeButtonText = computed(() => {
    return user.value ? 'Retour au dashboard' : 'Retour à Tooka';
});

// Contact support function
const contactSupport = () => {
    window.location.href = 'mailto:contact@tooka.io?subject=Erreur ' + props.error.statusCode + ' - ' + encodeURIComponent(props.error.message);
};
</script>
