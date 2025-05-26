<script setup lang="ts">
import { useAuth } from '~/composables/auth/useAuth'

const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const { user, logout: authLogout } = useAuth()

// Define isDarkMode computed property for color mode toggle
const isDarkMode = computed({
    get: () => useColorMode().value === 'dark',
    set: (value) => {
        useColorMode().preference = value ? 'dark' : 'light'
    }
})

const categories = [
    {
        name: 'Overview',
        links: [
            { name: 'Dashboard', icon: 'i-heroicons-home', to: '/' },
            { name: 'Clients', icon: 'i-heroicons-users', to: '/clients' }
        ]
    },
    {
        name: 'Workflow',
        links: [
            { name: 'Projects', icon: 'i-heroicons-folder', to: '/projects' },
            { name: 'Proposals', icon: 'i-heroicons-document-text', to: '/proposals' },
            { name: 'Contracts', icon: 'i-heroicons-document-check', to: '/contracts' },
            { name: 'Invoices', icon: 'i-heroicons-document-chart-bar', to: '/invoices' },
            { name: 'Calendar', icon: 'i-heroicons-calendar', to: '/calendar' }
        ]
    },
    {
        name: 'System',
        links: [
            { name: 'Organization', icon: 'i-heroicons-building-office', to: '/organization' },
            { name: 'Team', icon: 'i-heroicons-user-group', to: '/team' },
            { name: 'Billing', icon: 'i-heroicons-credit-card', to: '/billing' }
        ]
    }
]

const logout = async () => {
    const { success } = await authLogout()
    if (success) {
        navigateTo('/login')
    }
}
</script>

<template>
    <div class="min-h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <aside :class="[
            'transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex flex-col',
            isSidebarCollapsed ? 'w-16' : 'w-64'
        ]">
            <div class="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 overflow-hidden">
                    <UIcon name="i-heroicons-bolt" class="flex-shrink-0 text-primary-500 h-6 w-6" />
                    <span
                        :class="['font-bold text-lg transition-opacity', isSidebarCollapsed ? 'opacity-0' : 'opacity-100']">
                        Flow
                    </span>
                </div>
                <UButton color="neutral" variant="ghost" icon="i-heroicons-chevron-left"
                    :class="[isSidebarCollapsed ? 'rotate-180' : '']" square @click="toggleSidebar" />
            </div>

            <div class="flex-1 overflow-y-auto py-4 flex flex-col">
                <div>
                    <div v-for="(category, index) in categories" :key="index" class="mb-6">
                        <div :class="[
                            'mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider transition-all duration-300',
                            isSidebarCollapsed ? 'text-center px-1' : 'px-4'
                        ]">
                            <span v-if="isSidebarCollapsed">{{ category.name.charAt(0) }}</span>
                            <span v-else>{{ category.name }}</span>
                        </div>
                        <div :class="[
                            'space-y-1 transition-all duration-300',
                            isSidebarCollapsed ? 'px-1' : 'px-2'
                        ]">
                            <UButton v-for="link in category.links" :key="link.name" :to="link.to" :icon="link.icon"
                                variant="link" color="neutral" square :class="[
                                    'w-full transition-all duration-300',
                                    isSidebarCollapsed ? 'flex justify-center' : 'justify-start',
                                    $route.path === link.to ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : ''
                                ]" :active="$route.path === link.to"
                                :active-color="$route.path === link.to ? 'primary' : 'neutral'"
                                :active-variant="$route.path === link.to ? 'ghost' : 'ghost'" size="md">
                                <span v-if="!isSidebarCollapsed" class="transition-opacity duration-300 ml-2">{{
                                    link.name
                                }}</span>
                            </UButton>
                        </div>
                    </div>
                </div>

                <!-- Color mode toggle -->
                <div class="px-4 mt-auto">
                    <div :class="['flex items-center', isSidebarCollapsed ? 'justify-center' : 'justify-between']">
                        <div v-if="!isSidebarCollapsed" class="flex items-center gap-4">
                            <UIcon name="i-heroicons-moon" class="text-gray-500" />
                            <span class="text-sm text-gray-600 dark:text-gray-300">Dark Mode</span>
                        </div>
                        <USwitch v-model="isDarkMode" color="primary" size="md" checked-icon="i-heroicons-moon"
                            unchecked-icon="i-heroicons-sun" />
                    </div>
                </div>
            </div>

            <!-- User profile and logout button -->
            <div class="border-t border-gray-200 dark:border-gray-700 p-4">
                <div class="flex items-center gap-2">
                    <UAvatar :src="user?.user_metadata?.avatar_url" :alt="user?.user_metadata?.name || 'User'"
                        class="flex-shrink-0" size="sm" />
                    <div :class="[isSidebarCollapsed ? 'sr-only' : 'min-w-0 flex-1']">
                        <p class="text-sm font-medium truncate">{{ user?.user_metadata?.name || user?.email }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{
                            user?.user_metadata?.organization || 'Your workspace' }}</p>
                    </div>
                </div>

                <!-- Logout button -->
                <div class="mt-4 flex items-center">
                    <UButton class="w-full" color="error" variant="ghost" icon="i-heroicons-arrow-right-on-rectangle"
                        :leading="!isSidebarCollapsed" size="md" @click="logout">
                        <span v-if="!isSidebarCollapsed">Logout</span>
                    </UButton>
                </div>
            </div>
        </aside>

        <main class="flex-1 overflow-auto">
            <div class="p-6">
                <slot />
            </div>
        </main>
    </div>
</template>