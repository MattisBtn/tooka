<script setup lang="ts">
import { useAuth } from '~/composables/auth/useAuth'
import { useUserProfile } from '~/composables/user/useUserProfile'

const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const { user, logout: authLogout } = useAuth()
const { profile } = useUserProfile()

// Define isDarkMode computed property for color mode toggle
const isDarkMode = computed({
    get: () => useColorMode().value === 'dark',
    set: (value) => {
        useColorMode().preference = value ? 'dark' : 'light'
    }
})

// Computed properties for user display
const displayName = computed(() => {
    if (profile.value?.first_name && profile.value?.last_name) {
        return `${profile.value.first_name} ${profile.value.last_name}`
    }
    if (profile.value?.first_name) {
        return profile.value.first_name
    }
    return user.value?.user_metadata?.name || user.value?.email || 'User'
})

const displayOrganization = computed(() => {
    return profile.value?.company_name || 'Your workspace'
})

const displayAvatar = computed(() => {
    return profile.value?.avatar_url || user.value?.user_metadata?.avatar_url
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
        ]
    },
]

const logout = async () => {
    const { success } = await authLogout()
    if (success) {
        navigateTo('/login')
    }
}
</script>

<template>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
        <aside :class="[
            'fixed top-0 left-0 h-screen z-30 transition-all duration-300 ease-in-out border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 flex flex-col',
            isSidebarCollapsed ? 'w-16' : 'w-64'
        ]">
            <div class="p-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700">
                <div class="flex items-center gap-2 overflow-hidden">
                    <UIcon name="i-heroicons-bolt" class="flex-shrink-0 text-primary-500 h-6 w-6" />
                    <span
                        :class="['font-bold text-lg transition-opacity', isSidebarCollapsed ? 'opacity-0' : 'opacity-100']">
                        Tooka
                    </span>
                </div>
                <UButton color="neutral" variant="ghost" icon="i-heroicons-chevron-left"
                    :class="[isSidebarCollapsed ? 'rotate-180' : '']" square @click="toggleSidebar" />
            </div>

            <div class="flex-1 overflow-y-auto py-4 flex flex-col">
                <div>
                    <div v-for="(category, index) in categories" :key="index" class="mb-6">
                        <div :class="[
                            'mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider transition-all duration-300',
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
                            <UIcon name="i-heroicons-moon" class="text-neutral-500" />
                            <span class="text-sm text-neutral-600 dark:text-neutral-300">Dark Mode</span>
                        </div>
                        <USwitch v-model="isDarkMode" color="primary" size="md" checked-icon="i-heroicons-moon"
                            unchecked-icon="i-heroicons-sun" />
                    </div>
                </div>


            </div>

            <!-- User profile and logout button -->
            <div class="border-t border-neutral-200 dark:border-neutral-700 p-4">
                <!-- User profile -->
                <UButton to="/me" color="neutral" variant="ghost" class="w-full p-2 justify-start"
                    :class="[isSidebarCollapsed ? 'justify-center' : 'justify-start']">
                    <div class="flex items-center gap-2 w-full">
                        <UAvatar :src="displayAvatar" :alt="displayName" class="flex-shrink-0" size="sm" />
                        <div :class="[isSidebarCollapsed ? 'sr-only' : 'min-w-0 flex-1 text-left']">
                            <p class="text-sm font-medium truncate">{{ displayName }}</p>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate">{{
                                displayOrganization }}</p>
                        </div>
                    </div>
                </UButton>

                <!-- Logout button -->
                <div class="mt-4 flex items-center">
                    <UButton class="w-full" color="error" variant="ghost" icon="i-heroicons-arrow-right-on-rectangle"
                        :leading="!isSidebarCollapsed" size="md" @click="logout">
                        <span v-if="!isSidebarCollapsed">Logout</span>
                    </UButton>
                </div>
            </div>
        </aside>

        <main :class="[
            'min-h-screen transition-all duration-300 ease-in-out',
            isSidebarCollapsed ? 'ml-16' : 'ml-64'
        ]">
            <div class="p-6">
                <slot />
            </div>
        </main>
    </div>
</template>