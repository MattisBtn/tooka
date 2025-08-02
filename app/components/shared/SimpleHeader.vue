<template>
    <header class="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center gap-3">
                    <div :class="[
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        config.iconBgClass
                    ]">
                        <UIcon :name="config.icon" class="w-4 h-4 text-white" />
                    </div>
                    <NuxtImg v-if="config.showLogo" :src="logoSrc" alt="Tooka" class="h-6 w-auto" />
                    <h1 v-else class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        {{ config.title }}
                    </h1>
                </div>
                <UButton v-if="config.showColorToggle" :icon="isDarkMode ? 'i-heroicons-sun' : 'i-heroicons-moon'"
                    color="neutral" variant="ghost" size="sm" @click="toggleColorMode" />
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { useLogo } from '~/composables/shared/useLogo';

export interface SimpleHeaderConfig {
    icon: string;
    iconBgClass: string;
    title?: string;
    showLogo: boolean;
    showColorToggle: boolean;
}

interface Props {
    config: SimpleHeaderConfig;
}

defineProps<Props>();

// Color mode management
const colorMode = useColorMode();
const isDarkMode = computed(() => colorMode.value === 'dark');
const toggleColorMode = () => {
    colorMode.preference = isDarkMode.value ? 'light' : 'dark';
};

// Logo management
const { logoSrc } = useLogo();
</script>