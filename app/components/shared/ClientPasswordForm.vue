<template>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
        <UCard class="w-full max-w-lg">
            <UForm ref="form" :schema="passwordSchema" :state="formData" class="space-y-6" @submit="handleSubmit">
                <!-- Header Section -->
                <div class="text-center space-y-4">
                    <div class="flex items-center gap-3 justify-center mb-6">
                        <div :class="[
                            'w-12 h-12 rounded-xl flex items-center justify-center',
                            config.iconBgClass
                        ]">
                            <UIcon :name="config.icon" class="w-6 h-6 text-white" />
                        </div>
                        <div class="text-left">
                            <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                {{ config.title }}
                            </h1>
                            <p :class="[
                                'text-sm font-medium',
                                config.titleColorClass
                            ]">
                                {{ project?.title }}
                            </p>
                        </div>
                    </div>

                    <UAlert v-if="hasStoredSession" color="success" variant="soft" icon="i-heroicons-clock"
                        title="Session précédente trouvée">
                        <template #description>
                            {{ config.storedSessionMessage }}
                        </template>
                    </UAlert>

                    <UAlert v-else color="info" variant="soft" icon="i-heroicons-information-circle"
                        :title="config.protectedMessage.title">
                        <template #description>
                            {{ config.protectedMessage.description }}
                        </template>
                    </UAlert>
                </div>

                <USeparator />

                <!-- Password Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div :class="[
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            config.smallIconBgClass
                        ]">
                            <UIcon :name="config.smallIcon" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                {{ config.passwordLabel }}
                            </h2>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                {{ config.passwordDescription }}
                            </p>
                        </div>
                    </div>

                    <!-- PIN Input for Gallery, Moodboard, Selection -->
                    <UFormField v-if="config.usePinInput" name="password" required :ui="{ error: 'text-center mt-2' }">
                        <div class="flex justify-center">
                            <UPinInput v-model="formData.passwordArray" :length="6" mask placeholder="○"
                                :disabled="loading" autofocus size="lg" color="primary" @complete="handlePinComplete" />
                        </div>
                    </UFormField>

                    <!-- Text Input for Proposal -->
                    <UFormField v-else name="password" required>
                        <UInput v-model="password" type="password" :placeholder="config.inputPlaceholder"
                            icon="i-lucide-key" :loading="loading" :disabled="loading" size="lg" autofocus />
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
                    <UButton type="submit" :loading="loading" :disabled="!isPasswordValid" color="primary" size="lg"
                        icon="i-heroicons-arrow-right-circle" class="w-full justify-center">
                        <span v-if="!loading">{{ config.submitButtonText }}</span>
                        <span v-else>Vérification en cours...</span>
                    </UButton>

                    <div class="text-center">
                        <div
                            class="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2">
                            <UIcon name="i-heroicons-question-mark-circle" class="w-4 h-4" />
                            <span>{{ config.helpText }}</span>
                        </div>
                    </div>
                </div>
            </UForm>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import { z } from 'zod';

interface Project {
    id: string;
    title: string;
    description?: string | null;
}

interface Props {
    project?: Project | null;
    error?: string | null;
    moduleId?: string;
    config: PasswordFormConfig;
}

interface Emits {
    authenticated: [password: string];
}

export interface PasswordFormConfig {
    // Visual identity
    icon: string;
    smallIcon: string;
    iconBgClass: string;
    smallIconBgClass: string;
    titleColorClass: string;

    // Content
    title: string;
    passwordLabel: string;
    passwordDescription: string;
    inputPlaceholder: string;
    submitButtonText: string;
    helpText: string;

    // Messages
    protectedMessage: {
        title: string;
        description: string;
    };
    storedSessionMessage: string;

    // Behavior
    usePinInput: boolean;
    localStorageKey: string;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Check for stored session
const hasStoredSession = computed(() => {
    if (!props.moduleId || !import.meta.client) return false;
    try {
        const stored = localStorage.getItem(props.config.localStorageKey.replace('{id}', props.moduleId));
        return !!stored;
    } catch {
        return false;
    }
});

// Form validation schema
const passwordSchema = z.object({
    password: z.string().min(6, 'Le code d\'accès doit contenir 6 caractères').max(6, 'Le code d\'accès doit contenir 6 caractères'),
    passwordArray: z.array(z.string()).optional(),
});

type PasswordForm = z.infer<typeof passwordSchema>;

// Form state
const form = ref();
const loading = ref(false);
const error = ref<string | null>(props.error || null);
const password = ref('');

const formData = reactive<PasswordForm & { passwordArray: string[] }>({
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
    handleSubmit();
};

// Watch passwordArray changes to update password
watch(() => formData.passwordArray, (newValue) => {
    formData.password = newValue.join('');
}, { deep: true });

// Watch text password for proposal
watch(() => password.value, (newValue) => {
    if (!props.config.usePinInput) {
        formData.password = newValue;
    }
});

// Check if password is valid
const isPasswordValid = computed(() => {
    if (props.config.usePinInput) {
        return formData.password.length === 6;
    }
    return password.value.trim().length > 0;
});

// Handle form submission
const handleSubmit = async () => {
    const finalPassword = props.config.usePinInput ? formData.password : password.value.trim();

    if (!finalPassword) return;

    loading.value = true;
    error.value = null;

    try {
        emit('authenticated', finalPassword);
        if (props.config.usePinInput) {
            formData.password = '';
            formData.passwordArray = [];
        } else {
            password.value = '';
        }
    } finally {
        loading.value = false;
    }
};
</script>