<template>
    <div
        class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <!-- Image with hover interactions -->
        <div class="aspect-square bg-neutral-100 dark:bg-neutral-900 relative group" @click="openImagePreview">
            <MoodboardImageClient :image="image" :signed-url="signedUrl"
                class="w-full h-full transition-transform duration-300 cursor-pointer" @click.stop="openImagePreview" />

            <!-- Desktop: Gradient overlay for interactions (hover only) -->
            <div v-if="canInteract || hasReactions || hasComments"
                class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block" />

            <!-- Mobile: Always visible interactions overlay -->
            <div v-if="canInteract || hasReactions || hasComments"
                class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:hidden" />

            <!-- Desktop: Interactions overlay (hover only) -->
            <div v-if="canInteract || hasReactions || hasComments"
                class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex md:justify-between md:items-end p-4">

                <!-- Comments (bottom left) -->
                <div v-if="canInteract || hasComments">
                    <UButton v-if="hasComments" variant="solid" color="neutral" size="sm" icon="i-lucide-message-circle"
                        class="backdrop-blur-sm bg-white/90 hover:bg-white text-neutral-900"
                        @click.stop="showCommentModal = true">
                        {{ image.comments?.length }}
                    </UButton>
                    <UButton v-else-if="canInteract" variant="solid" color="neutral" size="sm"
                        icon="i-lucide-message-circle-plus"
                        class="backdrop-blur-sm bg-white/90 hover:bg-white text-neutral-900"
                        @click.stop="showCommentModal = true" />
                </div>

                <!-- Reactions (bottom right) -->
                <div v-if="canInteract || hasReactions" class="flex items-center space-x-2">
                    <!-- Love reaction -->
                    <button v-if="canInteract" :class="[
                        'flex items-center space-x-1 px-3 py-2 rounded-full text-sm transition-all backdrop-blur-sm',
                        (image.reactions?.love || 0) > 0
                            ? 'bg-red-500/80 text-white'
                            : 'bg-white/20 hover:bg-white/30 text-white'
                    ]" @click.stop="$emit('react', 'love')">
                        <UIcon name="i-lucide-heart" :class="(image.reactions?.love || 0) > 0 ? 'fill-current' : ''"
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
                        (image.reactions?.like || 0) > 0
                            ? 'bg-green-500/80 text-white'
                            : 'bg-white/20 hover:bg-white/30 text-white'
                    ]" @click.stop="$emit('react', 'like')">
                        <UIcon name="i-lucide-thumbs-up" :class="(image.reactions?.like || 0) > 0 ? 'fill-current' : ''"
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
                        (image.reactions?.dislike || 0) > 0
                            ? 'bg-orange-500/80 text-white'
                            : 'bg-white/20 hover:bg-white/30 text-white'
                    ]" @click.stop="$emit('react', 'dislike')">
                        <UIcon name="i-lucide-thumbs-down"
                            :class="(image.reactions?.dislike || 0) > 0 ? 'fill-current' : ''" class="w-4 h-4" />
                        <span v-if="image.reactions?.dislike">{{ image.reactions.dislike }}</span>
                    </button>
                    <div v-else-if="image.reactions?.dislike"
                        class="flex items-center space-x-1 px-3 py-2 rounded-full text-sm bg-orange-500/80 text-white backdrop-blur-sm">
                        <UIcon name="i-lucide-thumbs-down" class="w-4 h-4 fill-current" />
                        <span>{{ image.reactions.dislike }}</span>
                    </div>
                </div>
            </div>

            <!-- Mobile: Always visible interaction buttons -->
            <div v-if="canInteract || hasReactions || hasComments"
                class="absolute inset-0 flex justify-between items-end p-3 md:hidden">

                <!-- Comments button (bottom left) -->
                <div v-if="canInteract || hasComments">
                    <UButton v-if="hasComments" variant="solid" color="neutral" size="sm" icon="i-lucide-message-circle"
                        class="backdrop-blur-sm bg-white/90 hover:bg-white text-neutral-900 shadow-lg"
                        :aria-label="`${image.comments?.length} commentaire${(image.comments?.length || 0) > 1 ? 's' : ''}, cliquer pour voir`"
                        :title="`${image.comments?.length} commentaire${(image.comments?.length || 0) > 1 ? 's' : ''}`"
                        @click.stop="showCommentModal = true">
                        <span class="text-xs font-medium">{{ image.comments?.length }}</span>
                    </UButton>
                    <UButton v-else-if="canInteract" variant="solid" color="neutral" size="sm"
                        icon="i-lucide-message-circle-plus"
                        class="backdrop-blur-sm bg-white/90 hover:bg-white text-neutral-900 shadow-lg"
                        aria-label="Ajouter un commentaire" title="Ajouter un commentaire"
                        @click.stop="showCommentModal = true" />
                </div>

                <!-- Reactions (bottom right) -->
                <div v-if="canInteract || hasReactions" class="flex items-center space-x-1">
                    <!-- Love reaction -->
                    <button v-if="canInteract" :class="[
                        'flex items-center justify-center w-8 h-8 rounded-full text-sm transition-all backdrop-blur-sm shadow-lg relative',
                        (image.reactions?.love || 0) > 0
                            ? 'bg-red-500/90 text-white'
                            : 'bg-white/90 text-neutral-700'
                    ]" :aria-label="`${image.reactions?.love || 0} j'aime, cliquer pour réagir`" title="J'aime"
                        @click.stop="$emit('react', 'love')">
                        <UIcon name="i-lucide-heart" :class="(image.reactions?.love || 0) > 0 ? 'fill-current' : ''"
                            class="w-4 h-4" />
                        <span v-if="image.reactions?.love"
                            class="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            {{ image.reactions.love }}
                        </span>
                    </button>
                    <div v-else-if="image.reactions?.love"
                        class="flex items-center justify-center w-8 h-8 rounded-full text-sm bg-red-500/90 text-white backdrop-blur-sm shadow-lg relative">
                        <UIcon name="i-lucide-heart" class="w-4 h-4 fill-current" />
                        <span
                            class="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            {{ image.reactions.love }}
                        </span>
                    </div>

                    <!-- Like reaction -->
                    <button v-if="canInteract" :class="[
                        'flex items-center justify-center w-8 h-8 rounded-full text-sm transition-all backdrop-blur-sm shadow-lg relative',
                        (image.reactions?.like || 0) > 0
                            ? 'bg-green-500/90 text-white'
                            : 'bg-white/90 text-neutral-700'
                    ]" :aria-label="`${image.reactions?.like || 0} pouce en haut, cliquer pour réagir`"
                        title="Pouce en haut" @click.stop="$emit('react', 'like')">
                        <UIcon name="i-lucide-thumbs-up" :class="(image.reactions?.like || 0) > 0 ? 'fill-current' : ''"
                            class="w-4 h-4" />
                        <span v-if="image.reactions?.like"
                            class="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            {{ image.reactions.like }}
                        </span>
                    </button>
                    <div v-else-if="image.reactions?.like"
                        class="flex items-center justify-center w-8 h-8 rounded-full text-sm bg-green-500/90 text-white backdrop-blur-sm shadow-lg relative">
                        <UIcon name="i-lucide-thumbs-up" class="w-4 h-4 fill-current" />
                        <span
                            class="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            {{ image.reactions.like }}
                        </span>
                    </div>

                    <!-- Dislike reaction -->
                    <button v-if="canInteract" :class="[
                        'flex items-center justify-center w-8 h-8 rounded-full text-sm transition-all backdrop-blur-sm shadow-lg relative',
                        (image.reactions?.dislike || 0) > 0
                            ? 'bg-orange-500/90 text-white'
                            : 'bg-white/90 text-neutral-700'
                    ]" :aria-label="`${image.reactions?.dislike || 0} pouce en bas, cliquer pour réagir`"
                        title="Pouce en bas" @click.stop="$emit('react', 'dislike')">
                        <UIcon name="i-lucide-thumbs-down"
                            :class="(image.reactions?.dislike || 0) > 0 ? 'fill-current' : ''" class="w-4 h-4" />
                        <span v-if="image.reactions?.dislike"
                            class="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            {{ image.reactions.dislike }}
                        </span>
                    </button>
                    <div v-else-if="image.reactions?.dislike"
                        class="flex items-center justify-center w-8 h-8 rounded-full text-sm bg-orange-500/90 text-white backdrop-blur-sm shadow-lg relative">
                        <UIcon name="i-lucide-thumbs-down" class="w-4 h-4 fill-current" />
                        <span
                            class="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            {{ image.reactions.dislike }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Comment Modal (Responsive: Modal on desktop, Drawer on mobile) -->
        <MoodboardCommentModal v-model:open="showCommentModal" :existing-comments="image.comments || []"
            :can-add-comment="canInteract" @comment-added="handleCommentAdded" />
    </div>
</template>

<script setup lang="ts">
import type { MoodboardImageWithInteractions } from '~/types/moodboard'

interface Props {
    image: MoodboardImageWithInteractions
    moodboardId: string
    canInteract: boolean
    signedUrl?: string | null
}

interface Emits {
    react: [reaction: 'love' | 'like' | 'dislike']
    comment: [comment: string, onSuccess?: () => void]
    'open-preview': [image: MoodboardImageWithInteractions]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Comment state
const showCommentModal = ref(false)

// Computed properties
const hasReactions = computed(() => {
    const reactions = props.image.reactions
    return reactions && (reactions.love > 0 || reactions.like > 0 || reactions.dislike > 0)
})

const hasComments = computed(() => {
    return props.image.comments && props.image.comments.length > 0
})

// Comment methods
const handleCommentAdded = (content: string) => {
    emit('comment', content, () => {
        // Close modal after successful comment addition
        showCommentModal.value = false
    })
}

// Image preview methods
const openImagePreview = () => {
    emit('open-preview', props.image)
}
</script>

<style scoped>
/* Additional styles if needed */
</style>