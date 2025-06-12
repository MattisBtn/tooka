<template>
    <div
        class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <!-- Image -->
        <div ref="imageRef" class="aspect-square bg-neutral-100 dark:bg-neutral-900 relative">
            <img v-if="imageUrl" :src="imageUrl" :alt="image.caption || 'Image du moodboard'"
                class="w-full h-full object-cover" loading="lazy">
            <div v-else-if="loading" class="w-full h-full flex items-center justify-center">
                <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
            <div v-else-if="error" class="w-full h-full flex items-center justify-center">
                <UIcon name="i-lucide-image-off" class="w-8 h-8 text-neutral-400" />
            </div>

            <!-- Caption overlay -->
            <div v-if="image.caption"
                class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p class="text-white text-sm">{{ image.caption }}</p>
            </div>
        </div>

        <!-- Interactions -->
        <div class="p-4 space-y-3">
            <!-- Reactions -->
            <div v-if="canInteract || hasReactions" class="flex items-center space-x-2">
                <!-- Love reaction -->
                <button v-if="canInteract" :class="[
                    'flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-all',
                    image.userReaction === 'love'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                ]" @click="$emit('react', 'love')">
                    <UIcon name="i-lucide-heart" :class="image.userReaction === 'love' ? 'fill-current' : ''"
                        class="w-4 h-4" />
                    <span v-if="image.reactions?.love">{{ image.reactions.love }}</span>
                </button>
                <div v-else-if="image.reactions?.love"
                    class="flex items-center space-x-1 text-sm text-neutral-600 dark:text-neutral-400">
                    <UIcon name="i-lucide-heart" class="w-4 h-4 fill-current text-red-500" />
                    <span>{{ image.reactions.love }}</span>
                </div>

                <!-- Like reaction -->
                <button v-if="canInteract" :class="[
                    'flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-all',
                    image.userReaction === 'like'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                ]" @click="$emit('react', 'like')">
                    <UIcon name="i-lucide-thumbs-up" :class="image.userReaction === 'like' ? 'fill-current' : ''"
                        class="w-4 h-4" />
                    <span v-if="image.reactions?.like">{{ image.reactions.like }}</span>
                </button>
                <div v-else-if="image.reactions?.like"
                    class="flex items-center space-x-1 text-sm text-neutral-600 dark:text-neutral-400">
                    <UIcon name="i-lucide-thumbs-up" class="w-4 h-4 fill-current text-green-500" />
                    <span>{{ image.reactions.like }}</span>
                </div>

                <!-- Dislike reaction -->
                <button v-if="canInteract" :class="[
                    'flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-all',
                    image.userReaction === 'dislike'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                ]" @click="$emit('react', 'dislike')">
                    <UIcon name="i-lucide-thumbs-down" :class="image.userReaction === 'dislike' ? 'fill-current' : ''"
                        class="w-4 h-4" />
                    <span v-if="image.reactions?.dislike">{{ image.reactions.dislike }}</span>
                </button>
                <div v-else-if="image.reactions?.dislike"
                    class="flex items-center space-x-1 text-sm text-neutral-600 dark:text-neutral-400">
                    <UIcon name="i-lucide-thumbs-down" class="w-4 h-4 fill-current text-orange-500" />
                    <span>{{ image.reactions.dislike }}</span>
                </div>
            </div>

            <!-- Comments Summary -->
            <div v-if="image.comments && image.comments.length > 0" class="space-y-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <UIcon name="i-lucide-message-circle" class="w-4 h-4 text-neutral-400" />
                        <span class="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            {{ image.comments.length }} commentaire{{ image.comments.length > 1 ? 's' : '' }}
                        </span>
                    </div>
                    <UButton v-if="canInteract" variant="ghost" size="xs" @click="showCommentModal = true">
                        Voir tout
                    </UButton>
                </div>
            </div>

            <!-- Add first comment -->
            <div v-else-if="canInteract" class="space-y-2">
                <div class="flex justify-start">
                    <UButton variant="ghost" size="sm" icon="i-lucide-message-circle-plus"
                        @click="showCommentModal = true">
                        Premier commentaire
                    </UButton>
                </div>
            </div>
        </div>

        <!-- Comment Modal -->
        <MoodboardCommentModal v-model:open="showCommentModal" :existing-comments="image.comments || []"
            @comment-added="handleCommentAdded" />
    </div>
</template>

<script setup lang="ts">
import { useClientMoodboardImages } from '~/composables/moodboards/client/useClientMoodboardImages'
import type { MoodboardImageWithInteractions } from '~/types/moodboard'

interface Props {
    image: MoodboardImageWithInteractions
    moodboardId: string
    canInteract: boolean
}

interface Emits {
    react: [reaction: 'love' | 'like' | 'dislike']
    comment: [comment: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Image loading avec lazy loading corrigé
const { useLazyImageLoading } = useClientMoodboardImages()
const { imageUrl, loading, error, imageRef } = useLazyImageLoading(
    props.moodboardId,
    props.image.file_url
)

// Comment state
const showCommentModal = ref(false)

// Computed properties
const hasReactions = computed(() => {
    const reactions = props.image.reactions
    return reactions && (reactions.love > 0 || reactions.like > 0 || reactions.dislike > 0)
})

// Comment methods
const handleCommentAdded = (content: string) => {
    emit('comment', content)
}
</script>

<style scoped>
/* Additional styles if needed */
</style>