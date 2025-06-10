<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Header -->
        <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <!-- Logo -->
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-camera" class="w-4 h-4 text-white" />
                        </div>
                        <span class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Tooka Gallery
                        </span>
                    </div>

                    <!-- Dark mode toggle -->
                    <div class="flex items-center gap-4">
                        <UButton :icon="isDarkMode ? 'i-heroicons-sun' : 'i-heroicons-moon'" color="neutral"
                            variant="ghost" size="sm" @click="toggleColorMode" />
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1">
            <slot />
        </main>

        <!-- Footer -->
        <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Powered by
                        <span class="font-medium text-primary-600 dark:text-primary-400">Tooka</span>
                    </p>
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
// Color mode management
const colorMode = useColorMode()

const isDarkMode = computed(() => colorMode.value === 'dark')

const toggleColorMode = () => {
    colorMode.preference = isDarkMode.value ? 'light' : 'dark'
}

// SEO defaults for gallery pages
useHead({
    titleTemplate: '%s - Tooka Gallery',
    meta: [
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
    ]
})
</script>