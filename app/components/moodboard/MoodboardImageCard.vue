<template>
    <div
        class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <!-- Image with hover interactions -->
        <div ref="imageRef" class="aspect-square bg-neutral-100 dark:bg-neutral-900 relative group">
            <NuxtImg v-if="imageUrl" :src="imageUrl" :alt="image.caption || 'Image du moodboard'"
                class="w-full h-full object-cover transition-transform duration-300" loading="lazy" />
            <div v-else-if="loading" class="w-full h-full flex items-center justify-center">
                <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
            <div v-else-if="error" class="w-full h-full flex items-center justify-center">
                <UIcon name="i-lucide-image-off" class="w-8 h-8 text-neutral-400" />
            </div>

            <!-- Caption overlay -->
            <div v-if="image.caption"
                class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 group-hover:opacity-0 transition-opacity duration-300">
                <p class="text-white text-sm">{{ image.caption }}</p>
            </div>

            <!-- Gradient overlay for contrast (appears on hover) -->
            <div v-if="canInteract || hasReactions || (image.comments && image.comments.length > 0)"
                class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <!-- Interactions overlay (appears on hover) -->
            <div v-if="canInteract || hasReactions || (image.comments && image.comments.length > 0)"
                class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-end p-4">

                <!-- Comments (bottom left) -->
                <div v-if="canInteract || (image.comments && image.comments.length > 0)">
                    <UButton v-if="image.comments && image.comments.length > 0" variant="solid" color="neutral"
                        size="sm" icon="i-lucide-message-circle"
                        class="backdrop-blur-sm bg-white/90 hover:bg-white text-neutral-900"
                        @click="showCommentModal = true">
                        {{ image.comments.length }} commentaire{{ image.comments.length > 1 ? 's' : '' }}
                    </UButton>
                    <UButton v-else-if="canInteract" variant="solid" color="neutral" size="sm"
                        icon="i-lucide-message-circle-plus"
                        class="backdrop-blur-sm bg-white/90 hover:bg-white text-neutral-900"
                        @click="showCommentModal = true">
                        Commenter
                    </UButton>
                </div>

                <!-- Reactions (bottom right) -->
                <div v-if="canInteract || hasReactions" class="flex items-center space-x-2">
                    <!-- Love reaction -->
                    <button v-if="canInteract" :class="[
                        'flex items-center space-x-1 px-3 py-2 rounded-full text-sm transition-all backdrop-blur-sm',
                        image.userReaction === 'love'
                            ? 'bg-red-500/80 text-white'
                            : 'bg-white/20 hover:bg-white/30 text-white'
                    ]" @click="$emit('react', 'love')">
                        <UIcon name="i-lucide-heart" :class="image.userReaction === 'love' ? 'fill-current' : ''"
                            class="w-4 h-4" />
                        <span v-if="image.reactions?.love">{{ image.reactions.love }}</span>
                    </button>
                    <div v-else-if="image.reactions?.love"
                        class="flex items-center space-x-1 px-3 py-2 rounded-full text-sm bg-red-500/80 text-white backdrop-blur-sm">
                        <UIcon name="i-lucide-heart" class="w-4 h-4 fill-current" />
                        <span>{{ image.reactions.love }}</span>
                    </div>

                    <!-- Like reaction -->
                    <button v-if="canInteract" :class="[
                        'flex items-center space-x-1 px-3 py-2 rounded-full text-sm transition-all backdrop-blur-sm',
                        image.userReaction === 'like'
                            ? 'bg-green-500/80 text-white'
                            : 'bg-white/20 hover:bg-white/30 text-white'
                    ]" @click="$emit('react', 'like')">
                        <UIcon name="i-lucide-thumbs-up" :class="image.userReaction === 'like' ? 'fill-current' : ''"
                            class="w-4 h-4" />
                        <span v-if="image.reactions?.like">{{ image.reactions.like }}</span>
                    </button>
                    <div v-else-if="image.reactions?.like"
                        class="flex items-center space-x-1 px-3 py-2 rounded-full text-sm bg-green-500/80 text-white backdrop-blur-sm">
                        <UIcon name="i-lucide-thumbs-up" class="w-4 h-4 fill-current" />
                        <span>{{ image.reactions.like }}</span>
                    </div>

                    <!-- Dislike reaction -->
                    <button v-if="canInteract" :class="[
                        'flex items-center space-x-1 px-3 py-2 rounded-full text-sm transition-all backdrop-blur-sm',
                        image.userReaction === 'dislike'
                            ? 'bg-orange-500/80 text-white'
                            : 'bg-white/20 hover:bg-white/30 text-white'
                    ]" @click="$emit('react', 'dislike')">
                        <UIcon name="i-lucide-thumbs-down"
                            :class="image.userReaction === 'dislike' ? 'fill-current' : ''" class="w-4 h-4" />
                        <span v-if="image.reactions?.dislike">{{ image.reactions.dislike }}</span>
                    </button>
                    <div v-else-if="image.reactions?.dislike"
                        class="flex items-center space-x-1 px-3 py-2 rounded-full text-sm bg-orange-500/80 text-white backdrop-blur-sm">
                        <UIcon name="i-lucide-thumbs-down" class="w-4 h-4 fill-current" />
                        <span>{{ image.reactions.dislike }}</span>
                    </div>
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