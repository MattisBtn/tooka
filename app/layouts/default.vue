<script setup lang="ts">
import { useAuth } from '~/composables/auth/useAuth'
import { useLogo } from '~/composables/shared/useLogo'
import { useSubscriptionStore } from '~/stores/subscription'
import { useUserStore } from '~/stores/user'
import type { Client } from '~/types/client'

const isSidebarCollapsed = ref(false)
const isNotificationSlideoverOpen = ref(false)

// Notifications
const { unreadCount, init: initNotifications, cleanup: cleanupNotifications } = useNotifications()

// Initialiser les notifications au montage
onMounted(() => {
    initNotifications()
})

// Cleanup des notifications au démontage
onUnmounted(() => {
    cleanupNotifications()
})

const { user, logout: authLogout } = useAuth()
const userStore = useUserStore()
const subscriptionStore = useSubscriptionStore()
const { logoSrc } = useLogo()

// Client store for global modal
const store = useClientsStore()

// Define isDarkMode computed property for color mode toggle
const isDarkMode = computed({
    get: () => useColorMode().value === 'dark',
    set: (value) => {
        useColorMode().preference = value ? 'dark' : 'light'
    }
})

// Initial client-side fetch of user data
useAsyncData('user:init', async () => {
    try {
        await userStore.fetchUser({ silent: false })
    } catch (error) {
        console.error('Failed to fetch user data:', error)
        // Don't block the UI if user fetch fails
    }
}, { server: false })

onMounted(() => {
    const plan = userStore.plan;
    if (plan && !plan.is_active) {
        navigateTo('/pricing')
    }
})

// Computed properties for user display
const displayName = computed(() => {
    const p = userStore.user.profile
    if (p?.first_name && p?.last_name) return `${p.first_name} ${p.last_name}`
    if (p?.first_name) return p.first_name
    return user.value?.user_metadata?.name || user.value?.email || 'User'
})

const displayAvatar = computed(() => {
    return userStore.user.profile?.avatar_url || user.value?.user_metadata?.avatar_url
})

// Subscription plan label (safe fallback)
const planLabel = computed(() => unref(userStore.plan)?.name || '—')

// Account dropdown items (profile, pricing, logout)
const accountMenuItems = computed(() => [
    [
        { label: 'Mon profil', icon: 'i-heroicons-user', onSelect: () => navigateTo('/me?tab=profile') },
        { label: 'Abonnement', icon: 'i-heroicons-currency-euro', onSelect: () => navigateTo('/me?tab=billing') }
    ],
    [
        { label: 'Se déconnecter', icon: 'i-heroicons-arrow-right-on-rectangle', color: 'error', onSelect: () => logout() }
    ]
])

// Plans loading and upgrade availability
onMounted(async () => {
    try {
        if (!subscriptionStore.plans.length) {
            await subscriptionStore.fetchPlans()
        }
    } catch (error) {
        console.error('Failed to fetch plans:', error)
        // Don't block the UI if plans fetch fails
    }
})

// Simplified computed to avoid deep type issues
const canUpgrade = computed(() => {
    try {
        if (!subscriptionStore.plans.length) return true
        const userPrice = Number(userStore.plan?.price_monthly ?? 0)
        const prices = subscriptionStore.plans.map(p => Number(p.price_monthly || 0))
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
        return userPrice < maxPrice
    } catch {
        return true
    }
})

const goToUpgrade = async (_event?: MouseEvent): Promise<void> => {
    await navigateTo('/pricing')
}

// Navigation menu items for UNavigationMenu
const route = useRoute()
const navigationItems = computed(() => [
    {
        label: 'Overview',
        type: 'label' as const
    },
    {
        label: 'Dashboard',
        icon: 'i-heroicons-home',
        to: '/',
        active: route.path === '/'
    },
    {
        label: 'Clients',
        icon: 'i-heroicons-users',
        to: '/clients',
        active: route.path === '/clients',
        badge: userStore.clientsCount || undefined
    },
    {
        label: 'Workflow',
        type: 'label' as const
    },
    {
        label: 'Projects',
        icon: 'i-heroicons-folder',
        to: '/projects',
        active: route.path.startsWith('/projects'),
        badge: userStore.projectsCount || undefined
    }
])

const logout = async () => {
    const { success } = await authLogout()
    if (success) {
        navigateTo('/login')
    }
}
</script>

