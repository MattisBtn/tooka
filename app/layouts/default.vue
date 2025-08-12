<script setup lang="ts">
import { useAuth } from '~/composables/auth/useAuth'
import { useLogo } from '~/composables/shared/useLogo'
import { useSubscriptionStore } from '~/stores/subscription'
import { useUserStore } from '~/stores/user'

const isSidebarCollapsed = ref(false)

const { user, logout: authLogout } = useAuth()
const userStore = useUserStore()
const subscriptionStore = useSubscriptionStore()
const { logoSrc } = useLogo()

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
const planPrices = computed(() => {
    try {
        return subscriptionStore.plans.map(p => Number(p.price_monthly || 0))
    } catch {
        return []
    }
})

const highestMonthlyPrice = computed(() => {
    try {
        const prices = planPrices.value
        return prices.length ? Math.max(...prices) : 0
    } catch {
        return 0
    }
})

const userMonthlyPrice = computed(() => {
    try {
        return Number(userStore.plan?.price_monthly ?? 0)
    } catch {
        return 0
    }
})

const canUpgrade = computed(() => {
    try {
        // If we don't know plans yet, show the button (optimistic)
        if (!subscriptionStore.plans.length) return true
        return userMonthlyPrice.value < highestMonthlyPrice.value
    } catch {
        return true
    }
})

const goToUpgrade = async (_event?: MouseEvent): Promise<void> => {
    await navigateTo('/pricing')
}

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

// Sync auth changes
const supabase = useSupabaseClient()
onMounted(() => {
    const { data: authSub } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
            // Reset all stores when auth state changes to prevent data leakage between users
            if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                resetAllStores()
            }

            // Only fetch user data if we have a session
            if (session?.user) {
                await userStore.fetchUser({ silent: true })
            }
        } catch (error) {
            console.error('Auth state change error:', error)
        }
    })

    // Realtime channel for user profile changes
    const authUser = useSupabaseUser()
    let ch: ReturnType<typeof supabase.channel> | null = null
    if (authUser.value) {
        ch = supabase
            .channel('me-profile')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_profiles',
                filter: `id=eq.${authUser.value.id}`,
            }, () => {
                userStore.fetchUser({ silent: true }).catch(error => {
                    console.error('Profile change error:', error)
                })
            })
            .subscribe()
    }

    onUnmounted(() => {
        authSub?.subscription?.unsubscribe()
        if (ch) {
            supabase.removeChannel(ch)
            ch = null
        }
    })
})

// Function to reset all stores to prevent data leakage between users
const resetAllStores = () => {
    // Admin stores
    const projectsStore = useProjectsStore()
    const clientsStore = useClientsStore()
    const galleryStore = useGalleryStore()
    const moodboardStore = useMoodboardStore()
    const proposalStore = useProposalStore()
    const selectionStore = useSelectionStore()
    const projectSetupStore = useProjectSetupStore()

    // Public stores
    const clientGalleryStore = useClientGalleryStore()
    const clientMoodboardStore = useClientMoodboardStore()
    const clientSelectionStore = useClientSelectionStore()

    // Other stores
    const subscriptionStore = useSubscriptionStore()

    // Reset all stores
    projectsStore.reset()
    clientsStore.reset()
    galleryStore.reset()
    moodboardStore.reset()
    proposalStore.reset()
    selectionStore.reset()
    projectSetupStore.reset()
    clientGalleryStore.reset()
    clientMoodboardStore.reset()
    clientSelectionStore.reset()
    subscriptionStore.reset()
    userStore.clear()
}
</script>

<template>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
        <!-- Header -->
        <header class="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800">
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

                <UButton to="/me?tab=profile" color="neutral" variant="ghost" class="p-0" aria-label="Profil">
                    <UAvatar :src="displayAvatar" :alt="displayName" size="sm" />
                </UButton>
            </div>
        </header>

        <!-- Body: Sidebar + Main Content -->
        <div class="flex">
            <aside :class="[
                'transition-all duration-300 ease-in-out border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 flex flex-col',
                isSidebarCollapsed ? 'w-16' : 'w-64'
            ]" class="min-h-[calc(100vh-4rem)]">
                <!-- <div class="p-4 flex items-center justify-end border-b border-neutral-200 dark:border-neutral-700">
                    <UButton color="neutral" variant="ghost" icon="i-heroicons-chevron-left"
                        :class="[isSidebarCollapsed ? 'rotate-180' : '']" square @click="toggleSidebar" />
                </div> -->

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
                            <USeparator v-if="index < categories.length - 1" class="mt-4" />
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
                        <div v-if="canUpgrade" class="mt-4">
                            <UButton :disabled="true" color="primary" icon="i-heroicons-arrow-up-circle" size="xl"
                                class="w-full" @click="goToUpgrade">
                                Mise à niveau
                            </UButton>
                        </div>
                    </div>
                </div>
            </aside>

            <main class="flex-1 min-h-[calc(100vh-4rem)]">
                <div class="p-6">
                    <slot />
                </div>
            </main>
        </div>
    </div>
</template>