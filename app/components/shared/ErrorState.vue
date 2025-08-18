<template>
    <div class="min-h-screen flex items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-900">
        <UCard class="w-full max-w-lg text-center shadow-xl border-0">
            <div class="space-y-8 p-8">
                <!-- Icon -->
                <div
                    class="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>

                <!-- Content -->
                <div class="space-y-4">
                    <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        {{ config.title }}
                    </h1>
                    <p class="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {{ config.description }}
                    </p>
                    <p class="text-sm text-neutral-500 dark:text-neutral-500">
                        {{ config.helpText }}
                    </p>
                </div>

                <!-- Actions -->
                <div v-if="config.actions" class="space-y-3">
                    <UButton v-for="action in config.actions" :key="action.label" :variant="action.variant || 'solid'"
                        :color="action.color || 'primary'" :to="action.to" :href="action.href" class="w-full"
                        @click="action.onClick">
                        <UIcon v-if="action.icon" :name="action.icon" class="w-4 h-4 mr-2" />
                        {{ action.label }}
                    </UButton>
                </div>

                <!-- Contact info -->
                <div v-if="config.contactInfo" class="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <p class="text-xs text-neutral-500 dark:text-neutral-500">
                        {{ config.contactInfo }}
                    </p>
                </div>
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">
export interface ErrorAction {
    label: string;
    variant?: 'solid' | 'outline' | 'ghost' | 'link';
    color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';
    icon?: string;
    to?: string;
    href?: string;
    onClick?: () => void;
}

export interface ErrorStateConfig {
    title: string;
    description: string;
    helpText: string;
    actions?: ErrorAction[];
    contactInfo?: string;
}

interface Props {
    config: ErrorStateConfig;
}

defineProps<Props>();
</script>