<template>
    <div
        class="h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col">
        <!-- Header -->
        <header
            class="h-16 border-b border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 flex-shrink-0">
            <div class="h-full flex items-center justify-between px-6">
                <div class="flex items-center gap-4 min-w-0">
                    <ClientOnly>
                        <NuxtImg :src="logoSrc" alt="Tooka" class="w-24 h-auto" />
                        <template #fallback>
                            <div class="w-24 h-8 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                        </template>
                    </ClientOnly>
                    <USeparator orientation="vertical" class="h-8" />
                    <div class="min-w-0">
                        <div class="flex flex-col leading-tight min-w-0">
                            <span class="text-sm font-medium truncate">{{ displayName }}</span>
                            <div class="flex items-center gap-1 min-w-0">
                                <span class="text-xs text-neutral-500 dark:text-neutral-400 truncate">{{ planLabel
                                }}</span>
                                <UDropdownMenu :items="accountMenuItems" :content="{ align: 'start' }">
                                    <UButton color="neutral" variant="ghost" icon="i-heroicons-chevron-down"
                                        size="sm" />
                                </UDropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-6">
                    <!-- Notification Bell -->
                    <div v-if="unreadCount > 0">
                        <UChip :value="unreadCount" color="error" size="xl">
                            <UButton icon="i-heroicons-bell" color="neutral" variant="subtle" size="md"
                                @click="isNotificationSlideoverOpen = true" />
                        </UChip>
                    </div>
                    <UButton v-else icon="i-heroicons-bell" color="neutral" variant="subtle" size="md"
                        @click="isNotificationSlideoverOpen = true" />

                    <!-- Avatar -->
                    <UButton to="/me?tab=profile" color="neutral" variant="ghost" class="p-0" aria-label="Profil">
                        <UAvatar :src="displayAvatar" :alt="displayName" size="sm" />
                    </UButton>
                </div>
            </div>
        </header>

        <!-- Body: Sidebar + Main Content -->
        <div class="flex flex-1 overflow-hidden">
            <aside :class="[
                'transition-all duration-300 ease-in-out border-r border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 flex flex-col flex-shrink-0 relative',
                isSidebarCollapsed ? 'w-16' : 'w-64'
            ]">
                <div class="flex-1 overflow-y-auto py-4 flex flex-col">
                    <!-- Navigation Menu -->
                    <UNavigationMenu :items="navigationItems" orientation="vertical" highlight highlight-color="neutral"
                        :collapsed="isSidebarCollapsed" class="flex-1"
                        :class="isSidebarCollapsed ? 'self-center' : ''" />

                    <!-- Color mode toggle and upgrade button -->
                    <div class="px-4 mt-auto">
                        <!-- Collapse Button -->
                        <div
                            :class="['flex items-center mb-4', isSidebarCollapsed ? 'justify-center' : 'justify-between']">
                            <div v-if="!isSidebarCollapsed" class="flex items-center gap-2">
                                <UIcon name="i-heroicons-arrows-pointing-in" class="text-neutral-500" />
                                <span class="text-sm text-neutral-600 dark:text-neutral-300">Réduire</span>
                            </div>
                            <UButton
                                :icon="isSidebarCollapsed ? 'i-heroicons-chevron-right' : 'i-heroicons-chevron-left'"
                                color="neutral" variant="ghost" size="sm"
                                @click="isSidebarCollapsed = !isSidebarCollapsed" />
                        </div>

                        <div :class="['flex items-center', isSidebarCollapsed ? 'justify-center' : 'justify-between']">
                            <div v-if="!isSidebarCollapsed" class="flex items-center gap-4">
                                <UIcon name="i-heroicons-moon" class="text-neutral-500" />
                                <span class="text-sm text-neutral-600 dark:text-neutral-300">Dark Mode</span>
                            </div>
                            <USwitch v-model="isDarkMode" color="primary" size="md" checked-icon="i-heroicons-moon"
                                unchecked-icon="i-heroicons-sun" />
                        </div>
                        <div v-if="canUpgrade" class="mt-4">
                            <UButton :disabled="true" color="primary" variant="subtle"
                                icon="i-heroicons-arrow-up-circle" class="w-full" @click="goToUpgrade">
                                <span v-if="!isSidebarCollapsed">Mise à niveau</span>
                            </UButton>
                        </div>
                    </div>
                </div>
            </aside>

            <main class="flex-1 overflow-auto">
                <div class="p-6">
                    <slot />
                </div>
            </main>
        </div>

        <!-- Global Modals -->
        <ClientModal :model-value="store.modalState.type === 'create' || store.modalState.type === 'edit'"
            :client="store.modalState.type === 'edit' ? (store.modalState.data as Client) : undefined" :portal="true"
            @update:model-value="store.closeModal" />

        <!-- Notification Slideover -->
        <USlideover v-model:open="isNotificationSlideoverOpen" title="Notifications">
            <template #body>
                <NotificationList />
            </template>
        </USlideover>
    </div>
</template>