<template>
    <div class="space-y-3">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div v-for="(image, index) in images" :key="image.id"
                class="relative group aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                @click="handleImageClick(image)">

                <!-- Image -->
                <NuxtImg :src="getImageUrl(image.file_url)" :alt="`Image de galerie ${index + 1}`"
                    class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                    loading="lazy" />

                <!-- Image counter badge -->
                <div class="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {{ index + 1 }}
                </div>

                <!-- Delete button (if enabled) -->
                <div v-if="canDelete"
                    class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <UButton icon="i-lucide-trash-2" color="error" variant="solid" size="sm"
                        @click.stop="handleDeleteImage(image.id)" />
                </div>
            </div>
        </div>

        <!-- Empty state -->
        <div v-if="images.length === 0" class="text-center py-8">
            <div
                class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UIcon name="i-lucide-images" class="w-8 h-8 text-neutral-400" />
            </div>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">Aucune image de galerie</p>
        </div>
    </div>

    <!-- Image Preview Modal -->
    <SharedImagePreviewModal :is-open="imagePreview.isOpen.value" :current-image="imagePreview.currentImage.value"
        :images="imagePreview.images.value" :current-index="imagePreview.currentIndex.value"
        :image-signed-urls="imageSignedUrls" :show-thumbnails="false" @close="imagePreview.closePreview"
        @next="imagePreview.nextImage" @previous="imagePreview.previousImage" @go-to="imagePreview.goToImage" />
</template>

<script lang="ts" setup>
import { useImagePreview } from '~/composables/shared/useImagePreview';
import type { GalleryImage } from '~/types/gallery';

interface Props {
    images: readonly GalleryImage[]
    canDelete?: boolean
}

interface Emits {
    (e: 'delete-image', imageId: string): void
}

const props = withDefaults(defineProps<Props>(), {
    canDelete: false,
})

const emit = defineEmits<Emits>()

// Image preview composable
const imagePreview = useImagePreview()

// Simple URL generation - no complex signed URL management
const getImageUrl = (fileUrl: string) => {
    const supabase = useSupabaseClient()
    return supabase.storage.from('gallery-images').getPublicUrl(fileUrl).data.publicUrl
}

// Handle image click to open preview
const handleImageClick = (image: GalleryImage) => {
    const previewImages = props.images.map(img => ({
        id: img.id,
        file_url: img.file_url,
        created_at: img.created_at
    }))
    imagePreview.openPreview(image, previewImages)
}

// Handle delete
const handleDeleteImage = (imageId: string) => {
    emit('delete-image', imageId)
}

// Simple signed URLs for preview modal
const imageSignedUrls = computed(() => {
    const urlMap = new Map<string, string>()
    props.images.forEach(img => {
        urlMap.set(img.file_url, getImageUrl(img.file_url))
    })
    return urlMap
})
</script>