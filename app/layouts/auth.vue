<template>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
        <header class="w-full p-4 border-b border-neutral-200 dark:border-neutral-800">
            <div class="container mx-auto flex justify-center">
                <NuxtLink to="/" class="flex items-center gap-2">
                    <span class="text-xl font-bold text-neutral-900 dark:text-white">Tooka</span>
                </NuxtLink>
            </div>
        </header>

        <main class="flex-1 flex items-center justify-center p-4">
            <div class="w-full max-w-md">
                <slot />
            </div>
        </main>

        <footer class="w-full p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
            <p>© {{ new Date().getFullYear() }} Tooka. All rights reserved.</p>
        </footer>
    </div>
</template>