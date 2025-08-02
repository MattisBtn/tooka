<template>
    <div class="min-h-screen flex items-center justify-center p-4">
        <UCard class="w-full max-w-lg text-center">
            <div class="space-y-6">
                <div
                    class="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                        {{ config.title }}
                    </h1>
                    <p class="text-neutral-600 dark:text-neutral-400 mb-4">
                        {{ config.description }}
                    </p>
                    <p class="text-sm text-neutral-500 dark:text-neutral-500">
                        {{ config.helpText }}
                    </p>
                </div>
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">
export interface ErrorStateConfig {
    title: string;
    description: string;
    helpText: string;
}

interface Props {
    config: ErrorStateConfig;
}

defineProps<Props>();
</script>