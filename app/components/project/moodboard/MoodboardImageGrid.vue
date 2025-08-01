<template>
    <div class="space-y-3">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div v-for="(image, index) in displayImages" :key="image.id"
                class="relative group aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                @click="handleImageClick(image)">

                <!-- Image -->
                <NuxtImg :src="getImageUrl(image.file_url)" :alt="`Image d'inspiration ${index + 1}`"
                    class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                    loading="lazy" />

                <!-- Hover overlay with actions -->
                <div
                    class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                    <div class="flex items-center gap-2">
                        <UButton icon="i-lucide-eye" size="xs" color="primary" variant="solid" title="Voir l'image"
                            @click.stop="handleImageClick(image)" />

                        <UButton v-if="canDelete && isEditing" icon="i-lucide-trash-2" size="xs" color="error"
                            variant="solid" title="Supprimer" @click.stop="$emit('delete-image', image.id)" />
                    </div>
                </div>

                <!-- Image counter badge -->
                <div class="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {{ index + 1 }}
                </div>
            </div>
        </div>

        <!-- Show more/less button if there are more images -->
        <div v-if="images.length > maxPreview" class="text-center">
            <UButton :icon="showAll ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" variant="outline" color="neutral"
                :label="showAll ? 'Voir moins' : `Voir ${images.length - maxPreview} image${images.length - maxPreview > 1 ? 's' : ''} de plus`"
                @click="showAll = !showAll" />
        </div>

        <!-- Empty state -->
        <div v-if="images.length === 0" class="text-center py-8">
            <div
                class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UIcon name="i-lucide-images" class="w-8 h-8 text-neutral-400" />
            </div>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">Aucune image d'inspiration</p>
        </div>
    </div>

    <!-- Image Preview Modal -->
    <SharedImagePreviewModal :is-open="imagePreview.isOpen.value" :current-image="imagePreview.currentImage.value"
        :images="imagePreview.images.value" :current-index="imagePreview.currentIndex.value"
        @close="imagePreview.closePreview" @next="imagePreview.nextImage" @previous="imagePreview.previousImage"
        @go-to="imagePreview.goToImage" />
</template>

<script lang="ts" setup>
import { useImagePreview } from '~/composables/shared/useImagePreview';
import type { MoodboardImage } from '~/types/moodboard';

interface Props {
    images: MoodboardImage[]
    maxPreview?: number
    canDelete?: boolean
    isEditing?: boolean
}

interface Emits {
    (e: 'delete-image', imageId: string): void
}

const props = withDefaults(defineProps<Props>(), {
    maxPreview: 6,
    canDelete: false,
    isEditing: false
})

defineEmits<Emits>()

// Local state
const showAll = ref(false)

// Image preview composable
const imagePreview = useImagePreview()

// Handle image click to open preview
const handleImageClick = (image: MoodboardImage) => {
    imagePreview.openPreview(image, props.images)
}

const displayImages = computed(() => {
    if (showAll.value || props.images.length <= props.maxPreview) {
        return props.images
    }
    return props.images.slice(0, props.maxPreview)
})

// Get real image URL using the moodboard repository
const getImageUrl = (filePath: string) => {
    try {
        // Use the public URL method from Supabase directly for moodboard images
        const supabase = useSupabaseClient()
        const { data } = supabase.storage
            .from('moodboard-images')
            .getPublicUrl(filePath)
        return data.publicUrl
    } catch (error) {
        console.error('Error getting moodboard image URL:', error)
        return `https://via.placeholder.com/300x300?text=Error+Loading+Image`
    }
}
</script>