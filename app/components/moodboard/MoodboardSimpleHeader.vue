<template>
    <header class="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                        <UIcon name="i-heroicons-camera" class="w-4 h-4 text-white" />
                    </div>
                    <span class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        Tooka
                    </span>
                </div>
                <UButton :icon="isDarkMode ? 'i-heroicons-sun' : 'i-heroicons-moon'" color="neutral" variant="ghost"
                    size="sm" @click="toggleColorMode" />
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
// Color mode management
const colorMode = useColorMode();
const isDarkMode = computed(() => colorMode.value === 'dark');
const toggleColorMode = () => {
    colorMode.preference = isDarkMode.value ? 'light' : 'dark';
};
</script>

<style scoped>
/* Additional styles if needed */
</style>