<template>
    <div v-if="images.length > 0" class="space-y-4">
        <!-- Images Grid -->
        <div class="space-y-3">
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div v-for="(image, index) in displayImages" :key="image.id"
                    class="relative group aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer"
                    :class="getImageClasses(image)">

                    <!-- Image Display -->
                    <NuxtImg :src="getImageUrl(image)" :alt="image.source_filename || 'Selection image'"
                        class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                        @error="handleImageError" />

                    <!-- RAW Badge -->
                    <div v-if="image.requires_conversion && image.source_file_url"
                        class="absolute top-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded shadow-lg">
                        {{ (image.source_format || 'RAW').toUpperCase() }}
                    </div>

                    <!-- Selection Indicator -->
                    <div v-if="(canToggleSelection || showSelectionState)" class="absolute bottom-2 left-2">
                        <!-- Interactive button for clients -->
                        <UButton v-if="canToggleSelection"
                            :icon="image.is_selected ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                            :color="image.is_selected ? 'success' : 'neutral'"
                            :variant="image.is_selected ? 'solid' : 'outline'" size="sm"
                            @click.stop="handleToggleSelection(image.id, !image.is_selected)" />
                        <!-- Read-only indicator for photographers -->
                        <div v-else-if="showSelectionState && image.is_selected"
                            class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-green-500">
                            <UIcon name="i-lucide-check" class="w-4 h-4 text-white" />
                        </div>
                    </div>

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
                <UButton :icon="showAll ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" variant="outline"
                    color="neutral"
                    :label="showAll ? 'Voir moins' : `Voir ${images.length - maxPreview} image${images.length - maxPreview > 1 ? 's' : ''} de plus`"
                    @click="showAll = !showAll" />
            </div>


        </div>
    </div>

    <div v-else class="text-center py-12">
        <UIcon name="i-lucide-images" class="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <p class="text-neutral-600 dark:text-neutral-400">
            Aucune image dans cette sélection
        </p>
    </div>

    <!-- Image Preview Modal -->
    <SharedImagePreviewModal :is-open="imagePreview.isOpen.value" :current-image="imagePreview.currentImage.value"
        :images="imagePreview.images.value" :current-index="imagePreview.currentIndex.value"
        :image-signed-urls="imageSignedUrls" :show-thumbnails="false" @close="imagePreview.closePreview"
        @next="imagePreview.nextImage" @previous="imagePreview.previousImage" @go-to="imagePreview.goToImage" />
</template>

<script lang="ts" setup>
import { useImagePreview, type PreviewImage } from '~/composables/shared/useImagePreview';
import { useSelectionStore } from '~/stores/admin/selection';
import type { SelectionImage } from '~/types/selection';

interface Props {
    images: SelectionImage[]
    maxPreview?: number
    canDelete?: boolean
    canToggleSelection?: boolean // Only for client interface - allows interactive selection
    showSelectionState?: boolean // For photographer interface - shows client selection state in read-only mode
}

interface Emits {
    (e: 'delete-image', imageId: string): void
    (e: 'toggle-selection', imageId: string, selected: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
    maxPreview: 6,
    canDelete: false,
    canToggleSelection: false,
    showSelectionState: false,
})

const emit = defineEmits<Emits>()

// Image preview composable
const imagePreview = useImagePreview()

// Local state for show more/less
const showAll = ref(false)

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
        .from('selection-images')
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
const handleImageClick = (image: SelectionImage) => {
    // Convert SelectionImage to PreviewImage format
    const previewImage: PreviewImage = {
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

// Computed for display images
const displayImages = computed(() => {
    if (showAll.value || props.images.length <= props.maxPreview) {
        return props.images
    }
    return props.images.slice(0, props.maxPreview)
})

// Helper methods
const getImageUrl = (image: SelectionImage): string => {
    return getSignedUrl(image.file_url)
}

const getSignedUrl = (filePath: string): string => {
    // This should be implemented to get signed URLs from Supabase
    const supabase = useSupabaseClient()
    const { data } = supabase.storage
        .from('selection-images')
        .getPublicUrl(filePath)

    return data.publicUrl
}

const getImageClasses = (image: SelectionImage): string => {
    const classes = []

    if (image.is_selected) {
        classes.push('border-green-500 ring-2 ring-green-200')
    } else {
        classes.push('border-transparent hover:border-neutral-300')
    }

    return classes.join(' ')
}

const getImageActions = (image: SelectionImage) => {
    const actions = []

    // View image action
    actions.push({
        label: 'Voir l\'image',
        icon: 'i-lucide-eye',
        onSelect: () => handleImageClick(image)
    })

    // Download JPEG action
    actions.push({
        label: 'Télécharger JPEG',
        icon: 'i-lucide-download',
        onSelect: () => downloadImage(image.file_url, false)
    })

    // Download RAW action if available
    if (image.requires_conversion && image.source_file_url) {
        actions.push({
            label: `Télécharger ${(image.source_format || 'RAW').toUpperCase()} original`,
            icon: 'i-lucide-camera',
            onSelect: () => downloadImage(image.source_file_url!, true, image.source_format || undefined)
        })
    }

    // Delete action
    if (props.canDelete) {
        if (actions.length > 0) {
            actions.push({ type: 'separator' })
        }
        actions.push({
            label: 'Supprimer',
            icon: 'i-lucide-trash-2',
            color: 'error',
            onSelect: () => emit('delete-image', image.id)
        })
    }

    return [actions] // Wrap in array for grouped structure
}

// Event handlers
const handleToggleSelection = (imageId: string, selected: boolean) => {
    if (props.canToggleSelection) {
        emit('toggle-selection', imageId, selected)
    }
}

const handleImageError = (event: Event) => {
    console.error('Failed to load image:', event)
    // Could implement fallback image here
}

const downloadImage = async (filePath: string, isOriginal: boolean = false, imageFormat?: string) => {
    try {
        const selectionStore = useSelectionStore()

        // Generate appropriate filename with correct extension
        const timestamp = Date.now()
        let extension = 'jpg'

        if (isOriginal && imageFormat) {
            // Use the original format for RAW files
            extension = imageFormat.toLowerCase()
        }

        const filename = `image_${timestamp}.${extension}`

        await selectionStore.downloadImage(filePath, filename, true)

        const toast = useToast()
        toast.add({
            title: 'Téléchargement lancé',
            description: 'Le téléchargement de l\'image a commencé.',
            icon: 'i-lucide-download',
            color: 'success'
        })
    } catch (error) {
        console.error('Download failed:', error)
        const toast = useToast()
        toast.add({
            title: 'Erreur de téléchargement',
            description: error instanceof Error ? error.message : 'Erreur lors du téléchargement',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}


</script>