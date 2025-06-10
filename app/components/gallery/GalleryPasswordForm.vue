<template>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
        <UCard class="w-full max-w-lg">
            <UForm ref="form" :schema="clientPasswordSchema" :state="formData" class="space-y-6" @submit="handleSubmit">
                <!-- Header Section -->
                <div class="text-center space-y-4">
                    <div class="flex items-center gap-3 justify-center mb-6">
                        <div
                            class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                            <UIcon name="i-heroicons-key" class="w-6 h-6 text-white" />
                        </div>
                        <div class="text-left">
                            <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                Accès sécurisé
                            </h1>
                            <p class="text-sm font-medium text-primary-600 dark:text-primary-400">
                                {{ project?.title }}
                            </p>
                        </div>
                    </div>

                    <UAlert v-if="hasStoredSession" color="success" variant="soft" icon="i-heroicons-clock"
                        title="Session précédente trouvée">
                        <template #description>
                            Une session précédente a été trouvée pour cette galerie.
                            Entrez votre code d'accès pour continuer automatiquement.
                        </template>
                    </UAlert>

                    <UAlert v-else color="info" variant="soft" icon="i-heroicons-information-circle"
                        title="Galerie protégée">
                        <template #description>
                            Cette galerie est protégée par un code d'accès de 6 caractères.
                            Saisissez le code qui vous a été fourni pour consulter vos photos.
                        </template>
                    </UAlert>
                </div>

                <USeparator />

                <!-- Password Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-lock-closed" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Code d'accès</h2>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Entrez votre code de 6 caractères
                                pour
                                continuer
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
                        :close-button="{ icon: 'i-heroicons-x-mark', color: 'gray', variant: 'link' }"
                        @close="error = null">
                        <template #icon>
                            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
                        </template>
                        <template #title>
                            Accès refusé
                        </template>
                        <template #description>
                            {{ error }}
                        </template>
                    </UAlert>
                </div>

                <!-- Action Button -->
                <div class="space-y-4">
                    <UButton type="submit" :loading="loading" :disabled="formData.password.length !== 6" color="primary"
                        size="lg" icon="i-heroicons-arrow-right-circle" class="w-full justify-center">
                        <span v-if="!loading">Accéder à ma galerie</span>
                        <span v-else>Vérification en cours...</span>
                    </UButton>

                    <div class="text-center">
                        <div
                            class="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2">
                            <UIcon name="i-heroicons-question-mark-circle" class="w-4 h-4" />
                            <span>Code d'accès oublié ? Contactez votre photographe</span>
                        </div>
                    </div>
                </div>
            </UForm>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import { clientPasswordSchema, type ClientPasswordFormData } from "~/types/gallery";

interface Props {
    project?: {
        id: string;
        title: string;
        description: string | null;
    } | null;
    error?: string | null;
    galleryId?: string;
}

interface Emits {
    authenticated: [password: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Check for stored session if galleryId is provided
const hasStoredSession = computed(() => {
    if (!props.galleryId || !import.meta.client) return false;
    try {
        const stored = localStorage.getItem(`gallery_auth_${props.galleryId}`);
        return !!stored;
    } catch {
        return false;
    }
});

// Form state
const form = ref();
const loading = ref(false);
const error = ref<string | null>(props.error || null);
const formData = reactive<ClientPasswordFormData & { passwordArray: string[] }>({
    password: "",
    passwordArray: [],
});

// Watch for error prop changes
watchEffect(() => {
    error.value = props.error || null;
});

// Handle PinInput completion
const handlePinComplete = (value: string[]) => {
    formData.password = value.join('');
    // Auto-submit when PIN is complete
    handleSubmit();
};

// Watch passwordArray changes to update password
watch(() => formData.passwordArray, (newValue) => {
    formData.password = newValue.join('');
}, { deep: true });

// Handle form submission
const handleSubmit = async () => {
    // Ensure we have a complete password
    if (formData.password.length !== 6) {
        return;
    }

    loading.value = true;
    error.value = null;

    try {
        emit("authenticated", formData.password);
    } finally {
        loading.value = false;
    }
};
</script>