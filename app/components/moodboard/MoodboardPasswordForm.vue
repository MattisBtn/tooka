<template>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
        <UCard class="w-full max-w-lg">
            <UForm ref="form" :schema="passwordSchema" :state="formData" class="space-y-6" @submit="handleSubmit">
                <!-- Header Section -->
                <div class="text-center space-y-4">
                    <div class="flex items-center gap-3 justify-center mb-6">
                        <div class="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center">
                            <UIcon name="i-lucide-lightbulb" class="w-6 h-6 text-white" />
                        </div>
                        <div class="text-left">
                            <h1 class="text-2xl font-bold">Accès sécurisé</h1>
                            <p class="text-sm font-medium text-pink-600 dark:text-pink-400">
                                {{ project?.title }}
                            </p>
                        </div>
                    </div>

                    <UAlert v-if="hasStoredSession" color="success" variant="soft" icon="i-lucide-clock"
                        title="Session précédente trouvée">
                        <template #description>
                            Une session précédente a été trouvée pour ce moodboard.
                            Entrez votre code d'accès pour continuer automatiquement.
                        </template>
                    </UAlert>

                    <UAlert v-else color="info" variant="soft" icon="i-lucide-info" title="Moodboard protégé">
                        <template #description>
                            Ce moodboard est protégé par un code d'accès de 6 caractères.
                            Saisissez le code qui vous a été fourni pour consulter le moodboard d'inspiration.
                        </template>
                    </UAlert>
                </div>

                <USeparator />

                <!-- Password Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                            <UIcon name="i-lucide-lock" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 class="text-lg font-semibold">Code d'accès</h2>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Entrez votre code de 6 caractères
                            </p>
                        </div>
                    </div>

                    <UFormField name="password" required :ui="{ error: 'text-center mt-2' }">
                        <div class="flex justify-center">
                            <UPinInput v-model="formData.passwordArray" :length="6" mask placeholder="○"
                                :disabled="loading" autofocus size="lg" color="primary" @complete="handlePinComplete" />
                        </div>
                    </UFormField>

                    <UAlert v-if="error" color="error" variant="soft"
                        :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'link' }" @close="error = null">
                        <template #icon>
                            <UIcon name="i-lucide-alert-triangle" class="w-4 h-4" />
                        </template>
                        <template #title>Accès refusé</template>
                        <template #description>{{ error }}</template>
                    </UAlert>
                </div>

                <!-- Action Button -->
                <div class="space-y-4">
                    <UButton type="submit" :loading="loading" :disabled="formData.password.length !== 6" color="primary"
                        size="lg" icon="i-lucide-arrow-right" class="w-full justify-center">
                        <span v-if="!loading">Accéder au moodboard</span>
                        <span v-else>Vérification en cours...</span>
                    </UButton>

                    <div class="text-center">
                        <div
                            class="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2">
                            <UIcon name="i-lucide-help-circle" class="w-4 h-4" />
                            <span>Code d'accès oublié ? Contactez votre photographe</span>
                        </div>
                    </div>
                </div>
            </UForm>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { ClientMoodboardAccess } from '~/types/moodboard'

interface Props {
    project: ClientMoodboardAccess['project'] | null
    moodboardId: string
    error?: string | null
}

interface Emits {
    authenticated: [password: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Check for stored session
const hasStoredSession = computed(() => {
    if (!props.moodboardId || !import.meta.client) return false;
    try {
        const stored = localStorage.getItem(`moodboard_auth_${props.moodboardId}`);
        return !!stored;
    } catch {
        return false;
    }
});

// Form validation schema
const passwordSchema = z.object({
    password: z.string().min(6, 'Le code d\'accès doit contenir 6 caractères').max(6, 'Le code d\'accès doit contenir 6 caractères'),
    passwordArray: z.array(z.string()).optional(),
})

type PasswordForm = z.infer<typeof passwordSchema>

// Form state
const form = ref()
const loading = ref(false)
const error = ref<string | null>(props.error || null)
const formData = reactive<PasswordForm & { passwordArray: string[] }>({
    password: "",
    passwordArray: [],
})

// Watch for error prop changes
watchEffect(() => {
    error.value = props.error || null;
})

// Handle PinInput completion
const handlePinComplete = (value: string[]) => {
    formData.password = value.join('');
    handleSubmit();
};

// Watch passwordArray changes to update password
watch(() => formData.passwordArray, (newValue) => {
    formData.password = newValue.join('');
}, { deep: true });

// Handle form submission
const handleSubmit = async () => {
    if (formData.password.length !== 6) return;

    loading.value = true
    error.value = null

    try {
        emit('authenticated', formData.password)
        formData.password = ''
        formData.passwordArray = []
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
/* Additional styles if needed */
</style>