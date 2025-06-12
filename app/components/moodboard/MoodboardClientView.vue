<template>
    <div class="min-h-screen">
        <!-- Moodboard Description -->
        <div class="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="max-w-3xl">
                    <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                        {{ moodboard.title }}
                    </h1>
                    <p v-if="moodboard.description"
                        class="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {{ moodboard.description }}
                    </p>


                    <MoodboardImageUpload v-if="canInteract" :disabled="uploadingImages" :progress="uploadProgress"
                        @files-selected="$emit('upload-images', $event)" />
                </div>
            </div>
        </div>

        <!-- Images Grid -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <MoodboardImageCard v-for="image in images" :key="image.id" :image="image" :moodboard-id="moodboardId"
                    :can-interact="canInteract" @react="$emit('react-to-image', image.id, $event)"
                    @comment="$emit('add-comment', image.id, $event)" />
            </div>

            <!-- Load More Button -->
            <div v-if="hasMore" class="text-center mt-8">
                <UButton variant="outline" size="lg" :loading="loadingMore" icon="i-lucide-chevron-down"
                    @click="$emit('load-more')">
                    Charger plus d'images
                </UButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type {
    ClientMoodboardAccess,
    MoodboardImageWithInteractions,
    MoodboardWithDetails
} from '~/types/moodboard'

interface Props {
    moodboardId: string
    moodboard: MoodboardWithDetails
    project: ClientMoodboardAccess['project']
    images: MoodboardImageWithInteractions[]
    hasMore: boolean
    loadingMore: boolean
    canInteract: boolean
    uploadingImages: boolean
    uploadProgress: number
}

interface Emits {
    'load-more': []
    'upload-images': [files: File[]]
    'add-comment': [imageId: string, comment: string]
    'react-to-image': [imageId: string, reaction: 'love' | 'like' | 'dislike']
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
/* Additional styles if needed */
</style>