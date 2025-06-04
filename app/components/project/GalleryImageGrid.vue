<template>
    <div class="space-y-3">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div v-for="(image, index) in displayImages" :key="image.id"
                class="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                @click="$emit('image-click', image)">

                <!-- Image -->
                <img :src="getImageUrl(image.file_url)" :alt="`Image ${index + 1}`" class="w-full h-full object-cover"
                    loading="lazy">

                <!-- Overlay -->
                <div
                    class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div class="flex items-center gap-2">
                        <UButton icon="i-lucide-eye" size="xs" color="primary" variant="solid"
                            @click.stop="$emit('image-click', image)" />

                        <UButton v-if="canDelete" icon="i-lucide-trash-2" size="xs" color="error" variant="solid"
                            @click.stop="$emit('delete-image', image.id)" />
                    </div>
                </div>
                </img>
            </div>
        </div>

        <!-- Show more button if there are more images -->
        <div v-if="images.length > maxPreview" class="text-center">
            <UButton icon="i-lucide-plus" variant="outline" color="neutral"
                :label="`Voir ${images.length - maxPreview} image${images.length - maxPreview > 1 ? 's' : ''} de plus`"
                @click="showAll = !showAll" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { GalleryImage } from '~/types/gallery';

interface Props {
    images: GalleryImage[]
    maxPreview?: number
    canDelete?: boolean
}

interface Emits {
    (e: 'image-click', image: GalleryImage): void
    (e: 'delete-image', imageId: string): void
}

const props = withDefaults(defineProps<Props>(), {
    maxPreview: 6,
    canDelete: false
})

defineEmits<Emits>()

const showAll = ref(false)

const displayImages = computed(() => {
    if (showAll.value || props.images.length <= props.maxPreview) {
        return props.images
    }
    return props.images.slice(0, props.maxPreview)
})

// Get real image URL using the gallery repository
const getImageUrl = (filePath: string) => {
    try {
        // Use the public URL method from Supabase directly
        const supabase = useSupabaseClient()
        const { data } = supabase.storage
            .from('gallery-images')
            .getPublicUrl(filePath)
        return data.publicUrl
    } catch (error) {
        console.error('Error getting image URL:', error)
        return `https://via.placeholder.com/300x300?text=Error`
    }
}
</script>