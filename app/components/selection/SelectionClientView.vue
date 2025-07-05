<template>
    <div class="min-h-screen">
        <!-- Selection Description -->
        <div class="bg-white dark:bg-neutral-900">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div class="text-center max-w-4xl mx-auto">
                    <!-- Main title SELECTION -->
                    <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black mb-4 tracking-tight">
                        SÉLECTION
                    </h1>

                    <!-- Subtitle with project title -->
                    <div
                        class="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium mb-8">
                        <div>{{ project.title }}</div>
                    </div>

                    <!-- Selection Instructions -->
                    <div class="max-w-2xl mx-auto mb-8">
                        <p class="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                            Sélectionnez vos images préférées en cliquant dessus.
                            Vous pouvez choisir jusqu'à {{ maxAllowed }} images incluses.
                        </p>
                    </div>

                    <!-- Selection Stats -->
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                        <!-- Selected count -->
                        <div class="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                            <div class="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-white" />
                            </div>
                            <div class="text-left">
                                <div class="text-sm text-amber-600 dark:text-amber-400 font-medium">
                                    Images sélectionnées
                                </div>
                                <div class="text-lg font-bold text-amber-700 dark:text-amber-300">
                                    {{ selectedCount }} / {{ maxAllowed }}
                                </div>
                            </div>
                        </div>

                        <!-- Extra count -->
                        <div
v-if="extraCount > 0"
                            class="flex items-center gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                            <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-plus-circle" class="w-4 h-4 text-white" />
                            </div>
                            <div class="text-left">
                                <div class="text-sm text-orange-600 dark:text-orange-400 font-medium">
                                    Images supplémentaires
                                </div>
                                <div class="text-lg font-bold text-orange-700 dark:text-orange-300">
                                    {{ extraCount }}
                                </div>
                            </div>
                        </div>

                        <!-- Extra price -->
                        <div
v-if="extraPrice > 0"
                            class="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                            <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-euro" class="w-4 h-4 text-white" />
                            </div>
                            <div class="text-left">
                                <div class="text-sm text-red-600 dark:text-red-400 font-medium">
                                    Coût supplémentaire
                                </div>
                                <div class="text-lg font-bold text-red-700 dark:text-red-300">
                                    +{{ extraPrice.toFixed(2) }}€
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Instructions -->
                    <div v-if="canInteract" class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                        <div class="flex items-center gap-3 justify-center">
                            <UIcon name="i-lucide-info" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <p class="text-sm text-amber-700 dark:text-amber-300">
                                Cliquez sur les images pour les sélectionner. Vos choix sont sauvegardés localement.
                            </p>
                        </div>
                    </div>

                    <!-- Selection status indicator -->
                    <div v-if="canInteract && selectedCount > 0" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div class="flex items-center gap-3 justify-center">
                            <UIcon name="i-lucide-save" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <p class="text-sm text-blue-700 dark:text-blue-300">
                                Vos sélections sont temporaires. Cliquez sur "Valider ma sélection" pour les confirmer.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Images Grid -->
        <div ref="selectionContainer" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div v-if="images.length === 0" class="text-center py-12">
                <div
                    class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UIcon name="i-lucide-image" class="w-8 h-8 text-neutral-400" />
                </div>
                <h3 class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    Aucune image pour le moment
                </h3>
                <p class="text-neutral-500 dark:text-neutral-400">
                    Les images à sélectionner seront affichées ici
                </p>
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <SelectionImageCard
v-for="image in images" :key="image.id" :image="image" :selection-id="selectionId"
                    :can-interact="canInteract" @toggle-selection="$emit('toggle-selection', image.id)" />
            </div>

            <!-- Loading indicator -->
            <div v-if="loadingMore" class="text-center mt-8 py-4">
                <div class="flex items-center justify-center gap-3">
                    <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-amber-500" />
                    <span class="text-neutral-600 dark:text-neutral-400">Chargement d'autres images...</span>
                </div>
            </div>

            <!-- End of results -->
            <div v-else-if="images.length > 0 && !hasMore" class="text-center mt-8 py-4">
                <div class="flex items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400">
                    <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
                    <span>Toutes les images ont été chargées</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core';
import type {
    ClientSelectionAccess,
    SelectionImageWithSelection,
    SelectionWithImages
} from '~/types/selection';

interface Props {
    selectionId: string
    selection: SelectionWithImages
    project: ClientSelectionAccess['project']
    images: SelectionImageWithSelection[]
    hasMore: boolean
    loadingMore: boolean
    canInteract: boolean
    selectedCount: number
    maxAllowed: number
    extraCount: number
    extraPrice: number
}

interface Emits {
    'load-more': []
    'toggle-selection': [imageId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Container ref for infinite scroll
const selectionContainer = ref<HTMLElement | null>(null)

// Infinite scroll setup
onMounted(() => {
    if (selectionContainer.value) {
        useInfiniteScroll(
            selectionContainer.value,
            async () => {
                if (props.hasMore && !props.loadingMore) {
                    emit('load-more')
                }
            },
            {
                distance: 400, // Load more when 400px from bottom
                canLoadMore: () => props.hasMore && !props.loadingMore
            }
        )
    }
})
</script>

<style scoped>
/* Additional styles if needed */
</style>