<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <header class="w-full p-4 border-b border-gray-200 dark:border-gray-800">
            <div class="container mx-auto flex justify-center">
                <NuxtLink to="/" class="flex items-center gap-2">
                    <UIcon name="lucide:flow" class="text-primary-500 h-8 w-8" />
                    <span class="text-xl font-bold text-gray-900 dark:text-white">Flow</span>
                </NuxtLink>
            </div>
        </header>

        <main class="flex-1 flex items-center justify-center p-4">
            <div class="w-full max-w-md">
                <slot />
            </div>
        </main>

        <footer class="w-full p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© {{ new Date().getFullYear() }} Flow. All rights reserved.</p>
        </footer>
    </div>
</template>