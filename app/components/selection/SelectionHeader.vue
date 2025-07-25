<template>
    <header v-if="selection && isAuthenticated && project"
        class="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Logo and Project Info -->
                <div class="flex items-center gap-4 min-w-0 flex-1">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-camera" class="w-4 h-4 text-white" />
                        </div>
                        <span class="text-xl font-semibold text-neutral-900 dark:text-neutral-100 hidden sm:block">
                            Tooka
                        </span>
                    </div>

                    <!-- Project Title and Status -->
                    <div class="hidden md:flex items-center gap-4 min-w-0">
                        <div class="border-l border-neutral-300 dark:border-neutral-600 pl-4">
                            <h1 class="text-lg font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                {{ project.title }}
                            </h1>
                        </div>
                        <UBadge :color="statusColor" variant="soft" size="sm">
                            <UIcon :name="statusIcon" class="w-3 h-3 mr-1" />
                            {{ statusLabel }}
                        </UBadge>
                    </div>

                    <!-- Selection Counter -->
                    <div
                        class="hidden lg:flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span class="text-sm font-medium text-amber-700 dark:text-amber-300">
                            {{ selectedCount }} / {{ maxAllowed }}
                        </span>
                        <span v-if="extraCount > 0" class="text-xs text-amber-600 dark:text-amber-400">
                            (+{{ extraCount }} extra)
                        </span>
                    </div>
                </div>

                <!-- Actions and Controls -->
                <div class="flex items-center gap-3">
                    <!-- Extra Price Display -->
                    <div v-if="extraPrice > 0"
                        class="hidden sm:flex items-center gap-2 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <UIcon name="i-lucide-euro" class="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span class="text-sm font-medium text-orange-700 dark:text-orange-300">
                            +{{ extraPrice.toFixed(2) }}€
                        </span>
                    </div>

                    <!-- Client Actions -->
                    <div v-if="canShowActions" class="flex items-center gap-2">
                        <!-- Awaiting client actions -->
                        <template v-if="selection?.status === 'awaiting_client'">
                            <!-- Validate button -->
                            <UButton color="warning" size="sm" icon="i-lucide-check" class="hidden sm:flex"
                                @click="$emit('validate')">
                                <span class="hidden lg:inline">Valider</span>
                            </UButton>

                            <!-- Request revisions button -->
                            <UButton color="warning" variant="outline" size="sm" icon="i-lucide-edit"
                                class="hidden sm:flex" @click="$emit('request-revisions')">
                                <span class="hidden lg:inline">Demander des révisions</span>
                                <span class="lg:hidden">Révisions</span>
                            </UButton>
                        </template>

                        <!-- Mobile Actions Drawer -->
                        <UDrawer v-if="canShowActions" class="sm:hidden">
                            <UButton icon="i-heroicons-ellipsis-vertical" color="warning" variant="ghost" size="sm" />

                            <template #content>
                                <div class="p-4 space-y-4">
                                    <div
                                        class="flex items-center gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                                        <UIcon name="i-lucide-check-square"
                                            class="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Actions
                                        </h3>
                                    </div>

                                    <!-- Selection Info -->
                                    <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 space-y-2">
                                        <div class="flex items-center justify-between text-sm">
                                            <span class="text-amber-700 dark:text-amber-300">Sélectionnées</span>
                                            <span class="font-medium text-amber-800 dark:text-amber-200">
                                                {{ selectedCount }} / {{ maxAllowed }}
                                            </span>
                                        </div>
                                        <div v-if="extraCount > 0" class="flex items-center justify-between text-sm">
                                            <span class="text-orange-700 dark:text-orange-300">Images
                                                supplémentaires</span>
                                            <span class="font-medium text-orange-800 dark:text-orange-200">
                                                {{ extraCount }}
                                            </span>
                                        </div>
                                        <div v-if="extraPrice > 0" class="flex items-center justify-between text-sm">
                                            <span class="text-orange-700 dark:text-orange-300">Coût
                                                supplémentaire</span>
                                            <span class="font-medium text-orange-800 dark:text-orange-200">
                                                +{{ extraPrice.toFixed(2) }}€
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Awaiting client actions -->
                                    <template v-if="selection?.status === 'awaiting_client'">
                                        <!-- Validate button -->
                                        <UButton color="warning" variant="solid" size="lg" icon="i-lucide-check" block
                                            @click="$emit('validate')">
                                            Valider la sélection
                                        </UButton>

                                        <!-- Request revisions -->
                                        <UButton color="warning" variant="outline" size="lg" icon="i-lucide-edit" block
                                            @click="$emit('request-revisions')">
                                            Demander des révisions
                                        </UButton>
                                    </template>

                                    <!-- Selection info -->
                                    <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
                                        <div class="flex items-center justify-between text-sm">
                                            <span class="text-neutral-600 dark:text-neutral-400">Statut</span>
                                            <UBadge :color="statusColor" variant="soft" size="sm">
                                                <UIcon :name="statusIcon" class="w-3 h-3 mr-1" />
                                                {{ statusLabel }}
                                            </UBadge>
                                        </div>
                                        <div v-if="project" class="pt-2">
                                            <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-1">{{
                                                project.title }}</h4>
                                            <p class="text-xs text-neutral-600 dark:text-neutral-400">
                                                Sélection d'images
                                            </p>
                                        </div>
                                    </div>
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
import type {
    ClientSelectionAccess,
    SelectionWithImages
} from '~/types/selection'

interface Props {
    project: ClientSelectionAccess['project'] | null
    selection: SelectionWithImages | null
    isAuthenticated: boolean
    showLogoutButton?: boolean
    selectedCount: number
    maxAllowed: number
    extraCount: number
    extraPrice: number
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

// Status display logic
const statusConfig = {
    draft: { label: "Brouillon", color: "neutral" as const, icon: "i-lucide-file-text" },
    awaiting_client: { label: "En attente de votre sélection", color: "warning" as const, icon: "i-lucide-clock" },
    revision_requested: { label: "Révision demandée", color: "info" as const, icon: "i-lucide-edit" },
    completed: { label: "Sélection validée", color: "success" as const, icon: "i-lucide-check-circle" },
};

const statusLabel = computed(() =>
    statusConfig[props.selection?.status || "draft"].label
);
const statusColor = computed(() =>
    statusConfig[props.selection?.status || "draft"].color
);
const statusIcon = computed(() =>
    statusConfig[props.selection?.status || "draft"].icon
);

// Can show action buttons
const canShowActions = computed(() => {
    return props.isAuthenticated &&
        props.selection &&
        (props.selection.status === 'awaiting_client' || props.selection.status === 'completed')
})
</script>

<style scoped>
/* Additional styles if needed */
</style>