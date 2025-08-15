<template>
    <div class="space-y-3">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div v-for="(image, index) in displayImages" :key="image.id"
                class="relative group aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105">

                <!-- Image -->
                <NuxtImg :src="getImageUrl(image.file_url)" :alt="`Image de galerie ${index + 1}`"
                    class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                    loading="lazy" />

                <!-- Image counter badge -->
                <div class="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {{ index + 1 }}
                </div>

                <!-- Action Menu -->
                <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <UDropdownMenu :items="getImageActions(image)" :ui="{
                        content: 'min-w-48'
                    }">
                        <UButton icon="i-lucide-more-vertical" color="neutral" variant="solid" size="sm" />
                    </UDropdownMenu>
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
            <p class="text-sm text-neutral-600 dark:text-neutral-400">Aucune image de galerie</p>
        </div>
    </div>

    <!-- Image Preview Modal -->
    <SharedImagePreviewModal :is-open="imagePreview.isOpen.value" :current-image="imagePreview.currentImage.value"
        :images="imagePreview.images.value" :current-index="imagePreview.currentIndex.value"
        :image-signed-urls="imageSignedUrls" :show-thumbnails="false" @close="imagePreview.closePreview" @next="imagePreview.nextImage"
        @previous="imagePreview.previousImage" @go-to="imagePreview.goToImage" />
</template>

<script lang="ts" setup>
import { useImagePreview } from '~/composables/shared/useImagePreview';
import type { GalleryImage } from '~/types/gallery';

interface Props {
    images: GalleryImage[]
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

const emit = defineEmits<Emits>()

// Local state
const showAll = ref(false)

// Image preview composable
const imagePreview = useImagePreview()

// Create a Map of signed URLs for the preview modal
const imageSignedUrls = ref<Map<string, string>>(new Map())

watchEffect(async () => {
    const supabase = useSupabaseClient()
    const filepaths = props.images.map(image => image.file_url)

    if (filepaths.length === 0) {
        imageSignedUrls.value = new Map<string, string>()
        return
    }

    const { data: urls, error } = await supabase.storage
        .from('gallery-images')
        .createSignedUrls(filepaths, 3600)

    if (error) {
        console.error('Error creating signed URLs:', error)
        imageSignedUrls.value = new Map<string, string>()
        return
    }

    const urlMap = new Map<string, string>()
    urls?.forEach(urlData => {
        if (urlData.path && urlData.signedUrl) {
            urlMap.set(urlData.path, urlData.signedUrl)
        }
    })

    imageSignedUrls.value = urlMap
})

// Handle image click to open preview
const handleImageClick = (image: GalleryImage) => {
    // Convert GalleryImage to PreviewImage format
    const previewImage = {
        id: image.id,
        file_url: image.file_url,
        created_at: image.created_at
    }
    imagePreview.openPreview(previewImage, props.images.map(img => ({
        id: img.id,
        file_url: img.file_url,
        created_at: img.created_at
    })))
}

const displayImages = computed(() => {
    if (showAll.value || props.images.length <= props.maxPreview) {
        return props.images
    }
    return props.images.slice(0, props.maxPreview)
})

// Get real image URL using the gallery repository
const getImageUrl = (filePath: string) => {
    try {
        // Use the public URL method from Supabase directly for gallery images
        const supabase = useSupabaseClient()
        const { data } = supabase.storage
            .from('gallery-images')
            .getPublicUrl(filePath)
        return data.publicUrl
    } catch (error) {
        console.error('Error getting gallery image URL:', error)
        return `https://via.placeholder.com/300x300?text=Error+Loading+Image`
    }
}

const getImageActions = (image: GalleryImage) => {
    const actions = []

    // View image action
    actions.push({
        label: 'Voir l\'image',
        icon: 'i-lucide-eye',
        onSelect: () => handleImageClick(image)
    })

    // Delete action
    if (props.canDelete) {
        actions.push({ type: 'separator' })
        actions.push({
            label: 'Supprimer',
            icon: 'i-lucide-trash-2',
            color: 'error',
            onSelect: () => emit('delete-image', image.id)
        })
    }

    return [actions] // Wrap in array for grouped structure
}
</script>