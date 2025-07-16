<template>
    <div class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
        <UCard class="w-full max-w-md">
            <template #header>
                <div class="text-center space-y-3">
                    <div
                        class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                        <UIcon name="i-lucide-lock" class="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                            Accès protégé
                        </h1>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            {{ project?.title }}
                        </p>
                    </div>
                </div>
            </template>

            <div class="space-y-6">
                <div class="text-center">
                    <p class="text-neutral-700 dark:text-neutral-300">
                        Cette proposition est protégée par un mot de passe.
                    </p>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        Veuillez saisir le mot de passe fourni par votre photographe.
                    </p>
                </div>

                <UForm :state="state" class="space-y-4" @submit="handleSubmit">
                    <UFormField label="Mot de passe" name="password" required>
                        <UInput v-model="password" type="password" placeholder="Saisissez le mot de passe"
                            icon="i-lucide-key" :loading="loading" :disabled="loading" size="lg" autofocus />
                    </UFormField>

                    <!-- Error display -->
                    <UAlert v-if="error" color="error" variant="soft" icon="i-lucide-alert-circle" :title="error" />

                    <UButton type="submit" color="primary" size="lg" block :loading="loading"
                        :disabled="!password.trim()" icon="i-lucide-unlock" label="Accéder à la proposition" />
                </UForm>

                <div class="text-center">
                    <p class="text-xs text-neutral-500 dark:text-neutral-500">
                        Vous n'avez pas le mot de passe ? Contactez votre photographe.
                    </p>
                </div>
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">
interface Props {
    project?: {
        id: string;
        title: string;
        hasPassword: boolean;
    } | null;
    proposalId: string;
    error?: string | null;
}

interface Emits {
    (e: 'authenticated', password: string): void;
}

const _props = defineProps<Props>();
const emit = defineEmits<Emits>();

const password = ref('');
const loading = ref(false);

// Form state for UForm
const state = reactive({
    password: ''
});

// Watch for changes to sync with local ref
watch(() => password.value, (newValue) => {
    state.password = newValue;
});

const handleSubmit = async () => {
    if (!password.value.trim()) return;

    loading.value = true;

    try {
        emit('authenticated', password.value);
    } finally {
        loading.value = false;
    }
};
</script>