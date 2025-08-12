<template>
    <header v-if="moodboard && isAuthenticated && project"
        class="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Logo and Project Info -->
                <div class="flex items-center gap-4 min-w-0 flex-1">
                    <NuxtImg :src="logoSrc" alt="Tooka" class="h-6 w-auto hidden sm:block" />

                    <!-- Project Title and Status -->
                    <div class="hidden md:flex items-center gap-4 min-w-0">
                        <UBadge :color="statusColor" variant="soft" size="sm">
                            <UIcon :name="statusIcon" class="w-3 h-3 mr-1" />
                            {{ statusLabel }}
                        </UBadge>
                    </div>
                </div>

                <!-- Actions and Controls -->
                <div class="flex items-center gap-3">
                    <!-- Client Actions -->
                    <div v-if="canShowActions" class="flex items-center gap-2">
                        <!-- Awaiting client actions -->
                        <template v-if="moodboard?.status === 'awaiting_client'">
                            <!-- Validate button -->
                            <UButton color="neutral" size="sm" icon="i-lucide-check" class="hidden sm:flex"
                                @click="$emit('validate')">
                                <span class="hidden lg:inline">Valider</span>
                            </UButton>

                            <!-- Request revisions button -->
                            <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-edit"
                                class="hidden sm:flex" @click="$emit('request-revisions')">
                                <span class="hidden lg:inline">Demander des révisions</span>
                                <span class="lg:hidden">Révisions</span>
                            </UButton>
                        </template>

                        <!-- Mobile Actions Drawer -->
                        <UDrawer v-if="canShowActions" class="sm:hidden">
                            <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost" size="sm" />

                            <template #content>
                                <div class="p-4 space-y-4">
                                    <!-- Awaiting client actions -->
                                    <template v-if="moodboard?.status === 'awaiting_client'">
                                        <!-- Validate button -->
                                        <UButton color="neutral" variant="solid" size="lg" icon="i-lucide-check" block
                                            @click="$emit('validate')">
                                            Valider le moodboard
                                        </UButton>

                                        <!-- Request revisions -->
                                        <UButton color="neutral" variant="outline" size="lg" icon="i-lucide-edit" block
                                            @click="$emit('request-revisions')">
                                            Demander des révisions
                                        </UButton>
                                    </template>
                                </div>
                            </template>
                        </UDrawer>
                    </div>

                    <!-- Logout button -->
                    <UButton v-if="showLogoutButton" icon="i-heroicons-arrow-left-on-rectangle" color="neutral"
                        variant="ghost" size="sm" title="Se déconnecter" @click="$emit('logout')" />

                    <!-- Dark mode toggle -->
                    <UButton :icon="isDarkMode ? 'i-heroicons-sun' : 'i-heroicons-moon'" color="neutral" variant="ghost"
                        size="sm" @click="toggleColorMode" />
                </div>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { useLogo } from '~/composables/shared/useLogo'
import type {
    ClientMoodboardAccess,
    MoodboardWithDetails
} from '~/types/moodboard'

interface Props {
    project: ClientMoodboardAccess['project'] | null
    moodboard: MoodboardWithDetails | null
    isAuthenticated: boolean
    showLogoutButton?: boolean
}

interface Emits {
    validate: []
    'request-revisions': []
    logout: []
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Color mode management
const colorMode = useColorMode();
const isDarkMode = computed(() => colorMode.value === 'dark');
const toggleColorMode = () => {
    colorMode.preference = isDarkMode.value ? 'light' : 'dark';
};

// Logo management
const { logoSrc } = useLogo()

// Status display logic
const statusConfig = {
    draft: { label: "Brouillon", color: "neutral" as const, icon: "i-lucide-file-text" },
    awaiting_client: { label: "En attente de votre retour", color: "warning" as const, icon: "i-lucide-clock" },
    revision_requested: { label: "Révision demandée", color: "info" as const, icon: "i-lucide-edit" },
    completed: { label: "Validé", color: "success" as const, icon: "i-lucide-check-circle" },
    payment_pending: { label: "Paiement en attente", color: "warning" as const, icon: "i-lucide-credit-card" },
};

const statusLabel = computed(() =>
    statusConfig[props.moodboard?.status || "draft"].label
);
const statusColor = computed(() =>
    statusConfig[props.moodboard?.status || "draft"].color
);
const statusIcon = computed(() =>
    statusConfig[props.moodboard?.status || "draft"].icon
);

// Can show action buttons
const canShowActions = computed(() => {
    return props.isAuthenticated &&
        props.moodboard &&
        (props.moodboard.status === 'awaiting_client' || props.moodboard.status === 'completed')
})
</script>

<style scoped>
/* Additional styles if needed */
</style>