<template>
    <div class="min-h-screen">
        <!-- Moodboard Description -->
        <div class="bg-white dark:bg-neutral-900">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div class="text-center max-w-4xl mx-auto">
                    <!-- Main title MOODBOARD -->
                    <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black mb-4 tracking-tight">
                        MOODBOARD
                    </h1>

                    <!-- Subtitle with project and moodboard titles -->
                    <div
                        class="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium mb-8 space-y-1">
                        <div>{{ project.title }}</div>
                        <div class="text-neutral-400 dark:text-neutral-500">{{ moodboard.title }}</div>
                    </div>

                    <!-- Description -->
                    <div v-if="moodboard.description" class="max-w-2xl mx-auto">
                        <p class="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                            {{ moodboard.description }}
                        </p>
                    </div>

                    <!-- Upload section for interactive mode -->
                    <div v-if="canInteract" class="mt-12">
                        <MoodboardImageUpload :disabled="uploadingImages"
                            @files-selected="$emit('upload-images', $event)" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Images Grid -->
        <div ref="moodboardContainer" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div v-if="images.length === 0" class="text-center py-12">
                <div
                    class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UIcon name="i-lucide-image" class="w-8 h-8 text-neutral-400" />
                </div>
                <h3 class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    Aucune image pour le moment
                </h3>
                <p class="text-neutral-500 dark:text-neutral-400">
                    Les images d'inspiration seront affichées ici
                </p>
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <MoodboardImageCard v-for="image in images" :key="image.id" :image="image" :moodboard-id="moodboardId"
                    :can-interact="canInteract" @react="$emit('react-to-image', image.id, $event)"
                    @comment="$emit('add-comment', image.id, $event)" />
            </div>

            <!-- Loading indicator -->
            <div v-if="loadingMore" class="text-center mt-8 py-4">
                <div class="flex items-center justify-center gap-3">
                    <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-primary-500" />
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
    ClientMoodboardAccess,
    MoodboardImageWithInteractions,
    MoodboardWithDetails
} from '~/types/moodboard';

interface Props {
    moodboardId: string
    moodboard: MoodboardWithDetails
    project: ClientMoodboardAccess['project']
    images: MoodboardImageWithInteractions[]
    hasMore: boolean
    loadingMore: boolean
    canInteract: boolean
    uploadingImages: boolean
}

interface Emits {
    'load-more': []
    'upload-images': [files: File[]]
    'add-comment': [imageId: string, comment: string]
    'react-to-image': [imageId: string, reaction: 'love' | 'like' | 'dislike']
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Container ref for infinite scroll
const moodboardContainer = ref<HTMLElement | null>(null)

// Debounced load more function to prevent excessive calls
const loadMoreDebounced = useDebounceFn(async () => {
    if (props.hasMore && !props.loadingMore) {
        emit('load-more')
    }
}, 300)

// Infinite scroll setup with better protection
onMounted(() => {
    if (moodboardContainer.value) {
        useInfiniteScroll(
            moodboardContainer.value,
            loadMoreDebounced,
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